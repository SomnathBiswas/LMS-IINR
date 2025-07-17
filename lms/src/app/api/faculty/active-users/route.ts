import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// This endpoint will return the count of active faculty users
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // Get active users from the database
    // We'll consider users who have logged in within the last 30 minutes as active
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const activeUsers = await db.collection('users').countDocuments({
      role: 'Faculty',
      lastActive: { $gte: thirtyMinutesAgo },
    });
    
    return NextResponse.json({ activeUsers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching active users:', error);
    return NextResponse.json({ error: 'Failed to fetch active users' }, { status: 500 });
  }
}

// This endpoint will update the lastActive timestamp for a user
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Decode the token to get the user ID
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Update the user's lastActive timestamp
    await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: { lastActive: new Date() } }
    );
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating active status:', error);
    return NextResponse.json({ error: 'Failed to update active status' }, { status: 500 });
  }
}
