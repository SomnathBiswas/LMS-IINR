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

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const bills = await db.collection('bills').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}