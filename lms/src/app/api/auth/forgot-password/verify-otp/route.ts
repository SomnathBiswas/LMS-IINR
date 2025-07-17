import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('lms');

    // Check if user with this phone number exists
    const user = await db.collection('users').findOne({ phone });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this phone number' },
        { status: 404 }
      );
    }

    // Find the OTP record
    const otpRecord = await db.collection('otps').findOne({ phone });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'No OTP found for this phone number' },
        { status: 404 }
      );
    }

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Generate a reset token
    const resetToken = jwt.sign(
      { 
        userId: user._id.toString(),
        phone: user.phone,
        purpose: 'password-reset'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Mark OTP as used
    await db.collection('otps').updateOne(
      { phone },
      { $set: { used: true } }
    );

    return NextResponse.json({
      message: 'OTP verified successfully',
      resetToken
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
