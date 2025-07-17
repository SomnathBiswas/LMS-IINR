'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import FacultyNotifications from '@/components/faculty/FacultyNotifications';
import AttendanceStatusListener from '@/components/faculty/AttendanceStatusListener';
import HandoverStatusListener from '@/components/faculty/HandoverStatusListener';
import DynamicGreeting from '@/components/DynamicGreeting';
import AttendanceAlertBanner from './faculty-dashboard/components/AttendanceAlertBanner';
import type { ReactElement } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell, Home, Calendar, CheckSquare, LogOut, Check, Clock, AlertCircle, RefreshCw, Filter, User } from 'lucide-react';
import { scheduleData, summaryData } from '@/data/dashboard-data';

type StatusType = 'taken' | 'missed' | 'window-open' | 'handover' | 'handed over' | 'absent';

const getStatusBadge = (status: string) => {
  const normalizedStatus = status.toLowerCase() as StatusType;
  
  const iconMap: Record<StatusType, ReactElement> = {
    taken: <Check className="h-4 w-4 text-green-500 mr-1" />,
    missed: <AlertCircle className="h-4 w-4 text-red-500 mr-1" />,
    'window-open': <Clock className="h-4 w-4 text-blue-500 mr-1" />,
    handover: <RefreshCw className="h-4 w-4 text-yellow-500 mr-1" />,
    'handed over': <RefreshCw className="h-4 w-4 text-yellow-500 mr-1" />,
    absent: <AlertCircle className="h-4 w-4 text-red-700 mr-1" />
  };

  const colorMap: Record<StatusType, string> = {
    taken: 'bg-green-100 text-green-800 border-green-300',
    missed: 'bg-red-100 text-red-800 border-red-300',
    'window-open': 'bg-blue-100 text-blue-800 border-blue-300',
    handover: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'handed over': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    absent: 'bg-red-200 text-red-900 border-red-400'
  };

  const displayText = normalizedStatus === 'window-open' ? 'Window Open' :
    normalizedStatus === 'handed over' ? 'Handed Over' :
    status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="flex items-center">
      {iconMap[normalizedStatus] || <Clock className="h-4 w-4 text-gray-500 mr-1" />}
      <Badge className={`ml-1 ${colorMap[normalizedStatus] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
        {displayText}
      </Badge>
    </div>
  );
};

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const router = useRouter();
  const { user, refreshUser } = useUser();
  // Removed showNotifications state
  const [courseFilter, setCourseFilter] = useState('All Courses');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State for routine data
  const [routineData, setRoutineData] = useState<any>(null);
  const [routineLoading, setRoutineLoading] = useState(true);
  const [routineError, setRoutineError] = useState<string | null>(null);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  
  // State for attendance data
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const attendanceDataRef = useRef(attendanceData);
  attendanceDataRef.current = attendanceData;
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  // Add a timestamp to track when attendance was last fetched
  const [lastAttendanceFetch, setLastAttendanceFetch] = useState<number>(0);
  // Local state to track marked classes to ensure consistency
  const [markedClasses, setMarkedClasses] = useState<Record<string, string>>({});
  
  // Function to save marked classes to localStorage
  const saveMarkedClasses = (classes: Record<string, string>) => {
    try {
      localStorage.setItem('markedClasses', JSON.stringify(classes));
    } catch (error) {
      console.error('Error saving marked classes to localStorage:', error);
    }
  };
  
  // State for class statistics
  const [classStats, setClassStats] = useState({
    scheduled: 0,
    taken: 0,
    handover: 0,
    missed: 0
  });

  const handleLogout = () => {
    try {
      // Clear the token cookie - multiple approaches for reliability
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
      
      // Log the action for debugging
      console.log('Logging out and redirecting to signin page');
      
      // Use the special logout parameter to bypass the middleware redirect
      window.location.href = '/auth/signin?logout=true';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error during logout. Please try again.');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClassMissed = (event: CustomEvent) => {
      const { classId, className } = event.detail;
      console.log(`Class missed event received: ${className} (${classId})`);
      
      // Immediately update the UI to reflect the missed class
      setTodayClasses(prevClasses => 
        prevClasses.map(cls => 
          cls.id === classId ? { ...cls, status: 'missed' } : cls
        )
      );
      
      // Update class stats
      setClassStats(prevStats => ({
        ...prevStats,
        missed: (prevStats.missed || 0) + 1
      }));
      
      // Force a refresh of the data
      window.dispatchEvent(new CustomEvent('requestAttendanceRefresh'));
    };
    
    // Add event listener
    window.addEventListener('classMissed', handleClassMissed as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('classMissed', handleClassMissed as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleForceRefresh = () => {
      console.log('Force refresh event received, refetching data...');
      fetchAndProcessRoutine();
      fetchAttendanceData();
    };

    window.addEventListener('forceDashboardRefresh', handleForceRefresh);

    return () => {
      window.removeEventListener('forceDashboardRefresh', handleForceRefresh);
    };
  }, []);

  useEffect(() => {
    const fetchRoutineData = async () => {
      if (!user) {
        console.log('No user data available');
        return;
      }
      
      // Log all user properties to debug
      console.log('Current user data:', JSON.stringify(user, null, 2));
      
      // Try multiple ID fields to ensure we find the routine
      const possibleIds = [
        user.facultyId,
        user._id,
        // Use any other potential ID fields that might exist
        (user as any).id
      ].filter(Boolean); // Remove any undefined/null values
      
      console.log('Possible faculty IDs to try:', possibleIds);
      
      if (possibleIds.length === 0) {
        console.log('No valid ID found to fetch routine');
        return;
      }
      
      setRoutineLoading(true);
      
      // Try each possible ID
      for (const id of possibleIds) {
        try {
          console.log(`Attempting to fetch routine with ID: ${id}`);
          
          const response = await fetch(`/api/routines?facultyId=${id}`);
          const responseText = await response.text();
          
          console.log(`API response status: ${response.status}`);
          console.log(`API response text: ${responseText}`);
          
          // Parse the response if it's valid JSON
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            continue; // Try next ID
          }
          
          if (data.routine) {
            console.log(`Successfully found routine using ID: ${id}`);
            console.log('Routine data:', JSON.stringify(data.routine, null, 2));
            setRoutineData(data.routine);
            setRoutineError(null);
            setRoutineLoading(false);
            return; // Exit after finding a valid routine
          } else {
            console.log(`No routine found for ID: ${id}`);
          }
        } catch (error) {
          console.error(`Error fetching routine with ID ${id}:`, error);
        }
      }
      
      // If we get here, no routine was found with any ID
      console.log('No routine found after trying all possible IDs');
      setRoutineData(null);
      setRoutineLoading(false);
    };
    
    if (user) {
      fetchRoutineData();
    }
  }, [user]);
  
  // Extract today's classes from routine data
  useEffect(() => {
    if (!routineData) return;
    
    // Process the routine data to extract today's classes
    const todaysEntries = processRoutineData(routineData);
    updateClassSchedule(todaysEntries);
  }, [routineData, attendanceData]);
  
  // Function to process routine data and extract today's classes
  const processRoutineData = useCallback((routineData: any) => {
      if (!routineData || !routineData.entries || routineData.entries.length === 0) {
        console.log('No entries found in routine data');
        return [];
      }
      
      // Get current day of week with multiple format options for matching
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = daysOfWeek[new Date().getDay()];
      const todayShort = today.substring(0, 3);
      const todayUpper = today.toUpperCase();
      const todayShortUpper = todayShort.toUpperCase();
      
      console.log(`Current day: ${today}, looking for classes`);
      
      // Filter entries for today - try multiple day formats for robust matching
      const todaysEntries = routineData.entries.filter((entry: any) => {
        const entryDay = entry.day || '';
        const matches = [
          entryDay === today,
          entryDay === todayShort,
          entryDay === todayUpper,
          entryDay === todayShortUpper,
          entryDay.toUpperCase() === todayUpper,
          entryDay.toUpperCase() === todayShortUpper,
          // Add more flexible matching
          entryDay.toLowerCase() === today.toLowerCase(),
          entryDay.toLowerCase() === todayShort.toLowerCase(),
          // Handle potential day index (0-6) in the data
          entryDay === String(new Date().getDay()),
          // Handle potential day index (1-7) in the data
          entryDay === String(new Date().getDay() === 0 ? 7 : new Date().getDay())
        ].some(match => match);
        
        if (matches) {
          console.log(`Found class for today: ${entry.subject} at ${entry.timeSlot}`);
        }
        
        return matches;
      });
      
      console.log(`Found ${todaysEntries.length} classes for today`);
      return todaysEntries;
    }, []);
    
    // Function to fetch routine data from the API
    // Function to update class schedule with current time status and attendance data
    const updateClassSchedule = useCallback((entries: any[]) => {
      // Get current time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      console.log(`Current time: ${currentHour}:${currentMinute}`);
      
      // Get today's date in YYYY-MM-DD format for attendance comparison
      const today = new Date().toISOString().split('T')[0];
      
      // Convert to schedule format with status based on current time and attendance data
      const scheduleEntries = entries.map((entry: any) => {
        console.log(`[updateClassSchedule] Processing entry: ${entry.subject} (${entry._id || 'no_id'}) at ${entry.timeSlot}. Initial entry status: ${entry.status}, attendanceStatus: ${entry.attendanceStatus}`);

        // Extract and normalize time information
        const timeSlot = entry.timeSlot || '';
        console.log('\n=== Processing Routine Entry ===');
        console.log('Raw timeSlot:', timeSlot);
        
        // First, normalize various dash characters to hyphen
        const timeRange = timeSlot.replace(/[–—]/g, '-');
        console.log('Normalized timeRange:', timeRange);
        
        // Try to extract start and end times
        let startTime = '';
        let endTime = '';
        
        // Handle different time formats
        if (timeRange.includes('-')) {
          // Format: "HH:MM-HH:MM"
          [startTime, endTime] = timeRange.split('-').map((t: string) => t.trim());
        } else if (timeRange.includes(':')) {
          // Format: "HH:MM"
          startTime = timeRange.trim();
          // Calculate end time as start + duration from entry or default to 1 hour
          const duration = entry.duration || 60; // duration in minutes
          const [hour, minute] = startTime.split(':').map(Number);
          const startDate = new Date();
          startDate.setHours(hour, minute);
          const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
          endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        } else if (timeRange.match(/^\d{4}$/)) {
          // Format: "HHMM"
          const hour = timeRange.substring(0, 2);
          const minute = timeRange.substring(2, 4);
          startTime = `${hour}:${minute}`;
          // Default to 1-hour duration
          const startDate = new Date();
          startDate.setHours(parseInt(hour), parseInt(minute));
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
          endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        }
        
        console.log('Parsed times:', { startTime, endTime });
        console.log('=== End Processing Routine Entry ===\n');
        
        // Parse start and end times
        let startHour = 0;
        let startMinute = 0;
        let endHour = 0;
        let endMinute = 0;
        
        if (startTime) {
          try {
            // Try to parse time range with different possible formats
            let start, end;
            
            // Try format "16:46-16:48"
            if (startTime.includes('-')) {
              [start, end] = startTime.split('-').map(t => t.trim());
            }
            // Try format "16:46" (assume 1 hour duration)
            else {
              start = startTime.trim();
              // Calculate end time as start + 1 hour
              const startDate = new Date();
              const [sh, sm] = start.split(':').map(Number);
              startDate.setHours(sh, sm);
              const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
              end = `${endDate.getHours()}:${endDate.getMinutes()}`;
            }
            
            // Parse start time
            const startParts = start.split(':');
            if (startParts.length === 2) {
              startHour = parseInt(startParts[0]) || 0;
              startMinute = parseInt(startParts[1]) || 0;
            } else {
              console.warn(`Invalid start time format: ${start}`);
              startHour = 0;
              startMinute = 0;
            }
            
            // Parse end time
            const endParts = end.split(':');
            if (endParts.length === 2) {
              endHour = parseInt(endParts[0]) || startHour + 1;
              endMinute = parseInt(endParts[1]) || startMinute;
            } else {
              console.warn(`Invalid end time format: ${end}, using start + 1 hour`);
              endHour = startHour + 1;
              endMinute = startMinute;
            }
            
            console.log(`Parsed time range: ${startHour}:${startMinute} to ${endHour}:${endMinute}`);
          } catch (error) {
            console.error('Error parsing time:', error);
            // Default to 1-hour duration if parsing fails
            startHour = 0;
            startMinute = 0;
            endHour = 1;
            endMinute = 0;
          }
        }
        
        // Get current time
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Convert times to minutes for easier comparison
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;
        const windowCloseTimeInMinutes = endTimeInMinutes + 20; // 20-minute window after class ends
        
        // Determine class status based on current time, attendance marking, and handover status
        let status = 'pending'; // Use lowercase to match faculty dashboard
        
        console.log('\n=== Time Calculations ===');
        console.log(`Raw time from schedule: "${startTime}"`);
        console.log(`Current time: ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')} (${currentTimeInMinutes} minutes)`);
        console.log(`Class time: ${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')} (${startTimeInMinutes}-${endTimeInMinutes} minutes)`);
        console.log(`Window closes at: ${Math.floor(windowCloseTimeInMinutes/60).toString().padStart(2, '0')}:${(windowCloseTimeInMinutes%60).toString().padStart(2, '0')} (${windowCloseTimeInMinutes} minutes)`);
        console.log('Time comparisons:');
        console.log(`- Current > Window Close: ${currentTimeInMinutes > windowCloseTimeInMinutes}`);
        console.log(`- Current > End Time: ${currentTimeInMinutes > endTimeInMinutes}`);
        console.log(`- Current >= Start Time: ${currentTimeInMinutes >= startTimeInMinutes}`);
        console.log('=== End Time Calculations ===\n');
        
        // Generate a unique key for this class entry
        const entryId = entry._id ? entry._id.toString() : '';
        const classKey = `${today}_${entry.subject}_${timeRange}_${entryId}`;
        
        // Check if we've already marked this class in our local state
        const locallyMarked = markedClasses[classKey] === 'taken';
        
        // More robust attendance record matching
        const attendanceRecord = attendanceDataRef.current.find((record: any) => {
          // Match by class ID if available (most reliable method)
          if (entryId && record.classId === entryId) {
            console.log(`Found attendance record by classId match: ${entryId}`);
            return true;
          }
          
          // Match by routineEntryId if available
          if (record.routineEntryId && record.routineEntryId === entryId) {
            console.log(`Found attendance record by routineEntryId match: ${entryId}`);
            return true;
          }
          
          // Otherwise try to match by subject, time, and date
          const recordDate = record.date ? new Date(record.date).toISOString().split('T')[0] : '';
          const subjectMatch = record.subject === entry.subject;
          const timeMatch = record.timeSlot === entry.timeSlot || record.timeSlot === timeRange;
          const dateMatch = recordDate === today;
          
          if (subjectMatch && timeMatch && dateMatch) {
            console.log(`Found attendance record by subject/time/date match: ${record.subject}, ${record.timeSlot}, ${recordDate}`);
            return true;
          }
          
          return false;
        });
        
        // Check if attendance is marked based on attendance records or local state
        // Accept both 'Taken' and 'taken' for compatibility
        const attendanceMarked = locallyMarked || (attendanceRecord &&
          (attendanceRecord.status?.toLowerCase() === 'taken' ||
           entry.status?.toLowerCase() === 'taken' ||
           attendanceRecord.attendanceMarked === true));
           
        // If the API shows this class as taken, make sure our local state reflects that
        if (attendanceRecord &&
            (attendanceRecord.status?.toLowerCase() === 'taken' ||
             attendanceRecord.attendanceMarked === true) &&
            !locallyMarked) {
          // Update our local tracking
          const updatedClasses = {...markedClasses, [classKey]: 'taken'};
          setMarkedClasses(updatedClasses);
          saveMarkedClasses(updatedClasses);
          console.log(`Added class to local tracking: ${classKey}`);
        }
           
        console.log(`Attendance marked check for ${entry.subject} at ${timeRange}: `, {
          hasAttendanceRecord: !!attendanceRecord,
          attendanceRecordStatus: attendanceRecord?.status,
          entryStatus: entry.status,
          attendanceMarkedFlag: attendanceRecord?.attendanceMarked,
          locallyMarked,
          finalDecision: attendanceMarked
        });
        
        // Check if the entry already has a status saved in the database
        // This helps maintain status after refresh
        if (entry.status && typeof entry.status === 'string') {
          // Normalize status to lowercase for consistency
          const normalizedStatus = entry.status.toLowerCase();
          if (['taken', 'missed', 'handover', 'handed over', 'window-open', 'pending'].includes(normalizedStatus)) {
            // Use the saved status from the database
            status = normalizedStatus;
            console.log(`[updateClassSchedule] Entry ${entry.subject}: Using status from routine entry.status: '${status}'`);
          }
        }
        
        // Override with attendance record if it exists
        if (attendanceMarked || (attendanceRecord && attendanceRecord.status === 'taken')) {
          // If attendance is already marked, show as taken
          status = 'taken';
          console.log(`[updateClassSchedule] Entry ${entry.subject}: Status set to 'taken' due to attendanceMarked (${attendanceMarked}) or attendanceRecord.status ('${attendanceRecord?.status}')`);
          
          // Ensure this is tracked in our local state
          if (!markedClasses[classKey]) {
            const updatedClasses = {...markedClasses, [classKey]: 'taken'};
            setMarkedClasses(updatedClasses);
            saveMarkedClasses(updatedClasses);
            console.log(`[updateClassSchedule] Entry ${entry.subject}: Added to local 'markedClasses' as taken.`);
          }
        } else if (entry.status === 'taken' || entry.attendanceStatus === 'taken') {
          // If the entry itself has a taken status (this might be redundant if entry.status was already used)
          status = 'taken';
          console.log(`[updateClassSchedule] Entry ${entry.subject}: Status set to 'taken' from routine entry's own status fields (entry.status: '${entry.status}', entry.attendanceStatus: '${entry.attendanceStatus}')`);
        } else if (entry.handoverStatus === "Handed Over") {
          // If class has been handed over to another faculty
          status = 'handed over';
          console.log(`[updateClassSchedule] Entry ${entry.subject}: Status set to 'handed over'. Substitute: ${entry.substituteName || 'another faculty'}`);
        } else if (entry.handover === true) {
          // If this is a handover class (faculty is substitute)
          status = 'handover';
          console.log(`[updateClassSchedule] Entry ${entry.subject}: Status set to 'handover' (substitute class). Original faculty: ${entry.originalFacultyName || 'another faculty'}`);
        } else if (attendanceRecord && attendanceRecord.status === 'missed') {
          // If already marked as missed in database, keep it missed
          status = 'missed';
          console.log(`[updateClassSchedule] Entry ${entry.subject}: Status set to 'missed' based on attendanceRecord.status: '${attendanceRecord.status}'`);
        } else if (currentTimeInMinutes > windowCloseTimeInMinutes && !attendanceMarked && status !== 'taken' && status !== 'handed over' && status !== 'handover') {
          // Class time has completely passed (using windowCloseTimeInMinutes which is currently endTimeInMinutes)
          // and it's not marked taken, and it's not a handover scenario that's already handled
          status = 'missed';
          console.log(`[updateClassSchedule] Entry ${entry.subject}: Status set to 'missed' (time passed). Current: ${currentTimeInMinutes}, WindowClose: ${windowCloseTimeInMinutes}`);
        } else if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= windowCloseTimeInMinutes && !attendanceMarked && status !== 'taken' && status !== 'handed over' && status !== 'handover') {
          // Class is in progress or within window, and attendance not yet marked, and not already handled by other statuses
          status = 'pending'; // Show as pending so it can be marked
          console.log(`[updateClassSchedule] Entry ${entry.subject}: Status set to 'pending' (window open for marking). Current time: ${currentTimeInMinutes}, Start: ${startTimeInMinutes}, WindowClose: ${windowCloseTimeInMinutes}`);
        } else if (currentTimeInMinutes < startTimeInMinutes && status !== 'taken' && status !== 'handed over' && status !== 'handover' && status !== 'missed') {
          // Class hasn't started yet, and not already handled by other statuses
          status = 'pending';
          console.log(`[updateClassSchedule] Entry ${entry.subject}: Status set to 'pending' (pre-class). Current time: ${currentTimeInMinutes}, Start: ${startTimeInMinutes}`);
        }
        // If none of the above, status remains as determined by earlier checks (e.g., from entry.status, attendanceRecord, or handover logic)
        
        // Final override for handover classes to ensure correct status display
        if (entry.handover === true && status !== 'taken' && status !== 'missed') { // Don't override if already taken/missed by substitute
          status = 'handover'; // Use lowercase for consistency
          console.log(`[updateClassSchedule] Entry ${entry.subject}: Final status override to 'handover' (substitute class).`);
        }
        
        // Final override for classes handed over by this faculty
        if (entry.handoverStatus === "Handed Over") {
          status = 'handed over'; // Use lowercase for consistency
          console.log(`[updateClassSchedule] Entry ${entry.subject}: Final status override to 'handed over' (class given to another faculty).`);
        }
        
        console.log(`[updateClassSchedule] Entry ${entry.subject}: Final computed status: '${status}'`);
        return {
          time: timeRange,
          startHour,
          startMinute,
          subject: entry.subject || 'Unknown Subject',
          course: entry.department,
          roomNo: entry.roomNumber || entry.roomNo || 'TBD',
          status: status,
          id: entry._id || `class-${startHour}-${startMinute}-${entry.subject}`,
          // Add handover-specific information if available
          handover: entry.handover || false,
          originalFacultyName: entry.originalFacultyName || null,
          handoverDate: entry.handoverDate || null,
          handoverId: entry.handoverId || null,
          // Add attendance tracking information
          attendanceMarked: entry.attendanceMarked || false,
          attendanceMarkedAt: entry.attendanceMarkedAt || null
        };
      });
      
      // Sort classes by time
      scheduleEntries.sort((a: any, b: any) => {
        if (a.startHour !== b.startHour) {
          return a.startHour - b.startHour;
        }
        return a.startMinute - b.startMinute;
      });
      
      // Update class statistics - normalize status to lowercase for consistency
      const stats = {
        scheduled: scheduleEntries.length,
        taken: scheduleEntries.filter(entry =>
          entry.status?.toLowerCase() === 'taken'
        ).length,
        handover: scheduleEntries.filter(entry =>
          entry.status?.toLowerCase() === 'handover' || entry.status?.toLowerCase() === 'handed over'
        ).length,
        missed: scheduleEntries.filter(entry =>
          entry.status?.toLowerCase() === 'missed'
        ).length
      };
      
      console.log('Class status counts:', {
        taken: scheduleEntries.filter(entry => entry.status === 'taken').length,
        'Taken (uppercase)': scheduleEntries.filter(entry => entry.status === 'Taken').length,
        missed: scheduleEntries.filter(entry => entry.status === 'missed').length,
        'Missed (uppercase)': scheduleEntries.filter(entry => entry.status === 'Missed').length,
        handover: scheduleEntries.filter(entry => entry.status === 'handover').length,
        'handed over': scheduleEntries.filter(entry => entry.status === 'handed over').length,
        'window-open': scheduleEntries.filter(entry => entry.status === 'window-open').length,
        pending: scheduleEntries.filter(entry => entry.status === 'pending').length
      });
      
      // Set today's classes and update statistics
      setTodayClasses(scheduleEntries);
      setClassStats(stats);
      console.log('Updated class schedule:', scheduleEntries);
    }, [markedClasses]);

    // Function to fetch routine data from the API
    const fetchAndProcessRoutine = useCallback(async () => {
      if (!user) {
        console.log('No user data available');
        return;
      }
      
      // Try multiple ID fields to ensure we find the routine
      const possibleIds = [
        user.facultyId,
        user._id,
        // Use any other potential ID fields that might exist
        (user as any).id,
        (user as any).userId
      ].filter(Boolean); // Remove any undefined/null values
      
      if (possibleIds.length === 0) {
        console.log('No valid ID found to fetch routine');
        setRoutineLoading(false);
        return;
      }
      
      setRoutineLoading(true);
      
      // Try each possible ID
      for (const id of possibleIds) {
        try {
          console.log(`Attempting to fetch routine with ID: ${id}`);
          
          const response = await fetch(`/api/routines?facultyId=${id}`);
          
          if (!response.ok) {
            console.error(`Failed to fetch routine with ID ${id}: ${response.statusText}`);
            continue; // Try next ID
          }
          
          const data = await response.json();
          
          if (data.routine) {
            console.log(`Successfully found routine using ID: ${id}`);
            setRoutineData(data.routine);
            setRoutineError(null);
            
            // Process the routine data
            const todaysEntries = processRoutineData(data.routine);
            updateClassSchedule(todaysEntries);
            setRoutineLoading(false);
            return; // Exit after finding a valid routine
          } else {
            console.log(`No routine found for ID: ${id}`);
          }
        } catch (error) {
          console.error(`Error fetching routine with ID ${id}:`, error);
        }
      }
      
      // If we get here, no routine was found with any ID
      console.log('No routine found after trying all possible IDs');
      setRoutineData(null);
      setTodayClasses([]);
      setClassStats({
        scheduled: 0,
        taken: 0,
        handover: 0,
        missed: 0
      });
      setRoutineLoading(false);
    }, [user, processRoutineData, updateClassSchedule]);
    
    // Function to fetch attendance data for today
    const fetchAttendanceData = useCallback(async () => {
      if (!user) {
        console.log('No user data available for attendance');
        return;
      }
      
      setAttendanceLoading(true);
      
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Try multiple ID fields to ensure we find the attendance data
        const possibleIds = [
          user.facultyId,
          user._id,
          (user as any).id
        ].filter(Boolean);
        
        if (possibleIds.length === 0) {
          console.log('No valid ID found to fetch attendance');
          setAttendanceLoading(false);
          return;
        }
        
        // Add a cache-busting parameter to prevent browser caching
        const cacheBuster = new Date().getTime();
        
        // Try each possible ID
        for (const id of possibleIds) {
          try {
            console.log(`Attempting to fetch attendance with ID: ${id}`);
            
            // First try the new faculty class-attendance-tracking API with stronger cache busting
            const classTrackingResponse = await fetch(
              `/api/faculty/class-attendance-tracking?facultyId=${id}&date=${today}&t=${cacheBuster}&nocache=${Math.random()}`,
              {
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                },
                // Use cache: 'no-store' to bypass browser cache completely
                cache: 'no-store'
              }
            );
            
            if (classTrackingResponse.ok) {
              const data = await classTrackingResponse.json();
              console.log('Class tracking API response:', data);
              
              if (data.classes && Array.isArray(data.classes)) {
                console.log(`Successfully found class data using ID: ${id}`);
                
                // Process the classes data to update local state
                const attendanceRecords = data.classes.map((cls: any) => ({
                  facultyId: id,
                  routineId: cls.id || cls._id,
                  classId: cls.id || cls._id,
                  status: cls.status || cls.attendanceStatus || 'pending',
                  subject: cls.subject,
                  timeSlot: cls.timeSlot || cls.time,
                  date: today,
                  lastModified: cls.lastModified || Date.now()
                }));
                
                // Update the attendance data state
                setAttendanceData(attendanceRecords);
                setLastAttendanceFetch(cacheBuster); // Update the timestamp
                setAttendanceLoading(false);
                
                // Dispatch an event to notify other components of the update
                window.dispatchEvent(new CustomEvent('attendanceDataUpdated', {
                  detail: {
                    classes: attendanceRecords,
                    timestamp: cacheBuster
                  }
                }));
                
                return; // Exit after finding valid attendance records
              }
            }
            
            // Fall back to the old attendance API if needed
            const response = await fetch(`/api/attendance?facultyId=${id}&period=day&date=${today}&_=${cacheBuster}`, {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              },
              cache: 'no-store'
            });
            
            if (!response.ok) {
              console.error(`Failed to fetch attendance with ID ${id}: ${response.statusText}`);
              continue; // Try next ID
            }
            
            const data = await response.json();
            
            if (data.attendanceRecords) {
              console.log(`Successfully found attendance records using ID: ${id}`);
              console.log('Attendance data:', data.attendanceRecords);
              setAttendanceData(data.attendanceRecords);
              setLastAttendanceFetch(cacheBuster); // Update the timestamp
              setAttendanceLoading(false);
              return; // Exit after finding valid attendance records
            } else {
              console.log(`No attendance records found for ID: ${id}`);
            }
          } catch (error) {
            console.error(`Error fetching attendance with ID ${id}:`, error);
          }
        }
        
        // If we get here, no attendance records were found
        console.log('No attendance records found after trying all possible IDs');
        setAttendanceData([]);
        setAttendanceLoading(false);
      } catch (error) {
        console.error('Error in fetchAttendanceData:', error);
        setAttendanceData([]);
        setAttendanceLoading(false);
      }
    }, [user]);
        
  // Effect to load routine and attendance data on component mount
  useEffect(() => {
    if (!user) return;
    
    console.log('Loading routine and attendance data...');
          
    // Load any locally saved marked classes
    try {
      const savedMarkedClasses = localStorage.getItem('markedClasses');
      if (savedMarkedClasses) {
        const parsed = JSON.parse(savedMarkedClasses);
        // Only use today's marked classes
        const today = new Date().toISOString().split('T')[0];
        const todaysClasses: Record<string, string> = {};
              
        // Safely parse and filter the entries
        Object.entries(parsed).forEach(([key, value]) => {
          if (typeof key === 'string' && key.startsWith(today) && 
              typeof value === 'string') {
            todaysClasses[key] = value;
          }
        });
              
        setMarkedClasses(todaysClasses);
        console.log('Loaded marked classes from local storage:', todaysClasses);
      }
    } catch (error) {
      console.error('Error loading marked classes from local storage:', error);
    }
    
    // Initial data load
    fetchAndProcessRoutine();
    fetchAttendanceData();
    
    // Force an immediate refresh to ensure we have the latest data
    setTimeout(() => {
      console.log('Performing immediate refresh of attendance data...');
      fetchAttendanceData();
    }, 1000);
    
    // Set up polling to check for updates every 10 seconds
    const fetchTimer = setInterval(() => {
      console.log('[Page Polling] Polling for routine and attendance updates (every 10s)...');
      fetchAndProcessRoutine();
      fetchAttendanceData();
    }, 10000); // Increased to 10 seconds
    
    // Set up a timer to update the class schedule display logic every 7 seconds
    // This primarily recalculates statuses based on current time against fetched data
    const statusUpdateDisplayTimer = setInterval(() => {
      if (routineData && routineData.entries && routineData.entries.length > 0) {
        console.log('[Page Polling] Updating class schedule display statuses (every 7s)...');
        // Re-process the original routine data to update statuses based on current time
        const todaysEntries = processRoutineData(routineData); // This gets today's classes from full routine
        
        // updateClassSchedule will internally update todayClasses and classStats states
        // It contains extensive logging for status determination
        updateClassSchedule(todaysEntries);
      }
    }, 7000); // Increased to 7 seconds
    
    // Cleanup function
    return () => {
      clearInterval(fetchTimer);
      clearInterval(statusUpdateDisplayTimer); // Corrected timer name
    };
  }, [user]); // Only depend on user to avoid infinite loops. fetchAndProcessRoutine, fetchAttendanceData, processRoutineData, updateClassSchedule are stable due to useCallback or being outside useEffect.

  // Function to get the appropriate status icon based on class status
  const getStatusIcon = (status: string): React.ReactElement => {
    switch (status) {
      case 'Taken':
        return <Check className="inline-block w-4 h-4 text-green-500 mr-1" />;
      case 'Handover':
        return <RefreshCw className="inline-block w-4 h-4 text-yellow-500 mr-1" />;
      case 'Handed Over':
        return <RefreshCw className="inline-block w-4 h-4 text-blue-500 mr-1" />;
      case 'Pending':
        return <Clock className="inline-block w-4 h-4 text-gray-500 mr-1" />;
      case 'Missed':
        return <AlertCircle className="inline-block w-4 h-4 text-red-500 mr-1" />;
      default:
        return <Clock className="inline-block w-4 h-4 text-gray-500 mr-1" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Taken':
        return 'secondary';
      case 'Handover':
        return 'default';
      case 'Handed Over':
        return 'default'; // Using 'default' instead of 'info' which isn't a valid variant
      case 'Pending':
        return 'outline';
      case 'Missed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Default filter options if no classes are available
  const uniqueCourses = todayClasses.length > 0 
    ? ['All Courses', ...new Set(todayClasses.map(schedule => schedule.course))]
    : ['All Courses'];
    
  const uniqueSubjects = todayClasses.length > 0
    ? ['All Subjects', ...new Set(todayClasses.map(schedule => schedule.subject))]
    : ['All Subjects'];

  const filteredSchedule = todayClasses.filter(schedule => {
    const matchesCourse = courseFilter === 'All Courses' || schedule.course === courseFilter;
    const matchesSubject = subjectFilter === 'All Subjects' || schedule.subject === subjectFilter;
    return matchesCourse && matchesSubject;
  });

  // Handler for when attendance is marked (via event)  
  const handleAttendanceMarked = useCallback((data: any) => {
    console.log('Attendance marked event received in faculty dashboard:', data);
    
    // Force refresh attendance data
    fetchAttendanceData();
    
    // Also refresh the routine data to update class statuses
    fetchAndProcessRoutine();
  }, [fetchAttendanceData, fetchAndProcessRoutine]);
  
  // Handler for attendance status changes (via event or polling)
  const handleStatusChanged = useCallback((data: any) => {
    console.log('Status changed event received in faculty dashboard:', data);
    
    if (data.classes && Array.isArray(data.classes)) {
      const attendanceRecords = data.classes.map((cls: any) => ({
        facultyId: user?._id || user?.facultyId,
        routineId: cls.id,
        classId: cls.id,
        status: cls.status || cls.attendanceStatus || 'pending',
        subject: cls.subject,
        timeSlot: cls.timeSlot || cls.time,
        date: new Date().toISOString().split('T')[0]
      }));
      
      // This state update will trigger the useEffect hook that re-calculates the schedule
      setAttendanceData(attendanceRecords);
      setLastAttendanceFetch(data.timestamp || Date.now());
      
      // Immediately update the UI for any missed classes
      const missedClasses = data.classes.filter((cls: any) => cls.status === 'missed');
      if (missedClasses.length > 0) {
        console.log(`Found ${missedClasses.length} missed classes, updating UI immediately`);
        // Update todayClasses to reflect missed status immediately
        setTodayClasses(prevClasses => 
          prevClasses.map(cls => {
            const missedClass = missedClasses.find((mc: {id: string}) => mc.id === cls.id);
            return missedClass ? { ...cls, status: 'missed' } : cls;
          })
        );
        
        // Also update class stats
        setClassStats(prevStats => ({
          ...prevStats,
          missed: (prevStats.missed || 0) + missedClasses.length
        }));
      }
    }
  }, [user]); // This function now has stable dependencies
const handleTakeClass = async (schedule: any) => {
    if (!user) return;

    const payload = {
      facultyId: user.facultyId || user._id,
      classId: schedule.id,
      status: 'Taken',
      subject: schedule.subject,
      course: schedule.course,
      roomNo: schedule.roomNo,
      timeSlot: schedule.time,
      date: new Date().toISOString(),
      isHandover: schedule.handover,
      handoverId: schedule.handoverId
    };

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Manually update the UI to reflect the change immediately
        const updatedClasses = todayClasses.map(cls =>
          cls.id === schedule.id ? { ...cls, status: 'Taken' } : cls
        );
        setTodayClasses(updatedClasses);

        // Update the stats
        const stats = {
          scheduled: updatedClasses.length,
          taken: updatedClasses.filter(
            entry => entry.status?.toLowerCase() === 'taken'
          ).length,
          handover: updatedClasses.filter(
            entry =>
              entry.status?.toLowerCase() === 'handover' ||
              entry.status?.toLowerCase() === 'handed over'
          ).length,
          missed: updatedClasses.filter(
            entry => entry.status?.toLowerCase() === 'missed'
          ).length
        };
        setClassStats(stats);
      } else {
        console.error('Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  return (
    <>
      <AttendanceStatusListener 
        onAttendanceMarked={handleAttendanceMarked}
        onStatusChanged={handleStatusChanged}
        pollingInterval={5000} // Poll every 5 seconds
        facultyId={user?._id || user?.facultyId}
      />
      <HandoverStatusListener facultyId={user?._id || user?.facultyId} />
      <div className="min-h-screen bg-gray-100 relative">
      {/* Mobile Menu Button */}
      <button 
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#59159d] text-white p-2 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Toggle menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-purple-800 text-white p-6 z-40 transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Nursing Institute</h1>
          </div>
          
          <nav className="flex-1">
            <ul className="space-y-4">
              <li className="bg-purple-700 rounded-lg p-3 cursor-pointer">
                <a href="#" className="flex items-center justify-between">
                  <span>Dashboard</span>
                  <Home size={24} />
                </a>
              </li>
              <li className="hover:bg-purple-700 rounded-lg p-3 cursor-pointer">
                <a href="/class-routine" className="flex items-center justify-between">
                  <span>Class Routine</span>
                  <Calendar size={24} />
                </a>
              </li>
              <li className="hover:bg-purple-700 rounded-lg p-3 cursor-pointer">
                <a href="/request-handover" className="flex items-center justify-between">
                  <span>Request Handover</span>
                  <RefreshCw size={24} />
                </a>
              </li>
              <li className="hover:bg-purple-700 rounded-lg p-3 cursor-pointer">
                <a href="/attendance-report" className="flex items-center justify-between">
                  <span>Attendance Report</span>
                  <Calendar size={24} />
                </a>
              </li>
              <li className="hover:bg-purple-700 rounded-lg p-3 cursor-pointer">
                <a href="/faculty-dashboard/official-announcements" className="flex items-center justify-between">
                  <span>Official Notifications</span>
                  <Bell size={24} />
                </a>
              </li>
            </ul>
          </nav>
          
          <div className="mt-auto">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-purple-700 cursor-pointer">
                  <Avatar>
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {user?.name ? user.name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase() : '??'}
                      </div>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-sm text-gray-300">{user?.role}</p>
                  </div>
                </div>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content sideOffset={5} align="end" className="w-56 bg-white rounded-lg shadow-lg p-2 mt-2 z-50 mr-4 border border-gray-200">
                  <DropdownMenu.Item className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer rounded-md transition-colors" onClick={() => router.push('/account')}>
                    <User className="w-4 h-4 mr-2" />
                    My Account
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                  <div className="px-1 py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer rounded-md transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-4 md:p-8 md:ml-64 transition-all duration-300 ease-in-out">
        {/* Faculty Attendance Alert Banner */}
        <AttendanceAlertBanner />
        {/* Top Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-4 rounded-lg shadow-sm mt-10 md:mt-0">
          <div>
            <DynamicGreeting 
              userName={user?.name} 
              userRole={`${user?.role || 'Faculty'} | ${user?.department || 'Nursing'}`}
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="text-gray-600">
              <div className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button
              onClick={() => {
                fetchAndProcessRoutine();
                fetchAttendanceData();
              }}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${routineLoading ? 'animate-spin' : ''}`} />
            </button>
            <FacultyNotifications />
          </div>
        </header>

        {/* Alert Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Reminder: Please mark your class attendance before 5:00 PM today.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Scheduled</h3>
                <p className="text-3xl font-bold text-blue-600">{classStats.scheduled}</p>
                <p className="text-sm text-gray-600">Today's total classes</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Taken</h3>
                <p className="text-3xl font-bold text-green-600">{classStats.taken}</p>
                <p className="text-sm text-gray-600">Classes completed</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Handover</h3>
                <p className="text-3xl font-bold text-yellow-600">{classStats.handover}</p>
                <p className="text-sm text-gray-600">Handed over to colleagues</p>
              </div>
              <RefreshCw className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Missed</h3>
                <p className="text-3xl font-bold text-red-600">{classStats.missed}</p>
                <p className="text-sm text-gray-600">Classes not taken</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Class Schedule Table */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 className="text-xl font-semibold">Today's Class Schedule</h3>
            </div>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-gray-600">Time</th>
                    <th className="text-left py-3 px-4 text-gray-600">Subject</th>
                    <th className="text-left py-3 px-4 text-gray-600">Course</th>
                    <th className="text-left py-3 px-4 text-gray-600">Room No.</th>
                    <th className="text-left py-3 px-4 text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSchedule.map((schedule, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4">{schedule.time}</td>
                      <td className="py-3 px-4">{schedule.subject}</td>
                      <td className="py-3 px-4">{schedule.course}</td>
                      <td className="py-3 px-4">{schedule.roomNo || schedule.roomNumber || 'TBD'}</td>
                      <td className="py-3 px-4">
                        {schedule.status === 'pending' && schedule.handover ? (
                          <button
                            onClick={() => handleTakeClass(schedule)}
                            className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                          >
                            Take Class
                          </button>
                        ) : (
                          getStatusBadge(schedule.status)
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredSchedule.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">
                        {routineLoading ? (
                          <div className="flex justify-center items-center">
                            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                            Loading class schedule...
                          </div>
                        ) : (
                          <div>
                            <p>No classes scheduled for today.</p>
                            <p className="text-sm mt-1">Enjoy your day!</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </main>
    </div>
    </>
  );
}
