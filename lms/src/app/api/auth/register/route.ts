import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { generateOTP, sendEmail, createOTPEmailTemplate } from '@/lib/email';
import { createOTPRecord } from '@/models/otp';

export async function POST(req: Request) {
  try {
    const { facultyId, name, hodName, hodEmail, password, confirmPassword, role, subjectsKnown } = await req.json();
    const client = await clientPromise;
    const db = client.db('lms');

    // Validate the input based on role
    if (role === 'Faculty') {
      if (!facultyId || !name || !password) {
        return NextResponse.json(
          { error: 'Missing required fields for Faculty registration' },
          { status: 400 }
        );
      }
    } else if (role === 'HOD') {
      if (!hodName || !hodEmail || !password || !confirmPassword) {
        return NextResponse.json(
          { error: 'Missing required fields for HOD registration' },
          { status: 400 }
        );
      }
      
      // Check if passwords match for HOD
      if (password !== confirmPassword) {
        return NextResponse.json(
          { error: 'Passwords do not match' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if user already exists based on role
    let existingUser;
    if (role === 'Faculty') {
      existingUser = await db.collection('users').findOne({ facultyId });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Faculty ID already exists' },
          { status: 400 }
        );
      }
    } else if (role === 'HOD') {
      existingUser = await db.collection('users').findOne({ email: hodEmail, role: 'HOD' });
      if (existingUser) {
        return NextResponse.json(
          { error: 'HOD with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle Faculty registration
    if (role === 'Faculty') {
      // Use the provided facultyId instead of generating a new one
      // Validate that the facultyId follows the correct format
      if (!facultyId.match(/^IINR-\d{3,}$/)) {
        return NextResponse.json(
          { error: 'Faculty ID must be in the format IINR-XXX' },
          { status: 400 }
        );
      }

      const userData = {
        facultyId, // Use the provided facultyId
        name,
        password: hashedPassword,
        role,
        createdAt: new Date(),
        isVerified: true, // Faculty doesn't need email verification
        subjectsKnown: Array.isArray(subjectsKnown) ? subjectsKnown : [], // Store subjects the faculty can teach
      };

      const result = await db.collection('users').insertOne(userData);

      return NextResponse.json(
        { message: 'Faculty registered successfully' },
        { status: 201 }
      );
    } 
    // Handle HOD registration
    else if (role === 'HOD') {
      // Generate OTP for email verification
      const otp = generateOTP();
      
      // Create temporary user record with pending verification
      const userData = {
        name: hodName,
        email: hodEmail,
        password: hashedPassword,
        role,
        createdAt: new Date(),
        isVerified: false, // Requires email verification
      };

      // Insert the user with pending verification status
      const result = await db.collection('users').insertOne(userData);
      
      // Create OTP record
      const otpRecord = createOTPRecord(hodEmail, otp);
      await db.collection('otps').insertOne(otpRecord);
      
      // Log the OTP for testing purposes
      console.log('Generated OTP for testing:', otp);
      
      // Send verification email with OTP including the HOD's name
      const emailTemplate = createOTPEmailTemplate(otp, hodName);
      const emailResult = await sendEmail({
        to: hodEmail,
        subject: 'Your OTP for LMS Registration',
        html: emailTemplate,
      });
      
      // Log the email result
      console.log('Email sent successfully:', emailResult.success);

      return NextResponse.json(
        { 
          message: 'HOD registration initiated. Please verify your email with the OTP sent.',
          email: hodEmail, // Return email for the verification page
          userId: result.insertedId,
          // Include OTP in response for testing purposes only
          // In production, this should be removed
          testOtp: otp
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}