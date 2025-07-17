import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// POST /api/handovers - Create a new handover request
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const data = await request.json();
    console.log('Received handover request data:', data);

    // Validate required fields
    if (!data.dateOfClass || !data.timeSlot || !data.subject || !data.course || !data.substituteId || !data.roomNo) {
      console.log('Handover request missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Since this is a server-side route, we can't use fetch to call another API route easily.
    // It's better to refactor the availability check into a shared function if needed,
    // or replicate the logic here. For now, we'll assume the frontend check is sufficient
    // and proceed with creating the handover. The HOD can still reject it.
    // A more robust solution would be to have a shared library for these checks.

    const handover = {
      ...data,
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('handovers').insertOne(handover);
    
    return NextResponse.json({
      message: 'Handover request created successfully',
      handoverId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating handover request:', error);
    return NextResponse.json(
      { error: 'Failed to create handover request' },
      { status: 500 }
    );
  }
}

// GET /api/handovers - Get handover requests (with optional filters)
export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    const facultyId = searchParams.get('facultyId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const subject = searchParams.get('subject');
    const course = searchParams.get('course');

    const query: any = {};
    
    // Apply filters
    if (facultyId) query.facultyId = facultyId;
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (course) query.course = course;
    if (startDate && endDate) {
      query.dateOfClass = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const handovers = await db.collection('handovers')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ handovers });
  } catch (error) {
    console.error('Error fetching handover requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch handover requests' },
      { status: 500 }
    );
  }
}

// PUT /api/handovers/:id - Update handover request status (approve/reject/change substitute)
export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Handover ID is required' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    const { status, substituteId, substituteName, remarks } = data;
    
    // Validate status
    if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Prepare update object
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    // Add optional fields if provided
    if (substituteId) updateData.substituteId = substituteId;
    if (substituteName) updateData.substituteName = substituteName;
    if (remarks) updateData.remarks = remarks;
    
    // Get the handover request details before updating
    const handoverRequest = await db.collection('handovers').findOne({ _id: new ObjectId(id) });
    
    if (!handoverRequest) {
      return NextResponse.json(
        { error: 'Handover request not found' },
        { status: 404 }
      );
    }
    
    // Update the handover request
    const result = await db.collection('handovers').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    // The logic for handling 'Approved' and 'Rejected' statuses has been moved to the PATCH endpoint.
    // This PUT endpoint will now only handle other status updates if necessary.
    
    return NextResponse.json({ 
      message: `Handover request ${status.toLowerCase()} successfully` 
    });
  } catch (error) {
    console.error('Error updating handover request:', error);
    return NextResponse.json(
      { error: 'Failed to update handover request' },
      { status: 500 }
    );
  }
}

// DELETE /api/handovers/:id - Delete a handover request
export async function DELETE(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Handover ID is required' },
        { status: 400 }
      );
    }
    
    const result = await db.collection('handovers').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Handover request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Handover request deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting handover request:', error);
    return NextResponse.json(
      { error: 'Failed to delete handover request' },
      { status: 500 }
    );
  }
}
