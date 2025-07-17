import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    const substituteId = searchParams.get('substituteId');
    const dateOfClass = searchParams.get('dateOfClass');
    const timeSlot = searchParams.get('timeSlot');
    
    if (!substituteId || !dateOfClass || !timeSlot) {
      return NextResponse.json(
        { error: 'Missing required parameters: substituteId, dateOfClass, and timeSlot are required' },
        { status: 400 }
      );
    }

    // Convert date string to Date object
    const classDate = new Date(dateOfClass);
    
    // Format the date for MongoDB comparison (YYYY-MM-DD format)
    const formattedDate = classDate.toISOString().split('T')[0];
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[classDate.getDay()];

    try {
      // Find the most recent routine for the substitute faculty
      const latestRoutine = await db.collection('routines').find({
        facultyId: substituteId
      }).sort({ createdAt: -1 }).limit(1).toArray();

      let routineDoc = null;
      if (latestRoutine.length > 0) {
        const routine = latestRoutine[0];
        const conflictingEntry = routine.entries.find((entry: any) =>
          entry.day === dayOfWeek && entry.timeSlot === timeSlot
        );
        if (conflictingEntry) {
          routineDoc = routine;
        }
      }

      // Check if the substitute has any handover assignments on this specific date and time
      const existingHandover = await db.collection('handovers').findOne({
        substituteId: substituteId,
        dateOfClass: classDate,
        timeSlot: timeSlot,
        status: "Approved"
      });

      const hasConflict = !!routineDoc || !!existingHandover;
    
      if (hasConflict) {
        // Define the type for conflict details
        interface ConflictDetails {
          day: string;
          timeSlot: string;
          subject: string;
          course: string;
          isHandover?: boolean;
          conflictType: string;
        }
        
        let conflictDetails: ConflictDetails = {
          day: dayOfWeek,
          timeSlot: timeSlot,
          subject: "Unknown",
          course: "Unknown",
          conflictType: "unknown"
        };
        
        if (routineDoc) {
          // Find the specific entry that conflicts
          const conflictingEntry = routineDoc.entries.find((entry: any) =>
            entry.day === dayOfWeek && entry.timeSlot === timeSlot
          );
          
          if (conflictingEntry) {
            conflictDetails = {
              day: conflictingEntry.day,
              timeSlot: conflictingEntry.timeSlot,
              subject: conflictingEntry.subject || "Unknown",
              course: conflictingEntry.course || "Unknown",
              isHandover: !!conflictingEntry.handover,
              conflictType: "regular_class"
            };
          }
        } else if (existingHandover) {
          conflictDetails = {
            day: dayOfWeek,
            timeSlot: existingHandover.timeSlot,
            subject: existingHandover.subject || "Unknown",
            course: existingHandover.course || "Unknown",
            isHandover: true,
            conflictType: "approved_handover"
          };
        }
        
        return NextResponse.json({
          available: false,
          conflict: conflictDetails
        });
      }
    
      return NextResponse.json({ available: true });
    } catch (innerError) {
      console.error('Error in availability check:', innerError);
      return NextResponse.json(
        { error: 'Failed to check substitute availability' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error checking substitute availability:', error);
    return NextResponse.json(
      { error: 'Failed to check substitute availability' },
      { status: 500 }
    );
  }
}
