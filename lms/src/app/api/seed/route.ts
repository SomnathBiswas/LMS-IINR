import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// GET: Seed database with sample data for testing
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const result: any = { success: true, created: {} };
    
    // 1. Create sample faculty users if they don't exist
    const existingFaculty = await db.collection('users').find({ role: 'Faculty' }).toArray();
    
    if (existingFaculty.length === 0) {
      const facultyData = [
        {
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@example.com',
          role: 'Faculty',
          department: 'Nursing',
          createdAt: new Date()
        },
        {
          name: 'Prof. Michael Chen',
          email: 'michael.chen@example.com',
          role: 'Faculty',
          department: 'Nursing',
          createdAt: new Date()
        },
        {
          name: 'Dr. Emily Rodriguez',
          email: 'emily.rodriguez@example.com',
          role: 'Faculty',
          department: 'Nursing',
          createdAt: new Date()
        }
      ];
      
      const insertedFaculty = await db.collection('users').insertMany(facultyData);
      result.created.faculty = insertedFaculty.insertedCount;
      
      // Store faculty IDs for creating routines
      const facultyIds = Object.values(insertedFaculty.insertedIds).map(id => id.toString());
      
      // 2. Create sample routines
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const subjects = ['Anatomy', 'Physiology', 'Pharmacology', 'Medical Ethics', 'Clinical Practice'];
      const courses = ['BSc Nursing', 'GNM'];
      const rooms = ['101', '102', '103', '201', '202'];
      
      // Define routine interface
      interface RoutineData {
        facultyId: string;
        day: string;
        subject: string;
        course: string;
        department: string;
        roomNo: string;
        timeSlot: string;
        createdAt: Date;
      }
      
      const routineData: RoutineData[] = [];
      
      // Create routines for each faculty
      facultyIds.forEach((facultyId, facultyIndex) => {
        days.forEach((day, dayIndex) => {
          // Each faculty has 1-2 classes per day
          const classCount = (facultyIndex + dayIndex) % 2 === 0 ? 2 : 1;
          
          for (let i = 0; i < classCount; i++) {
            const startHour = 9 + (facultyIndex + i) % 8; // Classes between 9 AM and 4 PM
            const endHour = startHour + 1;
            
            routineData.push({
              facultyId: facultyId,
              day: day,
              subject: subjects[(facultyIndex + dayIndex + i) % subjects.length],
              course: courses[(facultyIndex + i) % courses.length],
              department: 'Nursing',
              roomNo: rooms[(facultyIndex + dayIndex) % rooms.length],
              timeSlot: `${startHour}:00 - ${endHour}:00`,
              createdAt: new Date()
            });
          }
        });
      });
      
      const insertedRoutines = await db.collection('routines').insertMany(routineData);
      result.created.routines = insertedRoutines.insertedCount;
      
      // 3. Create some sample attendance records for today
      const today = new Date().toISOString().split('T')[0];
      const routineIds = Object.values(insertedRoutines.insertedIds).map(id => id.toString());
      
      // Mark attendance for some of today's routines
      const todayRoutines = routineData.filter(r => r.day === days[new Date().getDay() - 1]);
      
      if (todayRoutines.length > 0) {
        const attendanceData = todayRoutines.slice(0, Math.ceil(todayRoutines.length / 2)).map((routine, index) => {
          return {
            routineId: routineIds[index],
            facultyId: routine.facultyId,
            date: today,
            markedBy: 'HOD',
            absentStudents: index % 3 === 0 ? ['Student 1', 'Student 3'] : [],
            createdAt: new Date()
          };
        });
        
        const insertedAttendance = await db.collection('attendanceRecords').insertMany(attendanceData);
        result.created.attendanceRecords = insertedAttendance.insertedCount;
      }
    } else {
      result.message = 'Database already has faculty data. Skipping seed process.';
      result.existingFaculty = existingFaculty.length;
    }
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error seeding database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to seed database', details: errorMessage },
      { status: 500 }
    );
  }
}
