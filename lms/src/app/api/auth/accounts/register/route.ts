import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { accountsId, password, confirmPassword, role } = await req.json();
    const client = await clientPromise;
    const db = client.db('lms');

    // Validate the input
    if (!accountsId || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if role is Accounts
    if (role !== 'Accounts') {
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

    // Check if accounts ID format is valid (ACC-XXXX)
    const accountsIdPattern = /^ACC-\d{4}$/;
    if (!accountsIdPattern.test(accountsId)) {
      return NextResponse.json(
        { error: 'Accounts ID must be in the format ACC-XXXX' },
        { status: 400 }
      );
    }

    // Check if accounts ID already exists
    const existingUser = await db.collection('users').findOne({ accountsId });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Accounts ID already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data
    const userData = {
      accountsId,
      password: hashedPassword,
      role: 'Accounts',
      createdAt: new Date(),
      isVerified: true
    };

    // Insert the user
    const result = await db.collection('users').insertOne(userData);

    return NextResponse.json(
      { message: 'Accounts user created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Accounts registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
