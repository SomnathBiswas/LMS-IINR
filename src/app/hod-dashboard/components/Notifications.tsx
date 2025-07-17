'use client';

import { useNotifications } from '@/contexts/NotificationContext';
import Link from 'next/link';

export default function Notifications() {
  // Use the shared notification context
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll 
  } = useNotifications();
  
  // Loading state is determined by notifications being available
  const loading = false; // We don't need loading state with the context
  const error = null; // We don't need error state with the context

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'handover':
        return (
          <div className="p-2 rounded-full bg-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      case 'approval':
        return (
          <div className="p-2 rounded-full bg-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'rejection':
        return (
          <div className="p-2 rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'submission':
        return (
          <div className="p-2 rounded-full bg-yellow-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'routine':
        return (
          <div className="p-2 rounded-full bg-purple-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'announcement':
        return (
          <div className="p-2 rounded-full bg-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <div className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} New
            </div>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={() => clearAll()}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#59159d]"></div>
        </div>
      ) : error ? (
        <div className="py-4 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">No notifications at this time</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
          {notifications.map((notification) => (
            <div 
              key={notification._id} 
              className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${!notification.isRead ? 'bg-blue-50' : ''}`}
              onClick={() => markAsRead(notification._id)}
            >
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-blue-800' : 'text-gray-800'}`}>
                  {notification.title}
                </h3>
                <p className="text-xs text-gray-500">{notification.description}</p>
                <p className="text-xs text-gray-400 mt-1">{notification.createdAt}</p>
              </div>
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-blue-500 mt-1"></span>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 flex justify-between">
        <Link href="/hod-dashboard/notifications" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View All Notifications
        </Link>
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllAsRead()}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark All Read
          </button>
        )}
      </div>
    </div>
  );
}
