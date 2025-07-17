import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cache } from 'react';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create a cached version of the database connection
const getDbConnection = cache(async () => {
  const client = await clientPromise;
  return client.db('lms');
});

export async function POST(req: Request) {
  try {
    const { facultyId, email, password, role } = await req.json();
    const startTime = Date.now();

    // Validate the input based on role
    if (role === 'Faculty' && (!facultyId || !password)) {
      return NextResponse.json(
        { error: 'Missing required fields for Faculty login' },
        { status: 400 }
      );
    }

    if (role === 'HOD' && (!email || !password)) {
      return NextResponse.json(
        { error: 'Missing required fields for HOD login' },
        { status: 400 }
      );
    }

    // Get cached DB connection
    const db = await getDbConnection();

    // Find user based on role with optimized queries
    let user;
    if (role === 'Faculty') {
      // Use a single query with $or operator to avoid sequential queries
      user = await db.collection('users').findOne({
        facultyId,
        $or: [
          { role: 'Faculty' },
          { role: { $exists: false } }
        ]
      });
      
      console.log(`Faculty login attempt: ${facultyId}, found: ${!!user}, time: ${Date.now() - startTime}ms`);
      
      // If found and role is not set, update it
      if (user && user.role !== 'Faculty') {
        // Use updateOne without waiting for completion to speed up response
        db.collection('users').updateOne(
          { _id: user._id },
          { $set: { role: 'Faculty' } }
        ).catch(err => console.error('Error updating user role:', err));
        
        user.role = 'Faculty';
      }
    } else if (role === 'HOD') {
      user = await db.collection('users').findOne({ email, role: 'HOD', isVerified: true });
      console.log(`HOD login attempt: ${email}, found: ${!!user}, time: ${Date.now() - startTime}ms`);
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
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create token with appropriate user data
    const tokenData: any = { userId: user._id, role: user.role };
    
    // Add role-specific fields to token
    if (user.role === 'Faculty') {
      tokenData.facultyId = user.facultyId;
      tokenData.name = user.name;
    } else if (user.role === 'HOD') {
      tokenData.email = user.email;
      tokenData.name = user.name;
    }

    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: '1d' });

    // Create response with redirect information
    const redirectUrl = role === 'HOD' ? '/hod-dashboard' : '/';
    
    // For Faculty users, use the dedicated redirect page
    const facultyRedirect = role === 'Faculty' ? '/auth/faculty-redirect' : redirectUrl;
    
    // Create a response object
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        redirect: facultyRedirect,
        role: role,
        userId: user._id.toString(),
        facultyId: user.facultyId || null,
        name: user.name || null,
        processingTime: Date.now() - startTime
      },
      { status: 200 }
    );

    // Set multiple cookies to ensure one works
    // Primary token cookie with strong settings
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });
    
    // Backup token cookie with different settings
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });
    
    // Non-HTTP-only cookie for client-side detection (contains only role, not the full token)
    response.cookies.set('user_role', role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });
    
    // Add custom headers for redirection
    response.headers.set('X-Auth-Redirect', facultyRedirect);
    response.headers.set('X-Auth-Role', role);
    response.headers.set('X-Auth-Success', 'true');

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}