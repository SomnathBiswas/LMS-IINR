import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// This endpoint will return a list of all faculty members
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // Get all faculty users from the database with more flexible query
    // Some systems might use 'role', others might use 'userType' or have faculty in different formats
    const facultyMembers = await db.collection('users')
      .find({
        $or: [
          { role: { $in: ['Faculty', 'faculty', 'FACULTY'] } },
          { userType: { $in: ['Faculty', 'faculty', 'FACULTY'] } },
          { type: { $in: ['Faculty', 'faculty', 'FACULTY'] } },
          { isFaculty: true }
        ]
      })
      .project({ 
        _id: 1, 
        name: 1, 
        email: 1, 
        department: 1,
        facultyId: 1,
        subjectsKnown: 1 // Include subjects the faculty is qualified to teach
      })
      .toArray();
    
    // If no faculty members found, try to get any users as a fallback
    if (facultyMembers.length === 0) {
      console.log('No faculty members found with standard queries, fetching all users as fallback');
      const allUsers = await db.collection('users')
        .find({})
        .limit(10) // Limit to prevent too many results
        .project({ 
          _id: 1, 
          name: 1, 
          email: 1, 
          department: 1
        })
        .toArray();
      
      return NextResponse.json({ facultyMembers: allUsers }, { status: 200 });
    }
    
    return NextResponse.json({ facultyMembers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching faculty members:', error);
    return NextResponse.json({ error: 'Failed to fetch faculty members' }, { status: 500 });
  }
}
