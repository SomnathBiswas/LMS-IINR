'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FacultyRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    console.log('FACULTY REDIRECT PAGE - EMERGENCY REDIRECT TO DASHBOARD');
    
    // Set a flag in sessionStorage to indicate we're in the process of redirecting
    sessionStorage.setItem('redirectingToFaculty', 'true');
    sessionStorage.setItem('emergencyRedirect', 'true');
    
    // DIRECT APPROACH: Immediately try to go to the dashboard
    window.location.href = '/';
    
    // Create and submit a form to force navigation
    const createAndSubmitForm = () => {
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = '/';
      document.body.appendChild(form);
      console.log('Submitting form to redirect');
      form.submit();
    };
    
    // Try form submission immediately
    createAndSubmitForm();
    
    // Set up multiple backup approaches with very short intervals
    setTimeout(() => {
      console.log('Backup redirect 1');
      window.location.replace('/');
    }, 100);
    
    setTimeout(() => {
      console.log('Backup redirect 2');
      window.location.href = '/?t=' + Date.now();
    }, 200);
    
    setTimeout(() => {
      console.log('Backup redirect 3');
      createAndSubmitForm();
    }, 300);
    
    setTimeout(() => {
      console.log('Backup redirect 4');
      document.location.href = '/';
    }, 400);
    
    // Final emergency approach
    setTimeout(() => {
      console.log('EMERGENCY REDIRECT');
      try {
        // Try to use the history API
        window.history.pushState({}, '', '/');
        window.history.go(0);
      } catch (e) {
        console.error('History API failed:', e);
      }
      // Force reload as absolute last resort
      window.location.href = '/?emergency=true&t=' + Date.now();
    }, 500);
  }, [router]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-purple-800 mb-4">Redirecting to Faculty Dashboard</h1>
        <p className="text-gray-600 mb-6">Please wait, you are being redirected to the faculty dashboard...</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-800"></div>
        </div>
        <div className="mt-6">
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Click here if not redirected automatically
          </button>
        </div>
      </div>
    </div>
  );
}
