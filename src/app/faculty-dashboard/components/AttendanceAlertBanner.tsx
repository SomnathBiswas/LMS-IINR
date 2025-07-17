'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X, Clock } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';

interface FacultyClass {
  id: string;
  subject: string;
  timeSlot: string;
  status: 'pending' | 'window-open' | 'taken' | 'missed';
}

export default function AttendanceAlertBanner() {
  const { user } = useUser();
  const [classes, setClasses] = useState<FacultyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const fetchAlertData = async () => {
      try {
        if (!user || !user._id) {
          console.log('No user information available');
          setLoading(false);
          return;
        }

        setLoading(true);
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Using multiple identifiers to ensure we find the faculty
        const facultyIdentifier = user._id || user.email || user.facultyId;
        
        // Fetch data from API
        const response = await fetch(`/api/faculty/class-attendance-tracking?facultyId=${encodeURIComponent(facultyIdentifier)}&date=${today}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch class data');
        }
        
        const data = await response.json();
        
        // Filter classes with window-open or missed status
        const alertClasses = data.classes.filter(
          (cls: FacultyClass) => cls.status === 'window-open' || cls.status === 'missed'
        );
        
        setClasses(alertClasses);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching alert data:', error);
        setLoading(false);
      }
    };

    fetchAlertData();
    
    // Refresh data every 5 minutes
    const refreshInterval = setInterval(fetchAlertData, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [user]);
  
  // Hide banner if no alerts or user dismissed it
  if (loading || classes.length === 0 || !isVisible) {
    return null;
  }
  
  // Count classes by status
  const windowOpenCount = classes.filter(cls => cls.status === 'window-open').length;
  const missedCount = classes.filter(cls => cls.status === 'missed').length;
  
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">
              Attendance Alert
            </h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>
                {windowOpenCount > 0 && (
                  <span className="block mb-1">
                    <Clock className="inline-block w-4 h-4 mr-1 text-blue-600" />
                    <strong>{windowOpenCount}</strong> {windowOpenCount === 1 ? 'class has' : 'classes have'} open attendance windows.
                  </span>
                )}
                {missedCount > 0 && (
                  <span className="block">
                    <X className="inline-block w-4 h-4 mr-1 text-red-600" />
                    <strong>{missedCount}</strong> {missedCount === 1 ? 'class has' : 'classes have'} missed attendance.
                  </span>
                )}
              </p>

            </div>
          </div>
        </div>
        <button
          type="button"
          className="ml-auto -mx-1.5 -my-1.5 bg-amber-50 text-amber-500 rounded-lg focus:ring-2 focus:ring-amber-400 p-1.5 hover:bg-amber-100 inline-flex items-center justify-center h-8 w-8"
          onClick={() => setIsVisible(false)}
          aria-label="Dismiss"
        >
          <span className="sr-only">Dismiss</span>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
