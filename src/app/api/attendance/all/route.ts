import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// Define types for attendance records
interface AttendanceRecord {
  _id: ObjectId;
  facultyId: string;
  classId: string;
  subject: string;
  course: string;
  roomNo: string;
  timeSlot: string;
  status: string; // 'Taken', 'Missed', 'Handover'
  date: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FacultyDetails {
  _id: ObjectId;
  name: string;
  department?: string;
  facultyId?: string;
}

interface EnrichedAttendanceRecord extends AttendanceRecord {
  facultyName: string;
  facultyDepartment?: string;
}

// This endpoint will get all attendance records for the HOD dashboard
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching attendance records for HOD dashboard...');
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const facultyId = searchParams.get('facultyId');
    const course = searchParams.get('course');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build query based on filters
    const query: any = {};
    
    if (facultyId) {
      // Create a more flexible query to match faculty ID in different formats
      query.$or = [
        { facultyId: facultyId },  // Match exact string
        { 'facultyId': facultyId } // Match as field name
      ];
      
      // Try to add ObjectId match if possible
      try {
        const objectId = new ObjectId(facultyId);
        query.$or.push({ facultyId: objectId });
      } catch (e) {
        // Not a valid ObjectId, continue with string matches only
      }
      
      console.log('Filtering by faculty ID:', facultyId, 'Query:', JSON.stringify(query));
    }
    
