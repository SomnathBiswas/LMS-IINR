import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// GET /api/handovers/[id] - Get a specific handover request
type GetContext = {
  params: {
    id: string;
  };
};
export async function GET(request: NextRequest, context: GetContext) {
  try {
    const { db } = await connectToDatabase();
    const { id } = context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid handover ID' },
        { status: 400 }
      );
    }

    const handover = await db.collection('handovers').findOne({
      _id: new ObjectId(id),
    });

    if (!handover) {
      return NextResponse.json(
        { error: 'Handover request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ handover });
  } catch (error) {
    console.error('Error fetching handover request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch handover request' },
      { status: 500 }
    );
  }
}

// PATCH /api/handovers/[id] - Update a handover request (for HOD approval/rejection)
type PatchContext = {
  params: {
    id: string;
  };
};
export async function PATCH(request: NextRequest, context: PatchContext) {
  try {
    const { db } = await connectToDatabase();
    const { id } = context.params;
    const data = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid handover ID' },
        { status: 400 }
      );
    }

    // Only allow updating specific fields
    const allowedUpdates = ['status', 'hodComments'];
    const updates: any = {};

    Object.keys(data).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = data[key];
      }
    });

    updates.updatedAt = new Date();

    const result = await db
      .collection('handovers')
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Handover request not found' },
        { status: 404 }
      );
    }

    if (updates.status === 'Approved') {
      const handoverRequest = await db
        .collection('handovers')
        .findOne({ _id: new ObjectId(id) });

      if (handoverRequest) {
        const {
          substituteId,
          substituteName,
          dateOfClass,
          timeSlot,
          subject,
          course,
          facultyName,
          facultyId,
          roomNo,
        } = handoverRequest;

        const classDate = new Date(dateOfClass);
        const formattedDate = `${classDate.getFullYear()}-${String(
          classDate.getMonth() + 1
        ).padStart(2, '0')}-${String(classDate.getDate()).padStart(2, '0')}`;

        await db.collection('notifications').insertOne({
          userId: substituteId,
          title: 'You are assigned a New Handover',
          description: `You have been assigned as a substitute for ${facultyName}'s class on ${formattedDate} at ${timeSlot}. Subject: ${subject}, Course: ${course}.`,
          type: 'handover',
          relatedId: id,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await db.collection('notifications').insertOne({
          userId: facultyId,
          title: 'Handover Request Approved',
          description: `Your handover request for ${formattedDate} at ${timeSlot} has been approved. ${substituteName} will substitute for your class.`,
          type: 'handover',
          relatedId: id,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const daysOfWeek = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        const dayOfWeek = daysOfWeek[new Date(dateOfClass).getDay()];

        try {
          const routineDoc = await db
            .collection('routines')
            .find({ facultyId: substituteId })
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();

          if (routineDoc.length > 0) {
            await db.collection('routines').updateOne(
              { _id: routineDoc[0]._id },
              {
                $push: {
                  entries: {
                    day: dayOfWeek,
                    timeSlot,
                    subject,
                    course,
                    department: course,
                    roomNo: roomNo || 'TBD',
                    handover: true,
                    originalFacultyId: facultyId,
                    originalFacultyName: facultyName,
                    handoverDate: new Date(dateOfClass),
                    handoverId: id,
                  },
                } as any,
              }
            );
          } else {
            await db.collection('routines').insertOne({
              facultyId: substituteId,
              entries: [
                {
                  day: dayOfWeek,
                  timeSlot,
                  subject,
                  course,
                  department: course,
                  roomNo: roomNo || 'TBD',
                  handover: true,
                  originalFacultyId: facultyId,
                  originalFacultyName: facultyName,
                  handoverDate: new Date(dateOfClass),
                  handoverId: id,
                },
              ],
            });
          }

          const originalFacultyRoutine = await db
            .collection('routines')
            .findOne({ facultyId });

          if (originalFacultyRoutine) {
            // Attempt to update the specific class entry to mark it as "Handed Over"
            const classIdAsObjectId = ObjectId.isValid(handoverRequest.classId)
              ? new ObjectId(handoverRequest.classId)
              : null;

            const updateQuery = {
              facultyId,
              entries: {
                $elemMatch: {
                  $or: [
                    { id: handoverRequest.classId },
                    ...(classIdAsObjectId
                      ? [{ _id: classIdAsObjectId }]
                      : []),
                  ],
                },
              },
            };

            const updateOperation = {
              $set: {
                'entries.$.handoverStatus': 'Handed Over',
                'entries.$.substituteId': substituteId,
                'entries.$.substituteName': substituteName,
                'entries.$.handoverId': id,
              },
            };

            const updateResult = await db
              .collection('routines')
              .updateOne(updateQuery, updateOperation);

            console.log(
              `Update original faculty routine result for facultyId ${facultyId} and classId ${handoverRequest.classId}: Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`
            );

            if (updateResult.modifiedCount === 0) {
              console.warn(
                `Could not find and update routine entry for classId ${handoverRequest.classId}. The class status will not be updated to 'Handed Over' on the dashboard.`
              );
            }
          } else {
            await db.collection('routines').insertOne({
              facultyId,
              entries: [
                {
                  day: dayOfWeek,
                  timeSlot,
                  subject,
                  course,
                  department: course,
                  roomNo: roomNo || 'TBD',
                  handoverStatus: 'Handed Over',
                  substituteId: substituteId,
                  substituteName: substituteName,
                  handoverDate: new Date(dateOfClass),
                  handoverId: id,
                },
              ],
            });
          }
        } catch (error) {
          console.error('Error updating routine with handover class:', error);
        }
      }
    }

    return NextResponse.json({
      message: 'Handover request updated successfully',
    });
  } catch (error) {
    console.error('Error updating handover request:', error);
    return NextResponse.json(
      { error: 'Failed to update handover request' },
      { status: 500 }
    );
  }
}
