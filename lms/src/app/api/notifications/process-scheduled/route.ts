import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// Helper function to create individual notifications for faculty members
// This is the same function used in the send route
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
          title: notification.title,
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
          title: notification.title,
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
    
    if (bulkNotifications.length > 0) {
      await db.collection('notifications').insertMany(bulkNotifications);
    }
    
    return true;
  } catch (error) {
    console.error('Error creating faculty notifications:', error);
    return false;
  }
}

export async function POST() {
  try {
    const { db } = await connectToDatabase();
    
    // Get current time
    const now = new Date();
    
    // Find scheduled notifications that are due to be sent
    const scheduledNotifications = await db.collection('officialNotifications')
      .find({
        status: 'Scheduled',
        scheduledFor: { $lte: now }
      })
      .toArray();
    
    console.log(`Found ${scheduledNotifications.length} scheduled notifications to process`);
    
    if (scheduledNotifications.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No scheduled notifications to process',
        processed: 0
      });
    }
    
    // Process each scheduled notification
    let processedCount = 0;
    for (const notification of scheduledNotifications) {
      // Create individual notifications for faculty
      const success = await createFacultyNotifications(
        db, 
        notification, 
        notification._id.toString()
      );
      
      if (success) {
        // Update notification status to 'Sent'
        await db.collection('officialNotifications').updateOne(
          { _id: notification._id },
          { 
            $set: { 
              status: 'Sent',
              updatedAt: new Date()
            } 
          }
        );
        
        processedCount++;
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processedCount} scheduled notifications`,
      processed: processedCount
    });
    
  } catch (error: unknown) {
    console.error('Error processing scheduled notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
