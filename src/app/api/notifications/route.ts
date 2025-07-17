import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// Helper function to set cache control headers
function setNoCacheHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

// This endpoint will get notifications for a specific user
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20'); // Increased limit to reduce need for pagination
    
    if (!userId) {
      return setNoCacheHeaders(NextResponse.json({ error: 'User ID is required' }, { status: 400 }));
    }
    
    // Get all notifications for the user, including read ones for consistent UI
    const notifications = await db.collection('notifications')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    // Format dates for consistent display
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      // Ensure createdAt and updatedAt are properly formatted if they're Date objects
      createdAt: notification.createdAt instanceof Date ? notification.createdAt.toISOString() : notification.createdAt,
      updatedAt: notification.updatedAt instanceof Date ? notification.updatedAt.toISOString() : notification.updatedAt
    }));
    
    // Create a response with the notifications
    const response = NextResponse.json({ 
      notifications: formattedNotifications,
      timestamp: new Date().toISOString() // Add timestamp for debugging
    }, { status: 200 });
    
    // Set cache control headers to prevent caching
    return setNoCacheHeaders(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data = await request.json();
    
    if (!data.notificationId) {
      return setNoCacheHeaders(NextResponse.json({ error: 'Notification ID is required' }, { status: 400 }));
    }
    
    // Update the notification to mark it as read
    const result = await db.collection('notifications').updateOne(
      { _id: new ObjectId(data.notificationId) },
      { $set: { read: true, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return setNoCacheHeaders(NextResponse.json({ error: 'Notification not found' }, { status: 404 }));
    }
    
    // Create a response with success information
    const response = NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
    // Set cache control headers to prevent caching
    return setNoCacheHeaders(response);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// Create a new notification
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data = await request.json();
    
    // Validate required fields
    if (!data.userId || !data.title || !data.type) {
      return setNoCacheHeaders(NextResponse.json({ error: 'Missing required fields' }, { status: 400 }));
    }
    
    // Create the notification document
    const notificationDoc = {
      userId: data.userId,
      title: data.title,
      description: data.description || '',
      message: data.message || data.description || '', // Include message field for compatibility
      type: data.type,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Include additional fields for attendance notifications
      ...(data.type === 'attendance' && {
        status: data.status || '',
        routineId: data.routineId || null
      }),
      // Add any additional metadata that might be useful
      link: data.link || null,
      priority: data.priority || 'normal'
    };
    
    // Insert the notification into the database
    const result = await db.collection('notifications').insertOne(notificationDoc);
    
    // Create a response with success information
    const response = NextResponse.json({ 
      success: true, 
      notificationId: result.insertedId,
      timestamp: new Date().toISOString()
    }, { status: 201 });
    
    // Set cache control headers to prevent caching
    return setNoCacheHeaders(response);
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
