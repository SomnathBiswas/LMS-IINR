import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// This endpoint will return a list of all faculty members
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // Get all faculty users from the database
    const facultyMembers = await db.collection('users')
      .find({ role: 'Faculty' })
      .project({ 
        _id: 1, 
        name: 1, 
        email: 1, 
        department: 1,
        facultyId: 1,
        subjectsKnown: 1 // Include subjects the faculty is qualified to teach
      })
      .toArray();
    
    return NextResponse.json({ facultyMembers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching faculty members:', error);
    return NextResponse.json({ error: 'Failed to fetch faculty members' }, { status: 500 });
  }
}
