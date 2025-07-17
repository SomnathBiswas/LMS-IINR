'use client';

import { useEffect } from 'react';

interface HandoverStatusListenerProps {
  pollingInterval?: number; // in milliseconds
  facultyId?: string;
}

export default function HandoverStatusListener({
  pollingInterval = 7000, // 7 seconds
  facultyId
}: HandoverStatusListenerProps) {
  
  useEffect(() => {
    if (!facultyId) return;

    let pollTimer: NodeJS.Timeout | null = null;

    const pollForHandoverUpdates = async () => {
      try {
        const response = await fetch(`/api/notifications?userId=${facultyId}&type=handover&t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.notifications && data.notifications.length > 0) {
            // Check for unread handover notifications
            const hasUnreadHandover = data.notifications.some((n: any) => !n.read);
            if (hasUnreadHandover) {
              console.log('New handover notification detected, forcing dashboard refresh.');
              window.dispatchEvent(new CustomEvent('forceDashboardRefresh'));
            }
          }
        }
      } catch (error) {
        console.error('Error polling for handover updates:', error);
      }
    };

    // Initial poll
    pollForHandoverUpdates();

    // Set up polling interval
    pollTimer = setInterval(pollForHandoverUpdates, pollingInterval);

    // Clean up
    return () => {
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [facultyId, pollingInterval]);

  return null;
}