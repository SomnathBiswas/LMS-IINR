import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = jwt.verify(token.value, JWT_SECRET) as {
      userId: string;
      facultyId: string;
      role: string;
    };

    // Get the request body
    const body = await request.json();
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('lms');

    // Update the user profile
    const updateResult = await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { 
        $set: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          dateOfBirth: body.dateOfBirth,
          gender: body.gender,
          profilePicture: body.profilePicture
        } 
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the updated user data
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    );

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
