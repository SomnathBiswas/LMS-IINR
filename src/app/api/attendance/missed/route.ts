import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Routine, AttendanceRecord } from '@/models/schema';
import { ObjectId } from 'mongodb';

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const searchParams = request.nextUrl.searchParams;
    const fetchAll = searchParams.get('all') === 'true';

    if (fetchAll) {
      const today = new Date();
      const missedClasses = [];
      
      // Fetch all necessary data in parallel
      const [allRoutines, allAttendance, users] = await Promise.all([
        db.collection('routines').find({}).toArray(),
        db.collection('attendanceRecords').find({}).toArray(),
        db.collection('users').find({ role: 'Faculty' }).toArray()
      ]);
      
      // Create maps for efficient lookups
      const userMap = new Map(users.map(u => [u._id.toString(), u]));
      const attendedSet = new Set(allAttendance.map(att => {
        // Use a consistent key for the attendance set
        const key = att.classId || att.routineId;
        const date = new Date(att.date).toISOString().split('T')[0];
        return `${key}_${date}`;
      }));

      console.log('Attended Set:', attendedSet);

      // Iterate over the last 90 days
      for (let i = 0; i < 90; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });

        // Filter routines for the current day of the week
        for (const routine of allRoutines) {
          if (routine.entries && routine.facultyId) {
            for (const entry of routine.entries) {
              const entryDay = entry.day || '';
              if (entryDay.toLowerCase() === dayOfWeek.toLowerCase()) {
                const [startTime] = (entry.time || entry.timeSlot || '').split('-');
                if (startTime) {
                  const classDateTime = new Date(`${dateStr}T${startTime.trim()}`);
                  // Check if the class time is in the past
                  if (classDateTime < today) {
                    const attendanceKey = `${entry.id}_${dateStr}`;
                    console.log('Checking for attendance key:', attendanceKey);
                    if (!attendedSet.has(attendanceKey)) {
                      const faculty = userMap.get(routine.facultyId.toString());
                      missedClasses.push({
                        id: entry.id,
                        subject: entry.subject,
                        facultyName: faculty?.name || 'N/A',
                        time: entry.time || entry.timeSlot,
                        date: dateStr,
                        parentRoutineId: routine._id?.toString(),
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
      console.log('Total missed classes found:', missedClasses.length);
      return NextResponse.json(missedClasses);
    } else {
      // Original logic to fetch today's missed classes
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const dayOfWeek = now.toLocaleString('en-US', { weekday: 'long' });

      const routines = await db.collection<Routine>('routines').find({
        'entries.day': dayOfWeek,
      }).toArray();

      const missedClasses = [];

      for (const routine of routines) {
          if (routine.entries) {
              for (const entry of routine.entries) {
                  if (entry.day === dayOfWeek) {
                      const [startTime] = (entry.time || entry.timeSlot || '').split('-');
                      if (startTime) {
                          const classStartTime = new Date(`${todayStr}T${startTime.trim()}`);
                          const windowEndTime = new Date(classStartTime.getTime() + 20 * 60 * 1000);

                          if (windowEndTime < now) {
                              const attendanceRecord = await db.collection<AttendanceRecord>('attendanceRecords').findOne({
                                  date: todayStr,
                                  $or: [
                                      { classId: entry.id },
                                      { routineId: entry.id }
                                  ]
                              });

                              if (!attendanceRecord) {
                                  const faculty = await db.collection('users').findOne({ _id: new ObjectId(routine.facultyId) });
                                  missedClasses.push({
                                      _id: entry.id,
                                      class: entry.subject,
                                      teacher: faculty?.name || 'N/A',
                                      time: entry.time || entry.timeSlot,
                                      reason: 'Not Marked',
                                      routineId: routine._id?.toString(),
                                  });
                              }
                          }
                      }
                  }
              }
          }
      }
      return NextResponse.json({ missedClasses });
    }
  } catch (error) {
    console.error('Error fetching missed classes:', error);
    return NextResponse.json({ message: 'An error occurred while fetching missed classes' }, { status: 500 });
  }
}