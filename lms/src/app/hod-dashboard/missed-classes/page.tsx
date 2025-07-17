'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MissedClass {
  _id: string;
  class: string;
  teacher: string;
  time: string;
  reason: string;
  date: string;
  routineId: string;
}

export default function AllMissedClassesPage() {
  const [missedClasses, setMissedClasses] = useState<MissedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllMissedClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance/missed?all=true');
      if (!response.ok) {
        throw new Error('Failed to fetch all missed classes');
      }
      const data = await response.json();
      const mappedClasses = data.map((c: any) => ({
        _id: c.id,
        class: c.subject,
        teacher: c.facultyName,
        time: c.time,
        reason: 'Not Marked',
        date: new Date(c.date).toLocaleDateString(),
        routineId: c.parentRoutineId,
      }));
      setMissedClasses(mappedClasses || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching all missed classes:', err);
      setError('Failed to load all missed classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMissedClasses();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">All Missed Classes</h1>
        <Link href="/hod-dashboard" className="text-blue-500 hover:underline">
          Back to Dashboard
        </Link>
      </div>
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-red-500">{error}</td>
                </tr>
              ) : missedClasses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">No missed classes found.</td>
                </tr>
              ) : (
                missedClasses.map((missedClass) => (
                  <tr key={missedClass._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{missedClass.date}</td>
                    <td className="px-4 py-3 text-gray-800">{missedClass.class}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {missedClass.teacher.charAt(0)}
                        </div>
                        <span className="text-gray-800">{missedClass.teacher}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">{missedClass.time}</td>
                    <td className="px-4 py-3">
                      <span className="text-red-600">{missedClass.reason}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}