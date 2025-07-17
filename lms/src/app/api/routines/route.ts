import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// This endpoint will save a new routine assignment or update an existing one while preserving history
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const data = await request.json();
    console.log('[API /routines POST] Received data for routine:', JSON.stringify(data, null, 2)); // Log incoming data
    
    // Validate required fields
    if (!data.facultyId || !data.entries || data.entries.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create the routine document
    // Ensure all entries have a default pending status
    const processedEntries = data.entries.map((entry: any, index: number) => {
      console.log(`[API /routines POST] Processing entry ${index} from request:`, JSON.stringify(entry, null, 2));
      const newEntry = {
        ...entry,
        id: entry.id || new ObjectId().toString(), // Ensure each entry has an ID
        status: entry.status || 'pending', // Default to pending if not provided
        attendanceStatus: entry.attendanceStatus || 'pending' // Default to pending
      };
      console.log(`[API /routines POST] Processed entry ${index} with defaults:`, JSON.stringify(newEntry, null, 2));
      return newEntry;
    });

    // Use UTC to avoid timezone issues
    const today = new Date();
    const startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    
    const endDate = new Date(startDate);
    if (data.routineType === 'weekly') {
      endDate.setUTCDate(startDate.getUTCDate() + 7);
    } else {
      endDate.setUTCDate(startDate.getUTCDate() + 1); // Default to one day for non-weekly
    }

    const routineDoc = {
      facultyId: data.facultyId,
      routineType: data.routineType || 'weekly',
      entries: processedEntries,
      createdAt: new Date(),
      updatedAt: new Date(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isLatest: true,
      version: 1,
      previousVersionId: null as string | null
    };
    
    // Check if this is an update to an existing routine
    if (data.isUpdate && data.updateRoutineId) {
      try {
        // Find the existing routine
        const existingRoutine = await db.collection('routines').findOne({ 
          _id: new ObjectId(data.updateRoutineId) 
        });
        
        if (existingRoutine) {
          // Set the existing routine as not the latest version
          await db.collection('routines').updateOne(
            { _id: new ObjectId(data.updateRoutineId) },
            { $set: { isLatest: false } }
          );
          
          // Update the new routine document with version info
          routineDoc.version = (existingRoutine.version || 1) + 1;
          routineDoc.previousVersionId = existingRoutine._id.toString();
          
          console.log(`[API /routines POST] Updating routine. Old version: ${existingRoutine.version}, New version: ${routineDoc.version}`);
        }
      } catch (err) {
        console.error('Error finding existing routine:', err);
        // Continue with creating a new routine if there's an error finding the existing one
      }
    }
    
    // Insert the routine into the database
    const result = await db.collection('routines').insertOne(routineDoc);
    
    // Create a notification for the faculty member
    const notificationDoc = {
      userId: data.facultyId,
      title: data.isUpdate ? 'Routine Updated' : 'New Routine Published',
      description: data.isUpdate 
        ? `Your class routine has been updated (version ${routineDoc.version}). Please check your schedule.`
        : 'Your class routine has been published. Please check your schedule.',
      type: 'routine',
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the notification into the database
    await db.collection('notifications').insertOne(notificationDoc);
    
    return NextResponse.json({ 
      success: true, 
      routineId: result.insertedId,
      version: routineDoc.version
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving routine:', error);
    return NextResponse.json({ error: 'Failed to save routine' }, { status: 500 });
  }
}

// This endpoint will get routines for a specific faculty
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const routineId = searchParams.get('routineId');
    const includeHistory = searchParams.get('includeHistory') === 'true';
    
    // If routineId is provided, fetch that specific routine
    if (routineId) {
      try {
        const routine = await db.collection('routines').findOne({ _id: new ObjectId(routineId) });
        if (!routine) {
          return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
        }
        return NextResponse.json({ routine }, { status: 200 });
      } catch (error) {
        console.error('Error fetching specific routine:', error);
        return NextResponse.json({ error: 'Invalid routine ID' }, { status: 400 });
      }
    }
    
    // Otherwise, require facultyId
    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }
    
    console.log(`Fetching routines for faculty ID: ${facultyId}`);
    
    // Query to find routines for this faculty
    const query: { facultyId: string; isLatest?: boolean } = { facultyId };
    
    // If we don't need history, only get the latest version
    if (!includeHistory) {
      query.isLatest = true;
    }
    
    // Get routines for the faculty
    const routines = await db.collection('routines')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    console.log('Found routines:', routines.map(r => ({ _id: r._id, version: r.version, createdAt: r.createdAt })));
    
    if (!routines || routines.length === 0) {
      console.log(`No routines found for faculty ID: ${facultyId}`);
      return NextResponse.json({ routine: null, routineHistory: [] }, { status: 200 });
    }
    
    // The latest routine is the first one (sorted by createdAt desc)
    const latestRoutine = routines.find(r => r.isLatest === true) || routines[0];
    console.log(`Found latest routine with ID: ${latestRoutine._id}`);
    
    // Get today's date for attendance status lookup
    const todayDate = new Date().toISOString().split('T')[0];
    
    // Check if the routine has entries and process them
    if (latestRoutine.entries && Array.isArray(latestRoutine.entries)) {
      console.log(`Processing ${latestRoutine.entries.length} entries in routine`);
      
      // Get current day of week
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = daysOfWeek[new Date().getDay()];
      const todayShort = today.substring(0, 3);
      
      // Get attendance records for today's classes
      const attendanceRecords = await db.collection('attendance')
        .find({
          facultyId,
          date: todayDate
        })
        .toArray();
      
      console.log(`Found ${attendanceRecords.length} attendance records for today from 'attendance' collection`);
      
      // Update entries with attendance status
      latestRoutine.entries = latestRoutine.entries.map((entry: any) => {
        // Check if this entry is for today
        const entryDay = entry.day || '';
        const isToday = [
          entryDay === today,
          entryDay === todayShort,
          entryDay.toUpperCase() === today.toUpperCase(),
          entryDay.toUpperCase() === todayShort.toUpperCase(),
          entryDay.toLowerCase() === today.toLowerCase(),
          entryDay.toLowerCase() === todayShort.toLowerCase()
        ].some(match => match);
        
        if (isToday) {
          // Look for matching attendance record
          const record = attendanceRecords.find((record: any) =>
            record.routineId === entry.id ||
            record.routineId === entry._id?.toString() ||
            record.classId === entry.id ||
            record.classId === entry._id?.toString()
          );
          
          if (record) {
            // Update entry with attendance status
            entry.status = record.status;
            entry.attendanceStatus = record.status;
            entry.lastUpdated = record.updatedAt || record.createdAt;
          }
        }
        
        return entry;
      });
    }
    
    // Prepare the response
    const response: any = { routine: latestRoutine };
    
    // If history is requested, include all versions except the latest
    if (includeHistory) {
      // Filter out the latest routine and format history entries
      const routineHistory = routines
        .filter(r => r._id.toString() !== latestRoutine._id.toString())
        .map(r => ({
          _id: r._id,
          version: r.version || 1,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          routineType: r.routineType,
          entryCount: r.entries?.length || 0
        }));
      
      response.routineHistory = routineHistory;
    }
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching routine:', error);
    return NextResponse.json({ error: 'Failed to fetch routine' }, { status: 500 });
  }
}
