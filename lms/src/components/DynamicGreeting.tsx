'use client';

import { useState, useEffect } from 'react';

interface DynamicGreetingProps {
  userName?: string;
  userRole?: string;
  className?: string;
}

export default function DynamicGreeting({ 
  userName = 'User', 
  userRole = '', 
  className = 'text-2xl font-semibold text-gray-900' 
}: DynamicGreetingProps) {
  const [greeting, setGreeting] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Component has mounted
  }, []);
  
  // Update greeting based on time of day
  useEffect(() => {
    if (!mounted) return; // Only run on client after mount

    const updateGreeting = () => {
      const hours = new Date().getHours();
      if (hours < 12) {
        setGreeting('Good Morning');
      } else if (hours < 18) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    };

    updateGreeting(); // Set initial greeting
    
    // Update greeting every minute
    const timer = setInterval(updateGreeting, 60000); // Check every minute
    
    return () => clearInterval(timer);
  }, [mounted]); // Rerun when mounted changes
  
  if (!mounted) {
    // Render nothing or a placeholder on the server and initial client render
    // This ensures server and client match before hydration for this dynamic part
    return (
      <div>
        <h1 className={className}>Welcome, {userName}</h1>
        {userRole && <p className="text-sm text-gray-600">{userRole}</p>}
      </div>
    );
  }

  return (
    <div>
      <h1 className={className}>{greeting || 'Welcome'}, {userName}</h1>
      {userRole && <p className="text-sm text-gray-600">{userRole}</p>}
    </div>
  );
}
