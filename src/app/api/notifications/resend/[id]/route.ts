import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const notificationId = params.id;
    
    if (!notificationId || !ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }
    
    // Find the original notification
    const notification = await db.collection('official_notifications').findOne({
      _id: new ObjectId(notificationId)
    });
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Create a new notification based on the original one
    const { _id, ...notificationWithoutId } = notification;
    
    const newNotification = {
      ...notificationWithoutId,
      status: 'Sent',
      scheduledFor: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      resendOf: notificationId
    };
    
    // Insert the new notification
    const result = await db.collection('official_notifications').insertOne(newNotification);
    
    // Create individual notifications for faculty members
    await createFacultyNotifications(db, notification, result.insertedId.toString());
    
    return NextResponse.json({
      success: true,
      message: 'Notification resent successfully',
      notificationId: result.insertedId.toString()
    });
    
  } catch (error) {
    console.error('Error resending notification:', error);
    return NextResponse.json(
      { error: 'Failed to resend notification' },
      { status: 500 }
    );
  }
}

// Helper function to create individual notifications for faculty members
async function createFacultyNotifications(db: any, notification: any, notificationId: string) {
  try {
    const bulkNotifications = [];
    
    if (notification.sendToAll) {
      // Get all faculty members
      const allFaculty = await db.collection('users')
        .find({ role: 'Faculty' })
        .project({ _id: 1 })
        .toArray();
      
      // Create notifications for all faculty
      for (const faculty of allFaculty) {
        bulkNotifications.push({
          userId: faculty._id.toString(),
          title: `[RESENT] ${notification.title}`,
          description: notification.description,
          type: notification.type.toLowerCase(),
          relatedId: notificationId,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOfficial: true,
          from: {
            hodId: notification.hodId,
            hodName: notification.hodName,
            department: notification.department
          },
          attachments: notification.attachments
        });
      }
    } else {
      // Create notifications for selected faculty
      for (const faculty of notification.recipients.faculty) {
        bulkNotifications.push({
          userId: faculty._id.toString(),
          title: `[RESENT] ${notification.title}`,
          description: notification.description,
          type: notification.type.toLowerCase(),
          relatedId: notificationId,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          isOfficial: true,
          from: {
            hodId: notification.hodId,
            hodName: notification.hodName,
            department: notification.department
          },
          attachments: notification.attachments
        });
      }
    }
    
    // Insert all notifications in bulk if there are any
    if (bulkNotifications.length > 0) {
      await db.collection('notifications').insertMany(bulkNotifications);
    }
    
  } catch (error) {
    console.error('Error creating faculty notifications:', error);
    throw error;
  }
}
