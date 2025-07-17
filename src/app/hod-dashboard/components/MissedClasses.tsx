 'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MissedClass {
  _id: string;
  class: string;
  teacher: string;
  time: string;
  reason: string;
  routineId: string;
}

export default function MissedClasses() {
  const [missedClasses, setMissedClasses] = useState<MissedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMissedClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hod/class-attendance-tracking');
      if (!response.ok) {
        throw new Error('Failed to fetch class attendance data');
      }
      const data = await response.json();
      const missed = data.classes.filter((c: any) => c.status === 'missed').map((c: any) => ({
        _id: c.id,
        class: c.subject,
        teacher: c.facultyName,
        time: c.time,
        reason: 'Not Marked',
        routineId: c.parentRoutineId,
      }));
      setMissedClasses(missed || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching missed classes:', err);
      setError('Failed to load missed classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissedClasses();
  }, []);

  const handleUpdateAttendance = async (routineId: string, classId: string, status: 'taken' | 'absent') => {
    try {
      const response = await fetch('/api/hod/class-attendance-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routineId,
          entryId: classId,
          status,
          markedBy: 'hod',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark class as ${status}`);
      }

      // Refresh the list after updating
      fetchMissedClasses();
    } catch (err) {
      console.error(`Error marking class as ${status}:`, err);
      alert(`Failed to mark class as ${status}. Please try again.`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Missed Classes</h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-red-600 font-medium">Manual Action</span>
          <select className="text-sm border border-gray-300 rounded px-2 py-1">
            <option>All Teachers</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Action</th>
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
              missedClasses.slice(0, 5).map((missedClass) => (
                <tr key={missedClass._id} className="hover:bg-gray-50">
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
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateAttendance(missedClass.routineId, missedClass._id, 'taken')}
                        className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                      >
                        Mark Present
                      </button>
                      <button
                        onClick={() => handleUpdateAttendance(missedClass.routineId, missedClass._id, 'absent')}
                        className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                      >
                        Mark Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-center">
        <Link href="/hod-dashboard/missed-classes" className="text-blue-500 hover:underline">
          Show More
        </Link>
      </div>
    </div>
  );
}
