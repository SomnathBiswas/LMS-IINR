'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, Download, Edit, RefreshCw, Search, Filter, FileText, Users, Send } from 'lucide-react';
import DatePicker from 'react-datepicker';
import type { DatePickerProps } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface NotificationLog {
  _id: string;
  title: string;
  type: string;
  description: string;
  hodId: string;
  hodName: string;
  department: string;
  recipients: {
    all: boolean;
    faculty: Array<{
      _id: string;
      name: string;
      facultyId: string;
    }>;
  };
  attachments: Array<{
    filename: string;
    url: string;
    size: number;
    contentType: string;
  }>;
  status: 'Sent' | 'Scheduled' | 'Draft';
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationLog() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    searchQuery: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNotificationLogs();
  }, [currentPage, filters]);

  const fetchNotificationLogs = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
      if (filters.searchQuery) queryParams.append('search', filters.searchQuery);
      
      const response = await fetch(`/api/notifications/logs?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notification logs');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setTotalPages(data.totalPages || 1);
      
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      toast.error('Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name: string, value: string | Date | null) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const resetFilters = () => {
    setFilters({
      type: '',
      status: '',
      startDate: null,
      endDate: null,
      searchQuery: '',
    });
    setCurrentPage(1);
  };

  const handleResendNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/resend/${notificationId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to resend notification');
      }
      
      toast.success('Notification resent successfully');
      fetchNotificationLogs(); // Refresh the list
      
    } catch (error) {
      console.error('Error resending notification:', error);
      toast.error('Failed to resend notification');
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Sent':
        return 'bg-green-100 text-green-800';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'Meeting':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'Exam':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'Holiday':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'Circular':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Official Notifications Log</h2>
      
      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title or content..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Type Filter */}
          <div className="w-full md:w-48">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Types</option>
              <option value="Meeting">Meeting</option>
              <option value="Exam">Exam</option>
              <option value="Holiday">Holiday</option>
              <option value="Circular">Circular</option>
              <option value="Others">Others</option>
            </select>
          </div>
          
          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Status</option>
              <option value="Sent">Sent</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Date Range */}
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <DatePicker
                selected={filters.startDate}
                onChange={(date: Date | null) => handleFilterChange('startDate', date)}
                selectsStart
                startDate={filters.startDate}
                endDate={filters.endDate}
                dateFormat="MMM d, yyyy"
                placeholderText="Start date"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <DatePicker
                selected={filters.endDate}
                onChange={(date: Date | null) => handleFilterChange('endDate', date)}
                selectsEnd
                startDate={filters.startDate}
                endDate={filters.endDate}
                minDate={filters.startDate || undefined}
                dateFormat="MMM d, yyyy"
                placeholderText="End date"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          {/* Filter Actions */}
          <div className="flex gap-2">
            <button
              onClick={fetchNotificationLogs}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <Filter className="h-5 w-5" />
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* Notifications Table */}
      {loading ? (
        <div className="py-10 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          <p>No notifications found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <tr key={notification._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getNotificationTypeIcon(notification.type)}
                        <span className="ml-2 text-sm text-gray-900">{notification.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {notification.description.length > 60 
                          ? `${notification.description.substring(0, 60)}...` 
                          : notification.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {notification.recipients.all 
                          ? 'All Faculty' 
                          : `${notification.recipients.faculty.length} Selected`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {notification.status === 'Scheduled' && notification.scheduledFor 
                          ? formatDate(notification.scheduledFor)
                          : formatDate(notification.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(notification.status)}`}>
                        {notification.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {notification.status === 'Scheduled' && (
                          <button
                            onClick={() => {/* Handle edit */}}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit scheduled notification"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleResendNotification(notification._id)}
                          className="text-green-600 hover:text-green-900"
                          title="Resend notification"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                        {notification.attachments.length > 0 && (
                          <button
                            onClick={() => {/* Handle download */}}
                            className="text-blue-600 hover:text-blue-900"
                            title="Download attachments"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
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
        </>
      )}
    </div>
  );
}
