'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import OfficialNotifications from '@/components/faculty/OfficialNotifications';
import { Toaster } from 'react-hot-toast';
import { Home, Calendar, RefreshCw, Bell, Clock, LogOut, User } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import DynamicGreeting from '@/components/DynamicGreeting';

export default function OfficialAnnouncementsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    if (!userLoading) {
      if (!user || user.role !== 'Faculty') {
        router.push('/auth/signin');
      }
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    try {
      // Clear the token cookie - multiple approaches for reliability
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
      
      // Log the action for debugging
      console.log('Logging out and redirecting to signin page');
      
      // Use the special logout parameter to bypass the middleware redirect
      window.location.href = '/auth/signin?logout=true';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error during logout. Please try again.');
    }
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#59159d]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside 
        className={`bg-[#59159d] text-white shadow-md fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Nursing Institute</h1>
          </div>
          
          <nav className="flex-1">
            <ul className="space-y-4">
              <li className="hover:bg-white hover:text-[#59159d] rounded-lg p-3 cursor-pointer">
                <a href="/" className="flex items-center justify-between">
                  <span>Dashboard</span>
                  <Home size={24} />
                </a>
              </li>
              <li className="hover:bg-white hover:text-[#59159d] rounded-lg p-3 cursor-pointer">
                <a href="/class-routine" className="flex items-center justify-between">
                  <span>Class Routine</span>
                  <Calendar size={24} />
                </a>
              </li>
              <li className="hover:bg-white hover:text-[#59159d] rounded-lg p-3 cursor-pointer">
                <a href="/request-handover" className="flex items-center justify-between">
                  <span>Request Handover</span>
                  <RefreshCw size={24} />
                </a>
              </li>
              <li className="hover:bg-white hover:text-[#59159d] rounded-lg p-3 cursor-pointer">
                <a href="/attendance-report" className="flex items-center justify-between">
                  <span>Attendance Report</span>
                  <Calendar size={24} />
                </a>
              </li>
              <li className="bg-white text-[#59159d] rounded-lg p-3 cursor-pointer">
                <a href="/faculty-dashboard/official-announcements" className="flex items-center justify-between">
                  <span>Official Notifications</span>
                  <Bell size={24} />
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <div className="fixed bottom-4 left-4 md:hidden z-40">
        <button 
          onClick={toggleSidebar}
          className="bg-[#59159d] text-white p-3 rounded-full shadow-lg focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <main className="p-4 md:p-8 md:ml-64 transition-all duration-300 ease-in-out w-full">
        {/* Toast Container */}
        <Toaster position="top-right" />
        
        {/* Top Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-4 rounded-lg shadow-sm mt-10 md:mt-0">
          <div>
            <DynamicGreeting 
              userName={user?.name} 
              userRole={`${user?.role || 'Faculty'} | ${user?.department || 'Nursing'}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between">
            <div className="text-gray-600">
              <div className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-full p-1">
                  <Avatar>
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-purple-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold border-2 border-purple-200">
                        {user?.name ? user.name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase() : '??'}
                      </div>
                    )}
                  </Avatar>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content sideOffset={5} align="end" className="w-56 bg-white rounded-lg shadow-lg p-2 mt-2 z-50 mr-4 border border-gray-200">
                  <DropdownMenu.Item className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer rounded-md transition-colors" onClick={() => router.push('/account')}>
                    <User className="w-4 h-4 mr-2" />
                    My Account
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                  <div className="px-1 py-1">
                    <button 
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer rounded-md transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Official Announcements</h1>
          <p className="text-gray-600">
            View all official announcements from your department HOD.
          </p>
        </div>
        
        <OfficialNotifications />
      </main>
    </div>
  );
}
