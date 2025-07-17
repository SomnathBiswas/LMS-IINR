'use client';

import { useState, useEffect } from 'react';

export default function ActiveFacultyCount() {
  const [activeCount, setActiveCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveCount = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/active-users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch active faculty count');
      }
      
      const data = await response.json();
      setActiveCount(data.count);
      setError(null);
    } catch (err) {
      console.error('Error fetching active faculty count:', err);
      setError('Failed to load active faculty count');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveCount();
    
    // Set up polling to refresh the count every minute
    const intervalId = setInterval(() => {
      fetchActiveCount();
    }, 60000); // 60 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Active Faculty</h3>
      
      {loading ? (
        <div className="flex items-center justify-center h-12">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#59159d]"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : (
        <div className="flex items-center">
          <div className="text-3xl font-bold text-[#59159d]">{activeCount}</div>
          <div className="ml-2 text-sm text-gray-600">currently online</div>
        </div>
      )}
    </div>
  );
}
