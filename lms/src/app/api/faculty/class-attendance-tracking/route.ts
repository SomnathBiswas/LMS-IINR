import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// This endpoint will get the class schedule for a specific faculty for today
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }

    const today = new Date(date);
    const dayOfWeek = today.getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dayOfWeek];

    console.log(`[Faculty GET] Fetching class schedule for faculty: ${facultyId} on date: ${date} (${dayName})`);

    // 1. Get all routines for the specified faculty, checking multiple possible ID fields
    const facultyIdQuery: any[] = [
        { facultyId: facultyId },
        { teacherId: facultyId },
        { faculty_id: facultyId },
        { teacher_id: facultyId }
    ];
    if (ObjectId.isValid(facultyId)) {
        try {
            facultyIdQuery.push({ facultyId: new ObjectId(facultyId) });
            facultyIdQuery.push({ teacherId: new ObjectId(facultyId) });
        } catch (e) {
            console.warn(`[Faculty GET] Could not convert facultyId to ObjectId: ${e}`);
        }
    }

    const allRoutines = await db.collection('routines').find({ $or: facultyIdQuery }).toArray();
    console.log(`[Faculty GET] Found ${allRoutines.length} total routines for faculty ${facultyId}.`);

    // 2. Filter for routines that are active today
    const todayNormalized = new Date(date);
    todayNormalized.setHours(0, 0, 0, 0);

    const activeRoutines = allRoutines.filter(routine => {
      if (!routine.startDate) return false;
      
      const startDate = new Date(routine.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = routine.endDate ? new Date(routine.endDate) : null;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }

      return todayNormalized >= startDate && (!endDate || todayNormalized <= endDate);
    });
    console.log(`[Faculty GET] Found ${activeRoutines.length} active routines for today.`);

    // 3. Find the single most recent active routine
    let latestRoutine = null;
    if (activeRoutines.length > 0) {
      latestRoutine = activeRoutines.reduce((latest, current) => {
        const getTimestamp = (r: any) => {
          const ts = r.updatedAt || r.createdAt || 0;
          if (ts instanceof Date) return ts.getTime();
          if (typeof ts === 'string') return new Date(ts).getTime() || 0;
          return Number(ts) || 0;
        };
        return getTimestamp(current) > getTimestamp(latest) ? current : latest;
      });
    }
    
    // 4. Process today's classes from the selected routine
    const classes = [];
    if (latestRoutine && latestRoutine.entries && Array.isArray(latestRoutine.entries)) {
      console.log(`[Faculty GET] Processing latest routine ${latestRoutine._id} with ${latestRoutine.entries.length} entries.`);
      const todayEntries = latestRoutine.entries.filter((entry: any) => {
        const entryDay = entry.day || '';
        return entryDay.toLowerCase() === dayName.toLowerCase();
      });

      for (const entry of todayEntries) {
        let [startTime, endTime] = (entry.timeSlot || " - ").split(/–|-|to/).map((t: string) => t.trim());

        classes.push({
          _id: entry.id || entry._id || new ObjectId().toString(),
          id: entry.id || entry._id?.toString(),
          parentRoutineId: latestRoutine._id.toString(),
          subject: entry.subject || 'N/A',
          course: entry.course || 'N/A',
          time: `${startTime || ''} - ${endTime || ''}`,
          startTime: startTime || '',
          endTime: endTime || '',
          roomNumber: entry.roomNumber || '',
          status: entry.attendanceStatus || entry.status || 'pending',
        });
      }
    }
    console.log(`[Faculty GET] Processed ${classes.length} classes for today's schedule.`);

    // 5. Recalculate status for pending classes based on time
    const now = new Date();
    const finalClasses = classes.map(cls => {
      if (cls.status === 'pending') {
        const [endHours, endMinutes] = (cls.endTime || '').split(':').map(Number);
        if (!isNaN(endHours) && !isNaN(endMinutes)) {
          const classEndDate = new Date(date);
          classEndDate.setHours(endHours, endMinutes, 0, 0);
          const gracePeriodEnd = new Date(classEndDate.getTime() + 30 * 60 * 1000);

          if (now > gracePeriodEnd) {
            cls.status = 'missed';
          }
        }
      }
      return cls;
    });

    return NextResponse.json({ success: true, classes: finalClasses }, { status: 200 });

  } catch (error) {
    console.error('Error fetching faculty schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

// This endpoint will create or update an attendance record
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data = await request.json();
    
    const { facultyId, classId, status, date, parentRoutineId } = data;

    if (!facultyId || !classId || !status || !date || !parentRoutineId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the specific entry within the routine document
    const updateResult = await db.collection('routines').updateOne(
      { _id: new ObjectId(parentRoutineId), "entries.id": classId },
      { 
        $set: { 
          "entries.$.status": status,
          "entries.$.attendanceStatus": status,
          "entries.$.updatedBy": "Faculty",
          "entries.$.lastUpdated": new Date().toISOString(),
          updatedAt: new Date(),
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.error(`[Faculty POST] Failed to update routine entry. RoutineId: ${parentRoutineId}, EntryId: ${classId}`);
      return NextResponse.json({ error: 'Failed to update routine status. Entry not found.' }, { status: 404 });
    }
    
    console.log(`[Faculty POST] Successfully updated status to "${status}" for entry ${classId} in routine ${parentRoutineId}`);

    return NextResponse.json({ success: true, message: 'Attendance status updated successfully.' });

  } catch (error) {
    console.error('Error saving attendance record:', error);
    return NextResponse.json({ error: 'Failed to save attendance record' }, { status: 500 });
  }
}
