'use client';

import { useEffect } from 'react';

interface AttendanceStatusListenerProps {
  onAttendanceMarked?: (data: any) => void;
  onStatusChanged?: (data: any) => void;
  pollingInterval?: number; // in milliseconds
  facultyId?: string;
}

/**
 * Component that listens for attendance status changes and triggers callbacks.
 * This component doesn't render anything but sets up event listeners
 * for real-time attendance status updates.
 */
export default function AttendanceStatusListener({
  onAttendanceMarked,
  onStatusChanged,
  pollingInterval = 5000, // 5 seconds for more responsiveness
  facultyId
}: AttendanceStatusListenerProps) {
  
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
          
          if (onStatusChanged && data.classes) {
            window.dispatchEvent(new CustomEvent('attendanceDataUpdated', { detail: { classes: data.classes } }));
            onStatusChanged({ classes: data.classes });
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

    // Start the polling
    poll();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [onAttendanceMarked, onStatusChanged, pollingInterval, facultyId]);
  
  // Render nothing (this is just an event handler component)
  return null;
}