    if (course) {
      query.course = course;
    }
    
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      
      if (endDate) {
        // Add one day to include the end date fully
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        query.date.$lt = endDateObj;
      }
    }
    
    // Get attendance records based on filters
    console.log('Query:', JSON.stringify(query));
    const attendanceCollection = db.collection('attendance');
    
    if (!attendanceCollection) {
      console.error('Attendance collection not found');
      return NextResponse.json({ error: 'Attendance collection not found' }, { status: 500 });
    }
    
    const attendanceRecords = await attendanceCollection
      .find(query)
      .sort({ date: -1 })
      .toArray() as AttendanceRecord[];
      
    console.log(`Found ${attendanceRecords.length} attendance records`);
    
    // First, get all registered faculty members from the database
    const allRegisteredFaculty = await db.collection('users')
      .find({ role: 'Faculty' })
      .project({ _id: 1, name: 1, department: 1, facultyId: 1 })
      .toArray() as FacultyDetails[];
      
    console.log(`Found ${allRegisteredFaculty.length} registered faculty members in the database`);
    
    // Then get faculty IDs from attendance records
    const facultyIds = [...new Set(attendanceRecords.map(record => record.facultyId))];
    console.log(`Found ${facultyIds.length} unique faculty IDs from attendance records`);
    
    // Handle empty faculty list gracefully
    if (facultyIds.length === 0) {
      console.log('No faculty IDs found in attendance records');
      return NextResponse.json({ 
        success: true,
        stats: {
          totalClasses: 0,
          classesTaken: 0,
          classesMissed: 0,
          classesHandover: 0,
          attendancePercentage: 0
        },
        attendanceRecords: [],
        filters: {
          courses: [],
          faculty: []
        }
      }, { status: 200 });
    }
    
    // Create a query that can handle both string IDs and ObjectId
    const idQuery: any = { $or: [] };
    
    // Try to convert each ID to ObjectId, or use it as a string
    const objectIds: ObjectId[] = [];
    const stringIds: string[] = [];
    
    facultyIds.forEach(id => {
      if (!id) return; // Skip null or undefined IDs
      
      try {
        objectIds.push(new ObjectId(id));
      } catch (e) {
        stringIds.push(id);
      }
    });
    
    console.log(`Found ${objectIds.length} ObjectIds and ${stringIds.length} string IDs`);
    
    if (objectIds.length > 0) {
      idQuery.$or.push({ _id: { $in: objectIds } });
    }
    
    if (stringIds.length > 0) {
      idQuery.$or.push({ facultyId: { $in: stringIds } });
    }
    
    // If we couldn't create a valid query, return empty results
    if (idQuery.$or.length === 0) {
      console.log('No valid faculty IDs to query');
      return NextResponse.json({ 
        success: true,
        stats: {
          totalClasses: attendanceRecords.length,
          classesTaken: 0,
          classesMissed: 0,
          classesHandover: 0,
          attendancePercentage: 0
        },
        attendanceRecords: attendanceRecords.map(record => ({
          ...record,
          facultyName: 'Unknown Faculty',
          facultyDepartment: undefined
        })),
        filters: {
          courses: [...new Set(attendanceRecords.map(record => record.course).filter(Boolean))],
          faculty: []
        }
      }, { status: 200 });
    }
    
    console.log('Faculty query:', JSON.stringify(idQuery));
    const usersCollection = db.collection('users');
    
    if (!usersCollection) {
      console.error('Users collection not found');
      return NextResponse.json({ error: 'Users collection not found' }, { status: 500 });
    }
    
    // Only fetch real faculty members from the database
    const facultyList = await usersCollection
      .find({ 
        $and: [
          idQuery,
          { role: 'Faculty' } // Ensure we only get users with Faculty role
        ]
      })
      .project({ _id: 1, name: 1, department: 1, facultyId: 1 })
      .toArray() as FacultyDetails[];
      
    console.log(`Found ${facultyList.length} real faculty members in the database`);
    
    // Create a map of faculty IDs to faculty details
    const facultyMap: Record<string, FacultyDetails> = {};
    
    facultyList.forEach(faculty => {
      if (!faculty || !faculty._id) {
        console.warn('Invalid faculty record found:', faculty);
        return;
      }
      
      try {
        facultyMap[faculty._id.toString()] = faculty;
        // Also map by facultyId if available
        if (faculty.facultyId) {
          facultyMap[faculty.facultyId] = faculty;
        }
      } catch (error) {
        console.error('Error mapping faculty:', error);
      }
    });
    
    console.log(`Created faculty map with ${Object.keys(facultyMap).length} entries`);
    
    // Enrich attendance records with faculty details
    const enrichedRecords: EnrichedAttendanceRecord[] = [];
    
    for (const record of attendanceRecords) {
      try {
        if (!record || !record.facultyId) {
          console.warn('Invalid attendance record found:', record);
          continue;
        }
        
        const faculty = facultyMap[record.facultyId] || { 
          name: 'Unknown Faculty', 
          _id: new ObjectId(),
          department: 'Unknown Department'
        };
        
        enrichedRecords.push({
          ...record,
          facultyName: faculty.name || 'Unknown',
          facultyDepartment: faculty.department
        });
      } catch (error) {
        console.error('Error enriching record:', error);
      }
    }
    
    console.log(`Created ${enrichedRecords.length} enriched records`);
    
    // Calculate attendance statistics
    // Only calculate stats if filters are applied
    let totalClasses = 0;
    let classesTaken = 0;
    let classesMissed = 0;
    let classesHandover = 0;
    let attendancePercentage = 0;
    
    // Check if any filter is applied
    const isFiltered = !!(facultyId || course || startDate || endDate);
    
    // Only calculate stats if filters are applied
    if (isFiltered) {
      totalClasses = enrichedRecords.length;
      classesTaken = enrichedRecords.filter(record => record.status === 'Taken').length;
      classesMissed = enrichedRecords.filter(record => record.status === 'Missed').length;
      classesHandover = enrichedRecords.filter(record => record.status === 'Handover').length;
      
      // Calculate attendance percentage if there are classes
      if (totalClasses > 0) {
        attendancePercentage = Math.round((classesTaken / totalClasses) * 100);
      }
    }
    
    // Get unique courses and faculty for filter dropdowns
    const uniqueCourses = [...new Set(enrichedRecords.map(record => record.course).filter(Boolean))];
    
    // Create a map of faculty IDs to their courses
    const facultyCoursesMap: Record<string, Set<string>> = {};
    
    // Populate the faculty courses map from attendance records
    enrichedRecords.forEach(record => {
      if (!record.facultyId || !record.course) return;
      
      if (!facultyCoursesMap[record.facultyId]) {
        facultyCoursesMap[record.facultyId] = new Set<string>();
      }
      
      facultyCoursesMap[record.facultyId].add(record.course);
    });
    
    // Create the faculty list using ONLY registered faculty members from the database
    const uniqueFaculty = allRegisteredFaculty.map(faculty => {
      const facultyId = faculty._id.toString();
      
      // Only include courses that this faculty actually has in attendance records
      const courses = facultyCoursesMap[facultyId] || 
                     (faculty.facultyId ? facultyCoursesMap[faculty.facultyId] : undefined) || 
                     new Set<string>();
      
      return {
        id: facultyId,
        name: faculty.name || 'Unknown',
        department: faculty.department,
        // Only include real courses, no mock data
        courses: Array.from(courses)
      };
    });
    
    console.log(`Returning ${uniqueFaculty.length} registered faculty members for the dropdown`);
    
    // If no filters are applied, don't return any attendance records
    return NextResponse.json({ 
      success: true,
      stats: {
        totalClasses,
        classesTaken,
        classesMissed,
        classesHandover,
        attendancePercentage: totalClasses > 0 ? Math.round((classesTaken / totalClasses) * 100) : 0
      },
      // Only return attendance records if filters are applied
      attendanceRecords: isFiltered ? enrichedRecords : [],
      filters: {
        courses: uniqueCourses,
        faculty: uniqueFaculty
      },
      isFiltered: isFiltered
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance data' }, { status: 500 });
  }
}
