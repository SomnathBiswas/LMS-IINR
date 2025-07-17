import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, securityId, password, confirmPassword, role } = await req.json();
    const client = await clientPromise;
    const db = client.db('lms');

    // Validate the input
    if (!name || !securityId || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if role is Security
    if (role !== 'Security') {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check if security ID format is valid (S-XXXX)
    const securityIdPattern = /^S-\d{4}$/;
    if (!securityIdPattern.test(securityId)) {
      return NextResponse.json(
        { error: 'Security ID must be in the format S-XXXX' },
        { status: 400 }
      );
    }

    // Check if security ID already exists
    const existingUser = await db.collection('users').findOne({ securityId });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Security ID already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data
    const userData = {
      name,
      securityId,
      password: hashedPassword,
      role: 'Security',
      createdAt: new Date(),
      isVerified: true
    };

    // Insert the user
    const result = await db.collection('users').insertOne(userData);

    return NextResponse.json(
      { message: 'Security account created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Security registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
