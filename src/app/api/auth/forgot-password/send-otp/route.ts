import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

// In a real application, you would use a proper SMS service like Twilio
// For this demo, we'll simulate OTP generation and storage
const generateOTP = () => {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
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

    // Generate OTP
    const otp = generateOTP();
    
    // Generate expiry time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Store OTP in database
    await db.collection('otps').updateOne(
      { phone },
      { 
        $set: {
          otp,
          expiresAt,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    // In a real application, you would send the OTP via SMS
    console.log(`OTP for ${phone}: ${otp}`);

    return NextResponse.json({
      message: 'OTP sent successfully',
      // For development purposes only, we're returning the OTP
      // In production, this should NEVER be returned to the client
      otp: otp // Always return OTP in this demo version
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
