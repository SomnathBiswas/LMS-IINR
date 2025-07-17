'use client';

import { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';

/**
 * Component that tracks user activity and updates the active status
 * This component doesn't render anything visible
 */
export default function ActiveStatusTracker() {
  const { user } = useUser();

  useEffect(() => {
    // Only track activity for Faculty users
    if (!user || user.role !== 'Faculty') return;

    // Update active status immediately when component mounts
    updateActiveStatus();

    // Set up interval to update active status every 5 minutes
    const interval = setInterval(updateActiveStatus, 5 * 60 * 1000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [user]);

  const updateActiveStatus = async () => {
    try {
      await fetch('/api/faculty/active-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error updating active status:', error);
    }
  };

  // This component doesn't render anything
  return null;
}
