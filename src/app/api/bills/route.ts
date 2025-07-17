import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { BillData } from '@/components/BillSubmissionForm';

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const billData: BillData = await request.json();

    // Basic validation
    if (!billData.billImage || !billData.ownerName || !billData.amount || !billData.overview) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await db.collection('bills').insertOne({
      ...billData,
      createdAt: new Date(),
    });

    const newBill = {
      _id: result.insertedId,
      ...billData,
    };

    return NextResponse.json(newBill, { status: 201 });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 100;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
    const skip = (page - 1) * limit;
    
    // Ensure we have indexes for efficient querying
    try {
      // Check if index exists, if not create it
      const indexes = await db.collection('bills').indexes();
      const hasCreatedAtIndex = indexes.some((index: any) => 
        index.key && index.key.createdAt !== undefined
      );
      
      if (!hasCreatedAtIndex) {
        await db.collection('bills').createIndex({ createdAt: -1 });
        console.log('Created index on createdAt field');
      }
    } catch (indexError) {
      console.warn('Could not verify or create index:', indexError);
      // Continue execution even if index creation fails
    }
    
    let query: any = {};
    
    // Apply date filtering if provided
    if (startDate || endDate) {
      query.dateTime = {};
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.dateTime.$gte = start.toISOString();
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.dateTime.$lte = end.toISOString();
      }
    }
    
    // Use pagination to avoid memory issues
    const bills = await db.collection('bills')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
      
    // Get total count for pagination info
    const totalCount = await db.collection('bills').countDocuments(query);
    
    return NextResponse.json({
      bills,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch bills', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}