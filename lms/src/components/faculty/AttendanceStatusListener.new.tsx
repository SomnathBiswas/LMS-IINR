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
  
  // Set up event listeners for custom events
  useEffect(() => {
    console.log('Setting up attendance status listeners');
    
    // Track polling state within the effect
    let isPolling = false;
    let consecutiveFailures = 0;
    let pollTimer: NodeJS.Timeout | null = null;
    
    // Handler for when attendance is marked
    const handleAttendanceMarked = (event: any) => {
      console.log('Attendance marked event received:', event.detail);
      if (onAttendanceMarked) {
        onAttendanceMarked(event.detail);
      }
    };
    
    // Handler for general status changes
    const handleStatusChanged = (event: any) => {
      console.log('Attendance status changed event received:', event.detail);
      if (onStatusChanged) {
        onStatusChanged(event.detail);
      }
    };
    
    // Function to update dashboard counters based on class status
    const updateDashboardCounters = (classes: any[]) => {
      // Calculate new counter values
      const counters = classes.reduce((acc: any, cls: any) => {
        const status = cls.status?.toLowerCase() || 'pending';
        
        if (status === 'taken') {
          acc.taken += 1;
        } else if (status === 'missed') {
          acc.missed += 1;
        } else if (status === 'window-open') {
          acc.windowOpen += 1;
        } else {
          acc.pending += 1;
        }
        
        return acc;
      }, { taken: 0, missed: 0, windowOpen: 0, pending: 0 });
      
      // Dispatch counter update event
      window.dispatchEvent(new CustomEvent('dashboardCountersUpdated', {
        detail: counters
      }));
      
      console.log('Updated dashboard counters:', counters);
      return counters;
    };
    
    // Create a function for polling that we can call both on interval and manually
    const pollForUpdates = async () => {
      // Skip if already polling or no facultyId
      if (isPolling || !facultyId) return;
      
      try {
        isPolling = true;
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Simple cache busting
        const cacheBuster = Date.now();
        
        // Fetch latest attendance data
        const response = await fetch(
          `/api/faculty/class-attendance-tracking?facultyId=${facultyId}&date=${today}&t=${cacheBuster}`,
          {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            cache: 'no-store'
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Reset consecutive failures on success
          consecutiveFailures = 0;
          
          // Log the data for debugging
          console.log(`Polled attendance data (${new Date().toLocaleTimeString()}):`, data);
          
          // Update dashboard counters
          if (data.classes && Array.isArray(data.classes)) {
            updateDashboardCounters(data.classes);
          }
          
          // Check for notifications that need to be shown
          if (data.notifications && Array.isArray(data.notifications)) {
            data.notifications.forEach((notification: any) => {
              // For HOD-marked status changes, show browser notification if possible
              if (notification.markedBy === 'hod' && Notification.permission === 'granted') {
                const title = notification.status === 'taken' 
                  ? 'Class Attendance Taken' 
                  : 'Class Attendance Missed';
                  
                const message = notification.status === 'taken'
                  ? `HOD marked ${notification.subject} as taken`
                  : `HOD marked ${notification.subject} as missed`;
                  
                new Notification(title, { body: message });
              }
            });
          }
          
          // If we have a callback for status changes, call it with the new data
          if (onStatusChanged && data.classes) {
            // Dispatch a custom event for other components to listen to
            window.dispatchEvent(new CustomEvent('attendanceStatusChanged', { 
              detail: { 
                classes: data.classes,
                timestamp: cacheBuster,
                source: 'polling'
              } 
            }));
            
            // Also dispatch a more general data update event
            window.dispatchEvent(new CustomEvent('attendanceDataUpdated', { 
              detail: { 
                classes: data.classes,
                timestamp: cacheBuster,
                source: 'polling'
              } 
            }));
              
            // Also call the callback directly
            onStatusChanged({
              classes: data.classes,
              timestamp: cacheBuster,
              source: 'polling'
            });
          }
        }
      } catch (error) {
        console.error('Error polling for attendance updates:', error);
        
        // Increment consecutive failures
        consecutiveFailures++;
        
        // If we've failed too many times, extend the polling interval
        if (consecutiveFailures > 3) {
          console.warn('Too many consecutive polling failures, extending interval');
        }
      } finally {
        // Always reset the polling state
        isPolling = false;
      }
    };
    
    // Function to check for HOD notifications and status changes
    const checkForHodActions = async () => {
      if (!facultyId) return;
      
      try {
        const cacheBuster = Date.now();
        // This API endpoint should return any new HOD actions
        const response = await fetch(
          `/api/notifications?userId=${facultyId}&type=attendance&t=${cacheBuster}`,
          {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            cache: 'no-store'
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.notifications && data.notifications.length > 0) {
            console.log('New notifications from HOD:', data.notifications);
            
            // Process notifications and trigger UI updates
            data.notifications.forEach((notification: any) => {
              // For HOD-marked status changes, show notification and update UI
              if (notification.type === 'attendance') {
                // Show browser notification if possible
                if (Notification.permission === 'granted') {
                  const title = notification.title || 'Class Attendance Update';
                  const message = notification.message || notification.description || '';
                  
                  new Notification(title, { body: message });
                }
                
                // Dispatch an event to update the UI
                window.dispatchEvent(new CustomEvent('hodAttendanceAction', {
                  detail: notification
                }));
                
                // Force a refresh of the data
                pollForUpdates();
              }
            });
          }
        }
      } catch (error) {
        console.error('Error checking for HOD actions:', error);
      }
    };
    
    // Initial poll for data
    pollForUpdates();
    
    // Also check for HOD actions initially
    checkForHodActions();
    
    // Set up polling interval
    pollTimer = setInterval(() => {
      pollForUpdates();
      // Also check for HOD actions each poll interval
      checkForHodActions();
    }, pollingInterval);
    
    // Set up event listeners
    window.addEventListener('attendanceMarked', handleAttendanceMarked);
    window.addEventListener('attendanceStatusChanged', handleStatusChanged);
    
    // Clean up function for unmounting
    return () => {
      console.log('Cleaning up attendance status listeners');
      
      // Clear polling interval
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      
      // Remove event listeners
      window.removeEventListener('attendanceMarked', handleAttendanceMarked);
      window.removeEventListener('attendanceStatusChanged', handleStatusChanged);
    };
  }, [onAttendanceMarked, onStatusChanged, pollingInterval, facultyId]);
  
  // Render nothing (this is just an event handler component)
  return null;
}
