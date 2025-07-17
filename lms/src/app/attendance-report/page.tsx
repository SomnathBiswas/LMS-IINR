'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Calendar, Filter, Check, Clock, AlertCircle, RefreshCw, Home, User, LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import FacultyNotifications from '@/components/faculty/FacultyNotifications';

export default function AttendanceReportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const router = useRouter();
  const { user } = useUser();
  const [period, setPeriod] = useState('month');
  const [courseFilter, setCourseFilter] = useState('All');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState('table'); // 'graph' or 'table'
  
  // State for attendance data
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [attendanceStats, setAttendanceStats] = useState({
    totalClasses: 0,
    classesTaken: 0,
    classesMissed: 0,
    classesHandover: 0,
    attendancePercentage: 0
  });
  const [attendanceLog, setAttendanceLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set initial time only on client-side to prevent hydration mismatch
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch attendance data for the current faculty user
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!user || !user._id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/attendance?facultyId=${user._id}&period=${period}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch attendance data');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setAttendanceData(data);
          setAttendanceStats(data.stats || {
            totalClasses: 0,
            classesTaken: 0,
            classesMissed: 0,
            classesHandover: 0,
            attendancePercentage: 0
          });
          
          // Format attendance records for display
          const formattedRecords = (data.attendanceRecords || []).map((record: any) => ({
            date: new Date(record.date).toISOString().split('T')[0],
            subject: record.subject || 'Unknown Subject',
            course: record.course || 'Unknown Course',
            time: record.timeSlot || 'N/A',
            roomNo: record.roomNo || 'N/A',
            status: record.status || 'Unknown',
            remarks: record.remarks || '',
            id: record._id
          }));
          
          setAttendanceLog(formattedRecords);
        } else {
          throw new Error(data.error || 'Failed to fetch attendance data');
        }
      } catch (error: any) {
        console.error('Error fetching attendance data:', error);
        setError(error.message || 'Failed to load attendance data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [user, period]);

  // Get initials from user's name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    } else {
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Taken':
        return <Check className="inline-block w-4 h-4 text-green-500 mr-1" />;
      case 'Handover':
        return <RefreshCw className="inline-block w-4 h-4 text-yellow-500 mr-1" />;
      case 'Missed':
        return <AlertCircle className="inline-block w-4 h-4 text-red-500 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Mobile Menu Button */}
      <button 
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#59159d] text-white p-2 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Toggle menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Left Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-[#59159d] text-white p-6 z-40 transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Nursing Institute</h1>
          </div>
          
          <nav className="flex-1">
            <ul className="space-y-4">
              <li className="hover:bg-[#59159d] rounded-lg p-3 cursor-pointer">
                <a href="/" className="flex items-center justify-between">
                  <span>Dashboard</span>
                  <Home size={24} />
                </a>
              </li>
              <li className="hover:bg-[#59159d] rounded-lg p-3 cursor-pointer">
                <a href="/class-routine" className="flex items-center justify-between">
                  <span>Class Routine</span>
                  <Calendar size={24} />
                </a>
              </li>

              <li className="bg-white/10 rounded-lg p-3 cursor-pointer">
                <a href="/attendance-report" className="flex items-center justify-between">
                  <span>Attendance Report</span>
                  <Calendar size={24} />
                </a>
              </li>
            </ul>
          </nav>

          <div className="mt-auto">
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 text-white/80 hover:text-white"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-4 md:p-8 md:ml-64 transition-all duration-300 ease-in-out">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 mt-10 md:mt-0">
          <div>
            <h1 className="text-2xl font-semibold">Attendance Report</h1>
            <p className="text-gray-600">Track and analyze your attendance records</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="min-w-full divide-y divide-gray-200 min-w-[640px]">
                <tbody>
                  <tr>
                    <td className="py-3">{currentTime ? currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</td>
                  </tr>
                  <tr>
                    <td className="py-3">{currentTime ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="rounded-full overflow-hidden">
                  <Avatar className="h-10 w-10">
                    {user?.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt={user.name || 'User'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-purple-500 flex items-center justify-center text-white font-medium">
                        {user?.name ? getInitials(user.name) : 'U'}
                      </div>
                    )}
                  </Avatar>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content sideOffset={5} align="end" className="bg-white rounded-md shadow-lg p-1 min-w-[160px] z-50 border border-gray-200">
                <DropdownMenu.Item className="p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => router.push('/account')}>
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>My Account</span>
                  </div>
                </DropdownMenu.Item>
                <DropdownMenu.Item className="p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => router.push('/login')}>
                  <div className="flex items-center gap-2 text-red-600">
                    <LogOut size={16} />
                    <span>Logout</span>
                  </div>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-blue-50">
            <h3 className="text-lg font-medium text-blue-900">Total Classes Assigned</h3>
            <p className="text-3xl font-bold text-blue-700">{attendanceStats.totalClasses}</p>
          </Card>
          <Card className="p-6 bg-green-50">
            <h3 className="text-lg font-medium text-green-900">Classes Taken</h3>
            <p className="text-3xl font-bold text-green-700">{attendanceStats.classesTaken}</p>
          </Card>
          <Card className="p-6 bg-red-50">
            <h3 className="text-lg font-medium text-red-900">Classes Missed</h3>
            <p className="text-3xl font-bold text-red-700">{attendanceStats.classesMissed}</p>
          </Card>
          <Card className="p-6 bg-purple-50">
            <h3 className="text-lg font-medium text-purple-900">Attendance %</h3>
            <p className="text-3xl font-bold text-purple-700">{attendanceStats.attendancePercentage}%</p>
            {attendanceStats.attendancePercentage >= 90 ? (
              <Badge className="mt-2 bg-green-500">Excellent</Badge>
            ) : attendanceStats.attendancePercentage >= 75 ? (
              <Badge className="mt-2 bg-yellow-500">Good</Badge>
            ) : (
              <Badge className="mt-2 bg-red-500">Needs Improvement</Badge>
            )}
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full sm:w-auto mb-2 sm:mb-0"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 3 months</option>
              <option value="year">Last year</option>
            </select>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              <option>All</option>
              <option>BSc</option>
              <option>GNM</option>
              <option>PBBSc</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'graph' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'} w-full sm:w-auto mb-2 sm:mb-0`}
            >
              Graph View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'table' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}
            >
              Table View
            </button>
          </div>
        </div>

        {/* Attendance Analytics */}
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Attendance Analytics</h2>
          {loading ? (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
                <p className="text-gray-500">Loading attendance data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : attendanceLog.length === 0 ? (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No attendance records found for the selected period</p>
            </div>
          ) : viewMode === 'graph' ? (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Attendance trend visualization will be available soon</p>
            </div>
          ) : null}
        </Card>

        {/* Attendance Log */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Attendance Log</h2>
            <button 
              className="text-purple-600 hover:text-purple-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              disabled={loading || attendanceLog.length === 0}
              onClick={() => {
                // Simple CSV export functionality
                if (attendanceLog.length === 0) return;
                
                const headers = ['Date', 'Subject', 'Course', 'Time', 'Room', 'Status', 'Remarks'];
                const csvContent = [
                  headers.join(','),
                  ...attendanceLog.map(log => [
                    log.date,
                    `"${log.subject}"`,
                    log.course,
                    log.time,
                    log.roomNo,
                    log.status,
                    `"${log.remarks || ''}"`
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
              }}
            >
              Export CSV
            </button>
          </div>
          
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
                <p className="text-gray-500">Loading attendance data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500">{error}</p>
              </div>
            </div>
          ) : attendanceLog.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No attendance records found for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <ScrollArea className="h-[400px]">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Subject</th>
                    <th className="pb-3">Course</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Room</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLog
                    .filter(log => courseFilter === 'All' || log.course === courseFilter)
                    .map((log, index) => (
                      <tr key={log.id || index} className="border-b last:border-0">
                        <td className="py-3">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="py-3">{log.subject}</td>
                        <td className="py-3">{log.course}</td>
                        <td className="py-3">{log.time}</td>
                        <td className="py-3">{log.roomNo}</td>
                        <td className="py-3">
                          <div className="flex items-center">
                            {getStatusIcon(log.status)}
                            <span className={`
                              ${log.status === 'Taken' ? 'text-green-600' : ''}
                              ${log.status === 'Handover' ? 'text-yellow-600' : ''}
                              ${log.status === 'Missed' ? 'text-red-600' : ''}
                            `}>
                              {log.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-gray-600">{log.remarks}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </ScrollArea>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}