import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    const records = await db.collection('absent_records')
      .find({})
      .sort({ date: -1 }) // Sort by most recent date
      .toArray();
      
    return NextResponse.json({ records });

  } catch (error) {
    console.error('Error fetching absent records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch absent records' },
      { status: 500 }
    );
  }
}