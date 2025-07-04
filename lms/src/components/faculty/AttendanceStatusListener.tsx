'use client';

import { useEffect, useState } from 'react';

interface AttendanceStatusListenerProps {
  onAttendanceMarked?: (data: any) => void;
  onStatusChanged?: (data: any) => void;
  pollingInterval?: number; // in milliseconds
  facultyId?: string;
}

interface ClassData {
  id: string;
  status: string;
  subject: string;
  [key: string]: any;
}

/**
 * Component that listens for attendance status changes and triggers callbacks.
 * This component doesn't render anything but sets up event listeners
 * for real-time attendance status updates.
 */
export default function AttendanceStatusListener({
  onAttendanceMarked,
  onStatusChanged,
  pollingInterval = 3000, // 3 seconds for more immediate responsiveness
  facultyId
}: AttendanceStatusListenerProps) {
  const [lastClassData, setLastClassData] = useState<Record<string, ClassData>>({});
  
  useEffect(() => {
    if (!facultyId) return;

    let isPolling = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (isPolling) return;
      isPolling = true;

      try {
        const today = new Date().toLocaleDateString('en-CA');
        const response = await fetch(
          `/api/faculty/class-attendance-tracking?facultyId=${facultyId}&date=${today}&t=${Date.now()}`,
          { cache: 'no-store' }
        );

        if (response.ok) {
          const data = await response.json();
          
          if (data.classes && Array.isArray(data.classes)) {
            // Create a map of the current classes by ID
            const currentClassMap: Record<string, ClassData> = {};
            let statusChanged = false;
            
            // Check for status changes
            data.classes.forEach((cls: ClassData) => {
              if (cls.id) {
                currentClassMap[cls.id] = cls;
                
                // Check if this class status has changed
                const previousClass = lastClassData[cls.id];
                if (!previousClass || previousClass.status !== cls.status) {
                  statusChanged = true;
                  console.log(`Class status changed: ${cls.subject} is now ${cls.status}`);
                  
                  // If status changed to missed, force an immediate UI update
                  if (cls.status === 'missed') {
                    // Dispatch a custom event for immediate UI update
                    window.dispatchEvent(new CustomEvent('classMissed', { 
                      detail: { classId: cls.id, className: cls.subject }
                    }));
                  }
                }
              }
            });
            
            // Update our stored class data
            setLastClassData(currentClassMap);
            
            // Notify listeners if there were changes
            if (statusChanged && onStatusChanged) {
              window.dispatchEvent(new CustomEvent('attendanceDataUpdated', { 
                detail: { classes: data.classes } 
              }));
              onStatusChanged({ classes: data.classes });
            }
          }

          if (data.notifications && data.notifications.length > 0) {
            data.notifications.forEach((notification: any) => {
              if (Notification.permission === 'granted') {
                new Notification(notification.title || 'Attendance Update', { body: notification.message });
              }
              window.dispatchEvent(new CustomEvent('hodAttendanceAction', { detail: notification }));
            });
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      } finally {
        isPolling = false;
        // Schedule the next poll
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(poll, pollingInterval);
      }
    };

    // Start the polling immediately
    poll();
    
    // Also set up a listener for manual refresh requests
    const handleRefreshRequest = () => poll();
    window.addEventListener('requestAttendanceRefresh', handleRefreshRequest);

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('requestAttendanceRefresh', handleRefreshRequest);
    };
  }, [onAttendanceMarked, onStatusChanged, pollingInterval, facultyId, lastClassData]);
  
  // Render nothing (this is just an event handler component)
  return null;
}
