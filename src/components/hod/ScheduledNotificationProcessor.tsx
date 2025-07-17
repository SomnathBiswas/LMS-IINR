import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Component that periodically checks for scheduled notifications and processes them
 * This component is invisible and should be included in the HOD dashboard layout
 */
export default function ScheduledNotificationProcessor() {
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  // Process scheduled notifications
  const processScheduledNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/process-scheduled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to process scheduled notifications');
      }
      
      const data = await response.json();
      
      // If notifications were processed, show a toast
      if (data.processed > 0) {
        toast.success(`${data.processed} scheduled notification(s) have been sent`);
        console.log('Processed scheduled notifications:', data);
      } else {
        console.log('No scheduled notifications to process');
      }
      
      // Update last checked time
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  };
  
  useEffect(() => {
    // Process scheduled notifications immediately when component mounts
    processScheduledNotifications();
    
    // Set up interval to check every minute (60000 ms)
    const intervalId = setInterval(() => {
      processScheduledNotifications();
    }, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // This component doesn't render anything visible
  return null;
}
