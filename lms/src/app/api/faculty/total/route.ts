import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// This endpoint will return the total count of faculty users
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // Get total count of all teaching staff from the database
    // This includes Faculty, Lecturers, Professors, etc. but excludes HOD
    const totalTeachers = await db.collection('users').countDocuments({
      $and: [
        { 
          $or: [
            { role: 'Faculty' },
            { role: 'Professor' },
            { role: 'Lecturer' },
            { role: 'Teacher' },
            { role: 'Instructor' }
          ]
        },
        { role: { $ne: 'HOD' } }
      ]
    });
    
    return NextResponse.json({ totalTeachers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching total teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch total teachers' }, { status: 500 });
  }
}
