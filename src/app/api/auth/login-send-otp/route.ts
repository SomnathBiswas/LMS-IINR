import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { generateOTP, sendEmail, createOTPEmailTemplate } from '@/lib/email';
import { createOTPRecord } from '@/models/otp';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();

    // Validate input
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('lms');

    // Check if user exists and verify password
    let user;
    if (role === 'HOD') {
      user = await db.collection('users').findOne({ email, role: 'HOD', isVerified: true });
      console.log('HOD OTP request:', { email, userFound: !!user, userId: user?._id?.toString(), userName: user?.name });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log('Password verified for user:', email);

    // Generate OTP for login verification
    const otp = generateOTP();
    
    // Create OTP record with email to ensure we're logging in the correct user
    const otpRecord = {
      ...createOTPRecord(email, otp),
      role: role
    };
    await db.collection('otps').insertOne(otpRecord);
    
    // Send verification email with OTP
    const emailTemplate = createOTPEmailTemplate(otp, user.name || 'User');
    const emailResult = await sendEmail({
      to: email,
      subject: 'Your OTP for LMS Login',
      html: emailTemplate,
    });
    
    // Log the email result
    console.log('Login OTP email sent successfully:', emailResult.success);

    return NextResponse.json(
      { 
        message: 'OTP sent successfully',
        email: email
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
