'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
}

const NavItem = ({ icon, label, href, active }: NavItemProps) => (
  <Link 
    href={href}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
  >
    <div className={`${active ? 'text-blue-600' : 'text-gray-500'}`}>{icon}</div>
    <span className="font-medium">{label}</span>
  </Link>
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      // Make a request to clear the token cookie
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Redirect to sign-in page
        window.location.href = '/auth/signin';
      } else {
        console.error('Logout failed');
        // Fallback: try to redirect anyway
        window.location.href = '/auth/signin';
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: try to redirect anyway
      window.location.href = '/auth/signin';
    }
  };
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <Link href="/hod-dashboard" className="block p-6 border-b border-gray-200">
        <Image
          src="/iinr-logo.jpg"
          alt="LMS IINR Logo"
          width={200}
          height={60}
          style={{ objectFit: 'contain' }}
        />
      </Link>
      
      {/* Navigation */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        
        <NavItem 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          } 
          label="Dashboard" 
          href="/hod-dashboard/" 
          active={pathname === '/hod-dashboard/'} 
        />
        
        <NavItem 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          } 
          label="Staff Overview" 
          href="/hod-dashboard/staff" 
          active={pathname === '/hod-dashboard/staff'} 
        />
        
        <NavItem 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          } 
          label="Attendance Records" 
          href="/hod-dashboard/records" 
          active={pathname === '/hod-dashboard/records'} 
        />
        
        <NavItem 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } 
          label="Class Taking Attendance" 
          href="/hod-dashboard/class-attendance-tracking" 
          active={pathname === '/hod-dashboard/class-attendance-tracking'} 
        />

        <NavItem
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Absents List"
          href="/hod-dashboard/absents-list"
          active={pathname === '/hod-dashboard/absents-list'}
        />
        
        <NavItem
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
          label="Handover Requests"
          href="/hod-dashboard/handover-requests"
          active={pathname === '/hod-dashboard/handover-requests'}
        />
        
        <NavItem 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          } 
          label="Analytics" 
          href="/hod-dashboard/analytics" 
          active={pathname === '/hod-dashboard/analytics'} 
        />
        
        <NavItem 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          } 
          label="Manage Notifications" 
          href="/hod-dashboard/notifications" 
          active={pathname === '/hod-dashboard/notifications'} 
        />
      </div>
      
      {/* Sign Out Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
        >
          <div className="text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
