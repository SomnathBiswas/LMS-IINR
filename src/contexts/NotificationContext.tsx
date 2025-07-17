'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define notification types
export type NotificationType = 'handover' | 'approval' | 'rejection' | 'submission' | 'routine' | 'announcement' | 'alert';

// Define notification interface
export interface Notification {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  type: NotificationType;
  isRead: boolean;
  relatedTo?: string;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, '_id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Format date for display
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  // Add a new notification
  const addNotification = (notification: Omit<Notification, '_id' | 'createdAt'>) => {
    const now = new Date();
    const newNotification: Notification = {
      _id: `notification-${now.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: formatDate(now),
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.description,
        icon: '/favicon.ico'
      });
    }
  };

  // Mark a notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification._id === notificationId && !notification.isRead
          ? { ...notification, isRead: true }
          : notification
      )
    );
    
    // Update unread count
    const wasUnread = notifications.find(n => n._id === notificationId && !n.isRead);
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Listen for notification events from server
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    // In a real implementation, you would set up event listeners or WebSocket connections
    // to receive notifications from the server
    
    // No mock notifications - real notifications will come from actual user actions
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
