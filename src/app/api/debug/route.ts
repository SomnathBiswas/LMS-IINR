import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

// GET: Debug database collections and their contents
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const result: any = {};
    
    // Get list of all collections
    const collections = await db.listCollections().toArray();
    result.collections = collections.map(c => c.name);
    
    // Sample data from key collections
    result.users = await db.collection('users').find({ role: 'Faculty' }).limit(5).toArray();
    result.routines = await db.collection('routines').find({}).limit(5).toArray();
    result.attendanceRecords = await db.collection('attendanceRecords').find({}).limit(5).toArray();
    
    // Count documents in each collection
    result.counts = {
      users: await db.collection('users').countDocuments(),
      routines: await db.collection('routines').countDocuments(),
      attendanceRecords: await db.collection('attendanceRecords').countDocuments(),
    };
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error debugging database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to debug database', details: errorMessage },
      { status: 500 }
    );
  }
}
