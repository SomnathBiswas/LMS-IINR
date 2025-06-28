'use client';

import { useState, useEffect } from 'react';

interface Teacher {
  _id: string;
  name: string;
  role: string;
  facultyId?: string;
  assigned: number;
  taken: number;
  handovers: number;
  attendance: number;
  status: 'Present' | 'Absent' | 'Handover';
}

export default function WeeklyAttendance() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('This Week');
  
  const fetchStaffData = async () => {
    try {
      setLoading(true);
      
      // Use demo data directly since the API endpoints don't exist yet
      // In a real implementation, you would use these API endpoints:
      // const facultyResponse = await fetch('/api/faculty/all');
      // if (!facultyResponse.ok) throw new Error('Failed to fetch faculty data');
      // const facultyData = await facultyResponse.json();
      // const facultyMembers = facultyData.facultyMembers || [];
      
      // const attendanceResponse = await fetch('/api/attendance/faculty-summary');
      // if (!attendanceResponse.ok) throw new Error('Failed to fetch attendance data');
      // const attendanceData = await attendanceResponse.json();
      // const attendanceSummary = attendanceData.summary || {};
      
      // Using demo data instead
      const demoFaculty = [
        {
          _id: '1',
          name: 'Somnath Biswas',
          role: 'Faculty',
          facultyId: 'F001'
        },
        {
          _id: '2',
          name: 'Ipad',
          role: 'Faculty',
          facultyId: 'F002'
        },
        {
          _id: '3',
          name: 'Galaxy',
          role: 'Faculty',
          facultyId: 'F003'
        },
        {
          _id: '4',
          name: 'Akash',
          role: 'Faculty',
          facultyId: 'F004'
        }
      ];
      
      // Create demo attendance data
      const enrichedTeachers = demoFaculty.map((faculty: any, index: number) => {
        // Create different attendance patterns for each faculty
        let assigned = 10;
        let taken, handovers;
        
        switch(index) {
          case 0: // Somnath Biswas
            taken = 6;
            handovers = 1;
            break;
          case 1: // Ipad
            taken = 14;
            handovers = 2;
            break;
          case 2: // Galaxy
            taken = 14;
            handovers = 1;
            break;
          case 3: // Akash
            taken = 9;
            handovers = 0;
            break;
          default:
            taken = Math.floor(Math.random() * 14) + 6; // Random between 6-20
            handovers = Math.floor(Math.random() * 3); // Random between 0-2
        }
        
        // Calculate attendance percentage (capped at 100%)
        let attendancePercentage = 0;
        if (assigned > 0) {
          attendancePercentage = Math.min(100, Math.round((taken / assigned) * 100));
        }
        
        // Determine status based on attendance
        let status: 'Present' | 'Absent' | 'Handover' = 'Present';
        if (attendancePercentage < 60) status = 'Absent';
        else if (handovers > 0) status = 'Handover';
        
        return {
          _id: faculty._id,
          name: faculty.name,
          role: faculty.role || 'Faculty',
          facultyId: faculty.facultyId,
          assigned: assigned,
          taken: taken,
          handovers: handovers,
          attendance: attendancePercentage,
          status: status
        };
      });
      
      setTeachers(enrichedTeachers);
      setError(null);
    } catch (err) {
      console.error('Error setting up staff data:', err);
      setError('Failed to load staff data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStaffData();
  }, [timeframe]); // Refetch when timeframe changes

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Handover':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Staff Weekly Attendance</h2>
        <div className="flex space-x-2">
          <select 
            className="text-sm border border-gray-300 rounded px-2 py-1"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option>This Week</option>
            <option>Last Week</option>
            <option>Two Weeks Ago</option>
          </select>
          <button className="text-sm bg-white border border-gray-300 rounded px-3 py-1 flex items-center space-x-1 text-blue-600">
            <span>Export</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#59159d]"></div>
        </div>
      ) : error ? (
        <div className="py-10 text-center">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => fetchStaffData()}
            className="mt-4 px-4 py-2 bg-[#59159d] text-white rounded hover:bg-[#4a1184]"
          >
            Retry
          </button>
        </div>
      ) : teachers.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          <p>No staff data available for this timeframe.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Taken</th>
                <th className="px-4 py-3">Handovers</th>
                <th className="px-4 py-3">% Attendance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr key={teacher._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium" style={{ borderRadius: '50%' }}>
                        {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'F'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{teacher.name}</p>
                        <p className="text-xs text-gray-500">Faculty</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{teacher.assigned}</td>
                  <td className="px-4 py-3 text-gray-800">{teacher.taken}</td>
                  <td className="px-4 py-3 text-gray-800">{teacher.handovers}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getAttendanceBarColor(teacher.attendance)}`} 
                          style={{ width: `${Math.min(100, teacher.attendance)}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-800">{Math.min(100, teacher.attendance)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(teacher.status)}`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
