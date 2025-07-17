'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
// Dashboard components
import StatsCards from './components/StatsCards';
import WeeklyAttendance from './components/WeeklyAttendance';
import ClassAttendance from './components/ClassAttendance';
import MissedClasses from './components/MissedClasses';
import Notifications from './components/Notifications';
import AttendanceTrends from './components/AttendanceTrends';
import AttendanceAlertBanner from './components/AttendanceAlertBanner';

export default function HodDashboardPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [redirecting, setRedirecting] = useState(false);

  // Use useEffect for redirection to avoid React errors
  useEffect(() => {
    if (!loading && (!user || user.role !== 'HOD')) {
      setRedirecting(true);
      router.push('/auth/signin');
    }
  }, [loading, user, router]);

  if (loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#59159d]"></div>
      </div>
    );
  }

  // Extra safety check - don't render dashboard if user is not HOD
  if (!user || user.role !== 'HOD') {
    return null;
  }

  return (
    <div className="p-6">
          {/* Attendance Alert Banner */}
          <AttendanceAlertBanner />
          
          {/* Stats Cards */}
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Weekly Attendance Table - Takes up 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <WeeklyAttendance />
            </div>
            
            {/* Notifications - Takes up 1 column */}
            <div className="bg-white rounded-lg shadow p-6">
              <Notifications />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Today's Class Attendance - Removed */}
            
            {/* Attendance Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <AttendanceTrends />
            </div>
          </div>
          
          {/* Missed Classes */}
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <MissedClasses />
          </div>
    </div>
  );
}
