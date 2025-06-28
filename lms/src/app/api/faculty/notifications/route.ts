import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const userIdParam = searchParams.get('userId');
    const facultyIdParam = searchParams.get('facultyId'); // Read facultyId
    const userId = userIdParam || facultyIdParam; // Use userId if present, otherwise fallback to facultyId

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    
    if (!userId) { // Now checks the combined userId
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Build query
    const query: any = {
      userId: userId
      // Removed isOfficial: true to fetch all notifications for the user
    };
    
    // Add type filter if provided
    if (type) {
      query.type = type;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await db.collection('notifications').countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get notifications with pagination
    const notifications = await db.collection('notifications')
      .find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({
      notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit
      }
    });
    
  } catch (error) {
    console.error('Error fetching faculty notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
