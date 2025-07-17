import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Log the token for debugging
    console.log('Token from cookie:', token.value);

    const decoded = jwt.verify(token.value, JWT_SECRET) as {
      userId: string;
      role: string;
      facultyId?: string;
      email?: string;
      name?: string;
      securityId?: string;
      accountsId?: string;
    };

    console.log('Decoded token in user API:', decoded);

    const client = await clientPromise;
    const db = client.db('lms');

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } } // Exclude password from the response
    );

    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User found:', { role: user.role, id: user._id });
    
    // Add token data to response for debugging
    const responseData: any = {
      ...user,
      _tokenRole: decoded.role // For debugging purposes
    };
    
    // Add role-specific data to the response
    if (decoded.role === 'Security' && decoded.securityId) {
      responseData.securityId = decoded.securityId;
    } else if (decoded.role === 'Accounts' && decoded.accountsId) {
      responseData.accountsId = decoded.accountsId;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}