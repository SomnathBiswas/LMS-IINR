import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

interface ClassEntry {
  day?: string;
  subject?: string;
  timeSlot?: string;
  roomNumber?: string;
  attendanceStatus?: string;
  status?: string;
}

interface Routine {
  _id: ObjectId;
  startDate?: string | Date;
  endDate?: string | Date;
  entries?: ClassEntry[];
  updatedAt?: Date | string;
  createdAt?: Date | string;
}

interface Faculty {
  _id: string | ObjectId;
  name: string;
  email?: string;
  department?: string;
}

// This endpoint will get statistics for a specific faculty
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    console.log(`[HOD GET] Fetching statistics for faculty: ${facultyId} from ${startDate} to ${endDate}`);

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
        console.warn(`[HOD GET] Could not convert facultyId to ObjectId: ${e}`);
      }
    }

    const allRoutines = await db.collection('routines').find({ $or: facultyIdQuery }).toArray();
    console.log(`[HOD GET] Found ${allRoutines.length} total routines for faculty ${facultyId}.`);

    // 2. Filter for routines that are active within the date range
    const startDateObj = new Date(startDate);
    startDateObj.setHours(0, 0, 0, 0);
    
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    const activeRoutines = allRoutines.filter(routine => {
      if (!routine.startDate) return false;
      
      const routineStartDate = new Date(routine.startDate);
      routineStartDate.setHours(0, 0, 0, 0);
      
      const routineEndDate = routine.endDate ? new Date(routine.endDate) : new Date(2099, 11, 31);
      if (routineEndDate) {
        routineEndDate.setHours(23, 59, 59, 999);
      }

      // Check if the routine overlaps with the requested date range
      return (
        (routineStartDate <= endDateObj && routineEndDate >= startDateObj)
      );
    });

    console.log(`[HOD GET] Found ${activeRoutines.length} active routines within date range.`);

    // 3. Process all classes from the selected routines within the date range
    const classes = [];
    let totalClasses = 0;
    let takenClasses = 0;
    let missedClasses = 0;
    let handoverClasses = 0;
    
    for (const routine of activeRoutines) {
      if (routine.entries && Array.isArray(routine.entries)) {
        // For each routine, we need to calculate which days within our date range match the routine days
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Create a map of day name to entries for that day
        const entriesByDay: Record<string, ClassEntry[]> = {};
        for (const entry of routine.entries) {
          const day = entry.day || '';
          const dayKey = day.toLowerCase();
          if (!entriesByDay[dayKey]) {
            entriesByDay[dayKey] = [];
          }
          entriesByDay[dayKey].push(entry);
        }
        
        // Iterate through each date in the range
        const currentDate = new Date(startDateObj);
        while (currentDate <= endDateObj) {
          const dayName = days[currentDate.getDay()].toLowerCase();
          const entriesForDay = entriesByDay[dayName] || [];
          
          // Check if this date falls within the routine's active period
          const routineStartDate = routine.startDate ? new Date(routine.startDate) : new Date(0);
          routineStartDate.setHours(0, 0, 0, 0);
          
          const routineEndDate = routine.endDate ? new Date(routine.endDate) : new Date(2099, 11, 31);
          routineEndDate.setHours(23, 59, 59, 999);
          
          if (currentDate >= routineStartDate && currentDate <= routineEndDate) {
            // Add all entries for this day to our classes array
            for (const entry of entriesForDay) {
              totalClasses++;
              
              const status = entry.attendanceStatus || entry.status || 'upcoming';
              if (status.toLowerCase() === 'taken') {
                takenClasses++;
              } else if (status.toLowerCase() === 'missed') {
                missedClasses++;
              } else if (status.toLowerCase() === 'handover') {
                handoverClasses++;
              }
              
              classes.push({
                date: new Date(currentDate).toISOString().split('T')[0],
                subject: entry.subject || 'N/A',
                timeSlot: entry.timeSlot || 'N/A',
                status: status,
                roomNumber: entry.roomNumber || 'N/A',
              });
            }
          }
          
          // Move to the next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    // 4. Calculate statistics
    const attendancePercentage = totalClasses > 0 ? (takenClasses / totalClasses) * 100 : 0;
    
    // Get faculty details
    let faculty = null;
    if (ObjectId.isValid(facultyId)) {
      faculty = await db.collection('users').findOne({ _id: new ObjectId(facultyId) }) as Faculty | null;
    } else {
      // Use a different field for string IDs to avoid type errors
      faculty = await db.collection('users').findOne({ userId: facultyId }) as Faculty | null;
    }
    const facultyName = faculty ? faculty.name : 'Unknown Faculty';
    
    const statistics = {
      facultyId,
      facultyName,
      totalClasses,
      takenClasses,
      missedClasses,
      handoverClasses,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100,
      classes
    };

    return NextResponse.json({ success: true, statistics }, { status: 200 });

  } catch (error) {
    console.error('Error fetching faculty statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
