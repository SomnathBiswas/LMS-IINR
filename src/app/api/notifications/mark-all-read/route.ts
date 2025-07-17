import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Mark all notifications as read for this user
    const result = await db.collection('notifications').updateMany(
      { userId: new ObjectId(userId), read: false },
      { $set: { read: true, updatedAt: new Date() } }
    );
    
    return NextResponse.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
