'use client';

import { useState, useEffect } from 'react';

export default function StatsCards() {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    activeTeachers: 0,
    pendingHandovers: 0,
    approvedHandovers: 0
  });

  // Fetch data for the dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch active faculty users
        const activeResponse = await fetch('/api/faculty/active-users');
        if (activeResponse.ok) {
          const activeData = await activeResponse.json();
          setStats(prev => ({
            ...prev,
            activeTeachers: activeData.activeUsers
          }));
        }
        
        // Fetch total number of teachers
        const totalResponse = await fetch('/api/faculty/total');
        if (totalResponse.ok) {
          const totalData = await totalResponse.json();
          setStats(prev => ({
            ...prev,
            totalTeachers: totalData.totalTeachers
          }));
        }

        // Fetch pending handovers
        const pendingResponse = await fetch('/api/handovers?status=Pending');
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          setStats(prev => ({
            ...prev,
            pendingHandovers: pendingData.handovers?.length || 0
          }));
        }

        // Fetch approved handovers
        const approvedResponse = await fetch('/api/handovers?status=Approved');
        if (approvedResponse.ok) {
          const approvedData = await approvedResponse.json();
          setStats(prev => ({
            ...prev,
            approvedHandovers: approvedData.handovers?.length || 0
          }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Teachers */}
      <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
        <div className="p-3 rounded-full bg-blue-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Total Teachers</p>
          <p className="text-2xl font-bold text-gray-800">{stats.totalTeachers}</p>
        </div>
      </div>
      
      {/* Active Teachers */}
      <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
        <div className="p-3 rounded-full bg-purple-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Active Faculty</p>
          <p className="text-2xl font-bold text-gray-800">{stats.activeTeachers}</p>
        </div>
      </div>

      {/* Today's Absentees card removed as requested */}

      {/* Pending Handovers */}
      <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
        <div className="p-3 rounded-full bg-yellow-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Pending Handovers</p>
          <p className="text-2xl font-bold text-gray-800">{stats.pendingHandovers}</p>
        </div>
      </div>

      {/* Approved Handovers */}
      <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
        <div className="p-3 rounded-full bg-green-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Approved Handovers</p>
          <p className="text-2xl font-bold text-gray-800">{stats.approvedHandovers}</p>
        </div>
      </div>
    </div>
  );
}
