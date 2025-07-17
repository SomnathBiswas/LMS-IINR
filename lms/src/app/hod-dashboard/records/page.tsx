'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Filter, Check, Clock, AlertCircle, RefreshCw, Download, Search, Calendar as CalendarIcon } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

interface AttendanceRecord {
  _id: string;
  facultyId: string;
  facultyName: string;
  facultyDepartment: string;
  subject: string;
  course: string;
  roomNo: string;
  timeSlot: string;
  status: string;
  date: string;
  remarks: string;
}

interface AttendanceStats {
  totalClasses: number;
  classesTaken: number;
  classesMissed: number;
  classesHandover: number;
  attendancePercentage: number;
}

interface Faculty {
  id: string;
  name: string;
  department: string;
  courses?: string[];
}

export default function AttendanceRecordsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Attendance data
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalClasses: 0,
    classesTaken: 0,
    classesMissed: 0,
    classesHandover: 0,
    attendancePercentage: 0
  });
  
  // Filter options
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [courseList, setCourseList] = useState<string[]>([]);
  
  // Filter states
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Initialize with default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    
    // Initialize stats with zeros by default
    setStats({
      totalClasses: 0,
      classesTaken: 0,
      classesMissed: 0,
      classesHandover: 0,
      attendancePercentage: 0
    });
  }, []);
  
  // Function to fetch attendance data
  const fetchAttendanceData = async (shouldFetch = false) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedFaculty) {
        params.append('facultyId', selectedFaculty);
        console.log('Fetching data for faculty ID:', selectedFaculty);
      }
      if (selectedCourse) params.append('course', selectedCourse);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      // Check if any filter is applied
      const isFiltered = !!(selectedFaculty || selectedCourse || startDate || endDate);
      
      // Only fetch data if filters are applied or if explicitly requested
      if (isFiltered || shouldFetch) {
        const apiUrl = `/api/attendance/all?${params.toString()}`;
        console.log('Fetching data from:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch attendance data');
        }
        
        const data = await response.json();
        console.log('API response:', data);
        
        if (data.success) {
          // Only set attendance records if filters are applied
          setAttendanceRecords(isFiltered ? (data.attendanceRecords || []) : []);
          setStats(data.stats || {
            totalClasses: 0,
            classesTaken: 0,
            classesMissed: 0,
            classesHandover: 0,
            attendancePercentage: 0
          });
          
          // Set filter options but preserve the selected faculty
          if (data.filters) {
            setCourseList(data.filters.courses || []);
            
            // Only update faculty list if it's empty or doesn't contain the selected faculty
            if (!facultyList.length || 
                (selectedFaculty && !facultyList.some(f => f.id === selectedFaculty))) {
              setFacultyList(data.filters.faculty || []);
            }
          }
          
          setError(null);
        } else {
          throw new Error(data.error || 'Failed to fetch attendance data');
        }
      } else {
        // If no filters are applied, clear attendance records
        setAttendanceRecords([]);
        setStats({
          totalClasses: 0,
          classesTaken: 0,
          classesMissed: 0,
          classesHandover: 0,
          attendancePercentage: 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching attendance data:', error);
      setError(error.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch for filter options only
  useEffect(() => {
    // Only fetch faculty and course lists for dropdowns, not attendance data
    fetchAttendanceData(false);
  }, [user]);
  
  // Fetch attendance data when filters change
  useEffect(() => {
    // Only fetch attendance data if any filter is applied
    const isFiltered = !!(selectedFaculty || selectedCourse || startDate || endDate);
    if (isFiltered) {
      fetchAttendanceData(true);
    } else {
      // Clear attendance records if no filters are applied
      setAttendanceRecords([]);
      setStats({
        totalClasses: 0,
        classesTaken: 0,
        classesMissed: 0,
        classesHandover: 0,
        attendancePercentage: 0
      });
    }
  }, [selectedFaculty, selectedCourse, startDate, endDate]);
  
  // Force clear attendance records on initial load
  useEffect(() => {
    // Explicitly clear attendance records on component mount
    setAttendanceRecords([]);
    setStats({
      totalClasses: 0,
      classesTaken: 0,
      classesMissed: 0,
      classesHandover: 0,
      attendancePercentage: 0
    });
  }, []);
  
  // Handle filter changes
  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const facultyId = e.target.value;
    console.log('Selected faculty ID:', facultyId);
    setSelectedFaculty(facultyId);
  };
  
  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourse(e.target.value);
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // If end date is before new start date, update end date
    if (endDate && newStartDate > endDate) {
      setEndDate(newStartDate);
    }
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    
    // If start date is after new end date, update start date
    if (startDate && newEndDate < startDate) {
      setStartDate(newEndDate);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedFaculty('');
    setSelectedCourse('');
    
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };
  
  // Export to CSV
  const exportToCSV = () => {
    if (attendanceRecords.length === 0) return;
    
    const headers = ['Date', 'Time Slot', 'Subject', 'Faculty', 'Course', 'Room No', 'Status', 'Remarks'];
    const csvContent = [
      headers.join(','),
      ...attendanceRecords.map(record => [
        new Date(record.date).toLocaleDateString(),
        record.timeSlot,
        `"${record.subject}"`,
        `"${record.facultyName}"`,
        record.course,
        record.roomNo,
        record.status,
        `"${record.remarks || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Taken':
        return <Check className="inline-block w-4 h-4 text-green-500 mr-1" />;
      case 'Handover':
        return <RefreshCw className="inline-block w-4 h-4 text-yellow-500 mr-1" />;
      case 'Missed':
        return <AlertCircle className="inline-block w-4 h-4 text-red-500 mr-1" />;
      default:
        return <Clock className="inline-block w-4 h-4 text-gray-500 mr-1" />;
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Attendance Records</h1>
        <button
          onClick={exportToCSV}
          disabled={loading || attendanceRecords.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          Export to CSV
        </button>
      </div>
      
      {/* Filters */}
      <Card className="mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Reset Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer"
                max={endDate} // Prevent selecting start date after end date
              />
              <CalendarIcon 
                className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" 
                aria-hidden="true"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer"
                min={startDate} // Prevent selecting end date before start date
              />
              <CalendarIcon 
                className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" 
                aria-hidden="true"
              />
            </div>
          </div>
          
          {/* Faculty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
            <select
              value={selectedFaculty}
              onChange={handleFacultyChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Faculty</option>
              {facultyList && facultyList.length > 0 ? (
                facultyList.map(faculty => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name || 'Unknown Faculty'}
                  </option>
                ))
              ) : (
                <option value="" disabled>No faculty members found</option>
              )}
            </select>
          </div>
          
          {/* Course Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={selectedCourse}
              onChange={handleCourseChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Courses</option>
              {courseList.map(course => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-900">Total Classes</h3>
              <p className="text-3xl font-bold text-blue-700">{stats.totalClasses}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-green-900">Classes Taken</h3>
              <p className="text-3xl font-bold text-green-700">{stats.classesTaken}</p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-red-900">Classes Missed</h3>
              <p className="text-3xl font-bold text-red-700">{stats.classesMissed}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-yellow-900">Handovers</h3>
              <p className="text-3xl font-bold text-yellow-700">{stats.classesHandover}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>
      
      
      {/* Attendance Records Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Daily Class Breakdown</h2>
        
        {/* Check if any filter is applied */}
        {!selectedFaculty && !selectedCourse && !startDate && !endDate ? (
          // No filters applied - show prompt
          <div className="h-64 flex items-center justify-center flex-col">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg font-medium">Please apply filters to view attendance data</p>
            <p className="text-gray-400 mt-2">Select a faculty, course, or date range to get started</p>
          </div>
        ) : loading ? (
          // Loading state
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-500">Loading attendance data...</p>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : attendanceRecords.length === 0 ? (
          // No records found with applied filters
          <div className="h-64 flex items-center justify-center flex-col">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No attendance records found</p>
            <p className="text-gray-400 mt-2">Try different filter criteria</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Time Slot</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Subject</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Faculty</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Course</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Room No.</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">{record.timeSlot}</td>
                    <td className="px-4 py-3 text-sm font-medium">{record.subject}</td>
                    <td className="px-4 py-3 text-sm">{record.facultyName}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {record.course}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{record.roomNo}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        {getStatusIcon(record.status)}
                        <span className={`
                          ${record.status === 'Taken' ? 'text-green-600' : ''}
                          ${record.status === 'Handover' ? 'text-yellow-600' : ''}
                          ${record.status === 'Missed' ? 'text-red-600' : ''}
                        `}>
                          {record.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{record.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
