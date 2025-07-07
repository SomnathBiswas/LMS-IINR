import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// This endpoint will seed some test faculty members for development
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // Check if we already have faculty members
    const existingFaculty = await db.collection('users').find({
      $or: [
        { role: { $in: ['Faculty', 'faculty', 'FACULTY'] } },
        { userType: { $in: ['Faculty', 'faculty', 'FACULTY'] } }
      ]
    }).toArray();
    
    if (existingFaculty.length > 0) {
      return NextResponse.json({ 
        message: `${existingFaculty.length} faculty members already exist`, 
        faculty: existingFaculty 
      }, { status: 200 });
    }
    
    // Sample faculty data
    const facultyMembers = [
      {
        _id: new ObjectId(),
        name: 'Somnath Biswas',
        email: 'somnath.biswas@iinr.edu',
        role: 'Faculty',
        department: 'Nursing',
        subjectsKnown: ['CHN-I', 'Child Health Nursing', 'Nutrition'],
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'Priya Sharma',
        email: 'priya.sharma@iinr.edu',
        role: 'Faculty',
        department: 'Nursing',
        subjectsKnown: ['Medical Surgical Nursing', 'Anatomy', 'Physiology'],
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@iinr.edu',
        role: 'Faculty',
        department: 'Nursing',
        subjectsKnown: ['Mental Health Nursing', 'Psychology', 'Sociology'],
        createdAt: new Date()
      }
    ];
    
    // Insert faculty members
    const result = await db.collection('users').insertMany(facultyMembers);
    
    return NextResponse.json({ 
      success: true, 
      message: `${result.insertedCount} faculty members created`,
      faculty: facultyMembers
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error seeding faculty data:', error);
    return NextResponse.json({ error: 'Failed to seed faculty data' }, { status: 500 });
  }
}
