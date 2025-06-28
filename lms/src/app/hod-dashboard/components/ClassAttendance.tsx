'use client';

import { useState, useEffect } from 'react';

interface ClassSession {
  id: string;
  subject: string;
  facultyName: string;
  timeSlot: string;
  course: string;
  roomNo: string;
}

export default function ClassAttendance() {
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>(['All Subjects']);
  const [teachers, setTeachers] = useState<string[]>(['All Teachers']);
  const [selectedSubject, setSelectedSubject] = useState<string>('All Subjects');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('All Teachers');

  // Fetch class data from API
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        // Get current date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Log the request for debugging
        console.log(`Fetching class data for date: ${today}`);
        
        const response = await fetch(`/api/hod/class-attendance-tracking?date=${today}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.classes && Array.isArray(data.classes) && data.classes.length > 0) {
          setClassSessions(data.classes);
          
          // Extract unique subjects and teachers for filters
          const uniqueSubjects = new Set<string>();
          const uniqueTeachers = new Set<string>();
          
          data.classes.forEach((cls: any) => {
            if (cls.subject && typeof cls.subject === 'string') uniqueSubjects.add(cls.subject);
            if (cls.facultyName && typeof cls.facultyName === 'string') uniqueTeachers.add(cls.facultyName);
          });
          
          setSubjects(['All Subjects', ...Array.from(uniqueSubjects)]);
          setTeachers(['All Teachers', ...Array.from(uniqueTeachers)]);
          setError(null);
        } else {
          console.log('No classes found in API response');
          setClassSessions([]);
          setError('No classes found for today');
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Failed to fetch class data');
        setClassSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchClasses, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getTeacherInitial = (name: string) => {
    return name ? name.charAt(0) : '?';
  };

  // Filter classes based on selected subject and teacher
  const filteredClasses = classSessions.filter(session => {
    const matchesSubject = selectedSubject === 'All Subjects' || session.subject === selectedSubject;
    const matchesTeacher = selectedTeacher === 'All Teachers' || session.facultyName === selectedTeacher;
    return matchesSubject && matchesTeacher;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Today's Class Attendance</h2>
        <div className="flex space-x-2">
          <select 
            className="text-sm border border-gray-300 rounded px-2 py-1"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          <select 
            className="text-sm border border-gray-300 rounded px-2 py-1"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
          >
            {teachers.map(teacher => (
              <option key={teacher} value={teacher}>{teacher}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#59159d]"></div>
          <span className="ml-2">Loading classes...</span>
        </div>
      ) : error ? (
        <div className="text-center p-8 text-gray-500">{error}</div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-700 font-medium mb-2">No classes found for today</p>
          <p className="text-gray-500 text-sm">Please ensure class routines have been set up for faculty members.</p>
          <p className="text-gray-500 text-sm mt-4">To set up class routines, go to the Faculty Management section and assign classes to faculty members.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClasses.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">
                    {session.subject}
                    {session.course && <span className="text-xs text-gray-500 ml-1">({session.course})</span>}
                    {session.roomNo && <span className="text-xs text-gray-500 ml-1">Room: {session.roomNo}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                        {getTeacherInitial(session.facultyName)}
                      </div>
                      <span className="text-gray-800">{session.facultyName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{session.timeSlot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
