import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// POST: Record a user as active when they log in
export async function POST(req: NextRequest) {
  try {
    // For faculty login, we'll accept a facultyId in the request body
    // since this is called right after login before the token is set
    const { facultyId } = await req.json();
    
    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('lms');

    // Get user details to confirm they are Faculty
    const user = await db.collection('users').findOne({ facultyId: facultyId });
    if (!user || user.role !== 'Faculty') {
      return NextResponse.json({ error: 'User not found or not Faculty' }, { status: 404 });
    }

    // Record active session with timestamp
    await db.collection('activeSessions').updateOne(
      { userId: user._id.toString() },
      { 
        $set: { 
          userId: user._id.toString(),
          name: user.name,
          role: user.role,
          lastActive: new Date(),
          isActive: true
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording active user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Record a user as inactive when they log out
export async function DELETE(req: NextRequest) {
  try {
    const { facultyId } = await req.json();
    
    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('lms');

    // Get user details
    const user = await db.collection('users').findOne({ facultyId: facultyId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mark user as inactive
    await db.collection('activeSessions').updateOne(
      { userId: user._id.toString() },
      { $set: { isActive: false, lastActive: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking user as inactive:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get count of active faculty users
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('lms');

    // Consider users inactive if they haven't been active in the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Count active faculty users
    const activeCount = await db.collection('activeSessions').countDocuments({
      role: 'Faculty',
      isActive: true,
      lastActive: { $gte: thirtyMinutesAgo }
    });

    // Get list of active faculty users
    const activeFaculty = await db.collection('activeSessions').find({
      role: 'Faculty',
      isActive: true,
      lastActive: { $gte: thirtyMinutesAgo }
    }).toArray();

    return NextResponse.json({ 
      count: activeCount,
      activeFaculty: activeFaculty
    });
  } catch (error) {
    console.error('Error getting active users count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
