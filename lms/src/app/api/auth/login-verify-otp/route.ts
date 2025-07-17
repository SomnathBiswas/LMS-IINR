import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { isOTPExpired } from '@/models/otp';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    const { email, otp, role } = await req.json();

    // Validate input
    if (!email || !otp || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('lms');

    // Find the OTP record - don't require role in the query to be more flexible
    const otpRecord = await db.collection('otps').findOne({
      email,
      otp,
      verified: false
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Convert MongoDB document to OTP type
    const otpData = {
      email: otpRecord.email as string,
      otp: otpRecord.otp as string,
      createdAt: otpRecord.createdAt as Date,
      expiresAt: otpRecord.expiresAt as Date,
      verified: otpRecord.verified as boolean
    };

    // Check if OTP is expired
    if (isOTPExpired(otpData)) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await db.collection('otps').updateOne(
      { _id: otpRecord._id },
      { $set: { verified: true } }
    );

    // Just verify the OTP - we'll do the actual login in the client
    console.log('OTP verified for email:', email);

    // Return success response
    return NextResponse.json(
      { 
        message: 'OTP verified successfully',
        verified: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
