import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toLocaleDateString('en-CA');
    
    const [year, month, day] = date.split('-').map(Number);
    const today = new Date(year, month - 1, day);
    
    const dayOfWeek = today.getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dayOfWeek];

    const allRoutines = await db.collection('routines').find({}).toArray();

    const activeRoutines = allRoutines.filter(routine => {
      if (!routine.startDate) return false;
      
      const startStr = routine.startDate.split('T')[0];
      const [sYear, sMonth, sDay] = startStr.split('-').map(Number);
      const startDate = new Date(sYear, sMonth - 1, sDay);

      let endDate = null;
      if (routine.endDate) {
        const endStr = routine.endDate.split('T')[0];
        const [eYear, eMonth, eDay] = endStr.split('-').map(Number);
        endDate = new Date(eYear, eMonth - 1, eDay);
      }
      
      return today >= startDate && (!endDate || today <= endDate);
    });

    const latestRoutinesByFaculty = new Map();
    for (const routine of activeRoutines) {
      const facultyId = (routine.facultyId || routine.teacherId)?.toString();
      if (!facultyId) continue;
      const existing = latestRoutinesByFaculty.get(facultyId);
      if (!existing || new Date(routine.updatedAt || routine.createdAt).getTime() > new Date(existing.updatedAt || existing.createdAt).getTime()) {
        latestRoutinesByFaculty.set(facultyId, routine);
      }
    }
    const routinesToProcess = Array.from(latestRoutinesByFaculty.values());

    const allFacultyUsers = await db.collection('users').find({}).toArray();
    const classes = [];
    for (const routine of routinesToProcess) {
      if (!routine.entries || !Array.isArray(routine.entries)) continue;

      const todayEntries = routine.entries.filter((entry: any) => (entry.day || '').toLowerCase() === dayName.toLowerCase());

      const faculty = allFacultyUsers.find(f => f._id.toString() === (routine.facultyId || routine.teacherId)?.toString());

      for (const entry of todayEntries) {
        let [startTime, endTime] = (entry.timeSlot || " - ").split(/–|-|to/).map((t: string) => t.trim());

        classes.push({
          _id: entry.id || entry._id || new ObjectId().toString(),
          id: entry.id || entry._id?.toString(),
          originalEntryId: entry.id || entry._id,
          parentRoutineId: routine._id.toString(),
          facultyId: (routine.facultyId || routine.teacherId)?.toString(),
          facultyName: faculty?.name || 'Unknown Faculty',
          subject: entry.subject || 'N/A',
          department: entry.department || faculty?.department || 'General',
          course: entry.course || 'N/A',
          time: `${startTime || ''} - ${endTime || ''}`,
          startTime: startTime || '',
          endTime: endTime || '',
          roomNumber: entry.roomNumber || '',
          status: entry.attendanceStatus || entry.status || 'pending',
          attendanceStatus: entry.attendanceStatus || entry.status || 'pending',
        });
      }
    }

    const now = new Date();
    const finalClasses = await Promise.all(classes.map(async (cls) => {
      if (cls.status === 'pending') {
        const endTimeStr = cls.endTime || '';
        let hours = NaN, minutes = NaN;
        
        const timeParts = endTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeParts) {
          hours = parseInt(timeParts[1], 10);
          minutes = parseInt(timeParts[2], 10);
          const period = timeParts[3].toUpperCase();
          if (period === 'PM' && hours < 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
        }

        if (!isNaN(hours)) {
          const classEndDate = new Date(today);
          classEndDate.setHours(hours, minutes, 0, 0);
          const gracePeriodEnd = new Date(classEndDate.getTime() + 30 * 60 * 1000);

          if (now > gracePeriodEnd) {
            cls.status = 'missed';
            
            await db.collection('routines').updateOne(
              { _id: new ObjectId(cls.parentRoutineId), "entries.id": cls.id },
              {
                $set: {
                  "entries.$.status": "missed",
                  "entries.$.attendanceStatus": "missed",
                  "entries.$.updatedBy": "System (Auto-missed)",
                  "entries.$.lastUpdated": new Date().toISOString(),
                  updatedAt: new Date(),
                }
              }
            );
          }
        }
      }
      return cls;
    }));

    return NextResponse.json({ classes: finalClasses, faculties: allFacultyUsers }, {
      headers: { 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    console.error('Error fetching class attendance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class attendance data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data = await request.json();
    const {
      routineId,
      entryId,
      facultyId,
      date,
      status,
      absentStudents,
      subject,
      facultyName,
    } = data;

    if (!routineId || !entryId || !facultyId || !date || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateResult = await db.collection('routines').updateOne(
      { _id: new ObjectId(routineId), "entries.id": entryId },
      { 
        $set: { 
          "entries.$.status": status,
          "entries.$.attendanceStatus": status,
          "entries.$.absentStudents": absentStudents,
          "entries.$.updatedBy": "HOD",
          "entries.$.lastUpdated": new Date().toISOString(),
          updatedAt: new Date(),
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.error(`[HOD POST] Failed to update routine entry. RoutineId: ${routineId}, EntryId: ${entryId}`);
      return NextResponse.json({ error: 'Failed to update routine status. Entry not found.' }, { status: 404 });
    }
    
    await db.collection('notifications').insertOne({
      userId: facultyId,
      title: `Attendance Updated by HOD`,
      message: `Your attendance for the class on ${date} was updated to "${status}" by your HOD.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      type: 'attendance',
      routineId: routineId,
      entryId: entryId,
      status: status.toLowerCase()
    });

    // If there are absent students, save them to a separate collection
    if (status === 'taken' && absentStudents && absentStudents.length > 0) {
      await db.collection('absent_records').insertOne({
        date: new Date(date),
        facultyId,
        facultyName,
        routineId,
        entryId,
        subject,
        absentStudents,
        recordedAt: new Date(),
        recordedBy: 'HOD', // Or get HOD ID if available
      });
    }

    return NextResponse.json({ success: true, message: 'Attendance status updated successfully.' });

  } catch (error) {
    console.error('Error in HOD POST request:', error);
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
  }
}
