import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId, Document } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { promises as fsp } from 'fs';
import os from 'os';

// Add type declaration for formidable
declare module 'formidable' {}


export const config = {
  api: {
    bodyParser: false,
  },
};

// We're not using this function anymore, so removing it

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    
    // Parse form data with files
    const formData = await request.formData();
    
    // Extract fields
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;
    const sendToAll = formData.get('sendToAll') === 'true';
    const hodId = formData.get('hodId') as string;
    const hodName = formData.get('hodName') as string;
    const department = formData.get('department') as string;
    const scheduledFor = formData.get('scheduledFor') as string | null;
    
    // Extract selected faculty IDs
    const selectedFaculty: string[] = [];
    if (!sendToAll) {
      formData.getAll('selectedFaculty').forEach(id => {
        if (typeof id === 'string') selectedFaculty.push(id);
      });
    }
    
    // Handle file uploads
    const attachments: any[] = [];
    const files = formData.getAll('attachments');
    
    // Ensure uploads directory exists in a writable location
    const uploadsDir = path.join(os.tmpdir(), 'uploads');
    try {
      await fsp.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
      throw new Error('Failed to create uploads directory');
    }
    
    for (const file of files) {
      if (file instanceof File) {
        const fileId = new ObjectId();
        const fileName = `${fileId.toString()}-${file.name}`;
        const filePath = path.join(uploadsDir, fileName);
        
        try {
          // Convert file to buffer and save
          const buffer = Buffer.from(await file.arrayBuffer());
          await fsp.writeFile(filePath, buffer);
          
          // For serving, we need a public URL. This requires moving the file
          // to the public directory after saving it to a temp location.
          // However, for serverless environments, this might not be feasible.
          // A better approach is to use a cloud storage service (e.g., S3, Cloudinary).
          // For now, we'll just store a reference to the temp path.
          
          attachments.push({
            _id: fileId,
            filename: file.name,
            size: file.size,
            mimetype: file.type,
            // The URL will be tricky. In a serverless function, the /tmp
            // directory is not directly accessible via a public URL.
            // This path is temporary and might not be accessible in subsequent requests.
            url: `/api/temp-file/${fileName}`, // This requires a new API route to serve the file
            tempPath: filePath,
          });
          console.log(`Successfully saved file to temp location: ${filePath}`);
        } catch (error: unknown) {
          console.error(`Error saving file ${fileName}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Failed to save file ${fileName}: ${errorMessage}`);
        }
      }
    }
    
    // Determine notification status
    let status = 'Sent';
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate > new Date()) {
        status = 'Scheduled';
      }
    }
    
    // Create notification record
    const notification = {
      title,
      type,
      description,
      hodId,
      hodName,
      department,
      sendToAll,
      recipients: {
        all: sendToAll,
        faculty: [] as Document[],
      },
      attachments,
      status,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // If sending to specific faculty, get their details
    if (!sendToAll && selectedFaculty.length > 0) {
      const facultyDetails: Document[] = await db.collection('users')
        .find({ 
          _id: { $in: selectedFaculty.map(id => new ObjectId(id)) },
          role: 'Faculty'
        })
        .project({ _id: 1, name: 1, facultyId: 1 })
        .toArray();
      
      notification.recipients.faculty = facultyDetails as Document[];
    }
    
    // Insert notification into database
    const result = await db.collection('official_notifications').insertOne(notification);
    
    // If notification is to be sent now (not scheduled), create individual notifications for faculty
    if (status === 'Sent') {
      await createFacultyNotifications(db, notification, result.insertedId.toString());
    }
    
    return NextResponse.json({ 
      success: true, 
      message: status === 'Sent' ? 'Notification sent successfully' : 'Notification scheduled successfully',
      notificationId: result.insertedId.toString()
    });
    
  } catch (error: unknown) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
    return NextResponse.json(
      { error: errorMessage },
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
    
    // Insert all notifications in bulk if there are any
    if (bulkNotifications.length > 0) {
      await db.collection('notifications').insertMany(bulkNotifications);
    }
    
  } catch (error) {
    console.error('Error creating faculty notifications:', error);
    throw error;
  }
}
