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
    const { securityId, password } = await req.json();
    const startTime = Date.now();

    // Validate the input
    if (!securityId || !password) {
      return NextResponse.json(
        { error: 'Security ID and password are required' },
        { status: 400 }
      );
    }

    // Get cached DB connection
    const db = await getDbConnection();

    // Find security user
    const user = await db.collection('users').findOne({
      securityId,
      role: 'Security'
    });
    
    console.log(`Security login attempt: ${securityId}, found: ${!!user}, time: ${Date.now() - startTime}ms`);
    
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
    const tokenData = { 
      userId: user._id, 
      role: user.role,
      securityId: user.securityId,
      name: user.name
    };

    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: '1d' });

    // Create response with redirect information
    const redirectUrl = '/security-dashboard';
    
    // Create a response object
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        redirect: redirectUrl,
        role: 'Security',
        userId: user._id.toString(),
        securityId: user.securityId || null,
        name: user.name || null,
        processingTime: Date.now() - startTime
      },
      { status: 200 }
    );

    // Set cookies
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });
    
    // Non-HTTP-only cookie for client-side detection
    response.cookies.set('user_role', 'Security', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });
    
    // Add custom headers for redirection
    response.headers.set('X-Auth-Redirect', redirectUrl);
    response.headers.set('X-Auth-Role', 'Security');
    response.headers.set('X-Auth-Success', 'true');

    return response;
  } catch (error) {
    console.error('Security login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
