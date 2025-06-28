import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// This endpoint will return a list of all faculty members with complete details
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // Get all faculty users from the database with complete details
    const facultyMembers = await db.collection('users')
      .find({ role: 'Faculty' })
      .project({
        name: 1,
        email: 1,
        phone: 1,
        role: 1,
        department: 1,
        subjects: 1,
        profilePicture: 1,
        status: 1,
        facultyId: 1,
      })
      .toArray();
    
    return NextResponse.json({ facultyMembers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching faculty members:', error);
    return NextResponse.json({ error: 'Failed to fetch faculty members' }, { status: 500 });
  }
}
