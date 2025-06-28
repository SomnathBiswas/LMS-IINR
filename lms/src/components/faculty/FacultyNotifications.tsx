'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Bell, MoreVertical, Check, X } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import toast, { Toaster } from 'react-hot-toast';

interface Notification {
  _id: string;
  title: string;
  description: string;
  message?: string; // Added for compatibility with API response
  type: string;
  read: boolean;
  status?: string; // Added for attendance status tracking
  createdAt: string;
  updatedAt: string;
}

export default function FacultyNotifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Store previous notifications to detect new ones
  const prevNotificationsRef = useRef<Notification[]>([]);
  const initialFetchDoneRef = useRef(false);

  // Function to show notification toast
  const showNotificationToast = (notification: Notification) => {
    toast.custom(
      (t) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                {getNotificationIcon(notification.type, notification)}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                <p className="mt-1 text-sm text-gray-500">{notification.description}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                markAsRead(notification._id);
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      ),
      { duration: 5000, id: notification._id }
    );
  };

  // Fetch notifications for the current user - memoized to prevent recreating on each render
  const fetchNotifications = useCallback(async (showLoadingState = false) => {
    if (!user || !user._id) return;
    
    try {
      if (showLoadingState) setLoading(true);
      
      // Add cache-busting parameter to prevent browser caching
      const timestamp = new Date().getTime();
      // Ensure the path is /api/notifications and uses userId
      // Fetch all relevant notification types (e.g., attendance, handover, routine updates)
      // The backend /api/notifications GET handler should support fetching without a specific type, or fetching multiple types
      const response = await fetch(`/api/notifications?userId=${user._id}&t=${timestamp}`); // Removed specific type=attendance filter
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      const newNotifications = data.notifications || [];
      
      // Check for new notifications by comparing with previous state
      if (initialFetchDoneRef.current && prevNotificationsRef.current.length > 0) {
        const oldIds = new Set(prevNotificationsRef.current.map((n: Notification) => n._id));
        const newItems = newNotifications.filter((n: Notification) => !oldIds.has(n._id) && !n.read);
        
        // Show toast notifications for new items
        if (newItems.length > 0) {
          // Show at most 2 notifications at once to avoid overwhelming the user
          newItems.slice(0, 2).forEach((notification: Notification) => {
            showNotificationToast(notification);
          });
        }
      }
      
      // Update state with new notifications - use functional updates to avoid race conditions
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter((n: Notification) => !n.read).length || 0);
      prevNotificationsRef.current = newNotifications;
      initialFetchDoneRef.current = true;
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  }, [user]);
  
  // Setup polling and event listeners
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout | null = null;

    const poll = async () => {
      await fetchNotifications(false);
      // Schedule the next poll
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(poll, 10 * 1000); // Poll every 10 seconds
    };

    // Initial fetch
    fetchNotifications(true);
    // Start polling
    timeoutId = setTimeout(poll, 10 * 1000);

    // Event listener for attendance-related events
    const handleAttendanceEvent = () => {
      // Fetch immediately on event, then restart the poll timer
      if (timeoutId) clearTimeout(timeoutId);
      fetchNotifications(false).finally(() => {
        timeoutId = setTimeout(poll, 10 * 1000);
      });
    };
    
    window.addEventListener('attendanceMarked', handleAttendanceEvent);
    window.addEventListener('attendanceStatusChanged', handleAttendanceEvent);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('attendanceMarked', handleAttendanceEvent);
      window.removeEventListener('attendanceStatusChanged', handleAttendanceEvent);
    };
  }, [user, fetchNotifications]);

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Optimistically update UI first for better responsiveness
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Then send request to server
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
        // If there's an error, we could revert the optimistic update here
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // On error, refresh notifications to ensure UI is in sync with server
      fetchNotifications(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user || !user._id || notifications.length === 0) return;
    
    try {
      // Optimistically update UI first
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Close dropdown for better UX
      setShowDropdown(false);
      
      // Then send request to server
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user._id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      // On success, also fetch notifications to ensure UI is in sync
      fetchNotifications(false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // On error, refresh notifications to ensure UI is in sync with server
      fetchNotifications(false);
    }
  };

  // Get notification icon based on type and status
  const getNotificationIcon = (type: string, notification: Notification) => {
    // Check if this is an attendance notification
    if (type === 'attendance') {
      // Check the status field to determine the icon and color
      const status = notification.status?.toLowerCase() || '';
      
      if (status === 'taken') {
        return (
          <div className="p-2 rounded-full bg-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      } else if (status === 'missed') {
        return (
          <div className="p-2 rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      } else {
        return (
          <div className="p-2 rounded-full bg-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      }
    }
    
    // Handle other notification types
    switch (type) {
      case 'routine':
        return (
          <div className="p-2 rounded-full bg-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'handover':
        return (
          <div className="p-2 rounded-full bg-yellow-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="relative">
      {/* Toast Container for Notifications */}
      <Toaster position="top-right" toastOptions={{ 
        className: 'react-hot-toast',
        // Prevent too many toasts from appearing at once
        duration: 4000,
        // Add some styles to make toasts more stable
        style: {
          maxWidth: '350px',
          padding: '8px',
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)'
        }
      }} />
      {/* Notification Bell Icon */}
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-full"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showDropdown && (
        <>
          {/* Invisible overlay to capture clicks outside the dropdown - works on all screen sizes */}
          <div 
            className="fixed inset-0 bg-transparent z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden border border-gray-200 max-w-sm" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No new notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    // Use a stable key that includes both ID and read status
                    const stableKey = `${notification._id}-${notification.read ? 'read' : 'unread'}`;
                    return (
                      <div key={stableKey} className={`flex items-start p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
                        <div className="flex-shrink-0 mr-2">
                          {getNotificationIcon(notification.type, notification)}
                        </div>
                        <div className="flex-1 min-w-0"> {/* min-width prevents text overflow */}
                          <div className="flex justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate max-w-[70%]">{notification.title}</h4>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-1">{formatDate(notification.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 break-words">{notification.description}</p>
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent dropdown from closing
                                markAsRead(notification._id);
                              }}
                              className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-3 bg-gray-50 border-t text-center">
              <button 
                onClick={() => setShowDropdown(false)}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 inline-block mr-1" />
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
