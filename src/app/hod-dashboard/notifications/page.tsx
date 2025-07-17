'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Toaster } from 'react-hot-toast';
import SendNotification from '@/components/hod/SendNotification';
import NotificationLog from '@/components/hod/NotificationLog';

interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

export default function NotificationsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'send' | 'log'>('send');

  useEffect(() => {
    if (!userLoading) {
      if (!user || user.role !== 'HOD') {
        router.push('/auth/signin');
      }
    }
  }, [userLoading, user, router]);



  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#59159d]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Toast Container */}
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Notifications</h1>
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('send')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'send' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Send Notifications
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'log' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Notification Logs
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'send' ? (
        <SendNotification />
      ) : (
        <NotificationLog />
      )}
    </div>
  );
}
