import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { generateOTP, sendEmail, createOTPEmailTemplate } from '@/lib/email';
import { createOTPRecord } from '@/models/otp';

export async function POST(req: Request) {
  try {
    const { email, userId } = await req.json();

    // Validate input
    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('lms');

    // Verify user exists and is not already verified
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId),
      email,
      isVerified: false
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or already verified' },
        { status: 400 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    
    // Create new OTP record
    const otpRecord = createOTPRecord(email, otp);
    await db.collection('otps').insertOne(otpRecord);
    
    // Get user name for the email
    const userName = user.name || 'user';
    
    // Send verification email with new OTP
    const emailTemplate = createOTPEmailTemplate(otp, userName);
    const emailResult = await sendEmail({
      to: email,
      subject: 'Your New OTP for LMS Registration',
      html: emailTemplate,
    });
    
    // Log the email result
    console.log('Email sent successfully:', emailResult.success);

    return NextResponse.json(
      { message: 'New verification code sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
