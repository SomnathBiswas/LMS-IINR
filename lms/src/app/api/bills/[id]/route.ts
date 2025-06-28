import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;
    const { paymentStatus } = await request.json();

    if (!paymentStatus || (paymentStatus !== 'Paid' && paymentStatus !== 'Unpaid')) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }

    const result = await db.collection('bills').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { paymentStatus } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}