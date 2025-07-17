'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, FileText, Download, ExternalLink, Filter, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Attachment {
  _id: string;
  filename: string;
  size: number;
  mimetype: string;
  url: string;
}

interface Notification {
  _id: string;
  userId: string;
  title: string;
  description: string;
  type: string;
  relatedId: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  isOfficial: boolean;
  from: {
    hodId: string;
    hodName: string;
    department: string;
  };
  attachments: Attachment[];
}

export default function OfficialNotifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
    }
  }, [user, currentPage, selectedType]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('userId', user?._id || '');
      queryParams.append('page', currentPage.toString());
      
      if (selectedType) {
        queryParams.append('type', selectedType);
      }
      
      const response = await fetch(`/api/faculty/notifications?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setTotalPages(data.pagination?.totalPages || 1);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === id ? { ...notification, read: true } : notification
        )
      );
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedNotification === id) {
      setExpandedNotification(null);
    } else {
      setExpandedNotification(id);
      
      // Mark as read when expanded
      const notification = notifications.find(n => n._id === id);
      if (notification && !notification.read) {
        markAsRead(id);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'meeting':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'exam':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'holiday':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'circular':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      case 'exam':
        return 'bg-red-100 text-red-800';
      case 'holiday':
        return 'bg-green-100 text-green-800';
      case 'circular':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Official Announcements</h2>
      
      {/* Filter by type */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-48">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Types</option>
              <option value="meeting">Meeting</option>
              <option value="exam">Exam</option>
              <option value="holiday">Holiday</option>
              <option value="circular">Circular</option>
              <option value="others">Others</option>
            </select>
          </div>
          
          <button
            onClick={() => {
              setSelectedType('');
              fetchNotifications();
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Notifications List */}
      {loading ? (
        <div className="py-10 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          <p>No official announcements found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification._id} 
              className={`border rounded-lg overflow-hidden ${!notification.read ? 'border-l-4 border-l-purple-500' : 'border-gray-200'}`}
            >
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(notification._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="pt-0.5">
                      {getNotificationTypeIcon(notification.type)}
                    </div>
                    <div>
                      <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center mt-1 text-xs text-gray-500 space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getNotificationTypeColor(notification.type)}`}>
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </span>
                        <span>From: {notification.from?.hodName || 'System'}</span>
                        <span>•</span>
                        <span>{formatDate(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  {notification.attachments?.length > 0 && (
                    <div className="flex items-center text-xs text-gray-500">
                      <FileText className="h-4 w-4 mr-1" />
                      {notification.attachments?.length} attachment{notification.attachments?.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
              
              {expandedNotification === notification._id && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="prose max-w-none text-gray-700">
                    <p className="whitespace-pre-line">{notification.description}</p>
                  </div>
                  
                  {notification.attachments?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h4>
                      <div className="space-y-2">
                        {notification.attachments?.map((attachment) => (
                          <div 
                            key={attachment._id} 
                            className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md"
                          >
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-800">{attachment.filename}</span>
                              <span className="ml-2 text-xs text-gray-500">
                                ({(attachment.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="h-5 w-5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
