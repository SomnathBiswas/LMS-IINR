'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import toast, { Toaster } from 'react-hot-toast';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, Clock, AlertCircle, RefreshCw, Home, CheckSquare, User, LogOut, Calendar, Loader2, X, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

// Define types for our data
interface ScheduleItem {
  id: string;
  subject: string;
  course: string;
  roomNo: string;
  time: string;
  timeSlot: string;
  startTime?: string;
  endTime?: string;
  status: string;
  date?: string;
  facultyId?: string;
  attendanceMarkedAt?: string;
}

export default function MarkAttendancePage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [courseFilter, setCourseFilter] = useState('All Courses');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [markingAttendanceId, setMarkingAttendanceId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ScheduleItem | null>(null);
  const [markingOption, setMarkingOption] = useState<'all-present' | 'mark-absent'>('all-present');
  const [absentStudentNames, setAbsentStudentNames] = useState<string[]>([]);
  const [newAbsentStudent, setNewAbsentStudent] = useState('');
  
  // Initialize greeting based on current time
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) {
      setGreeting('Good Morning');
    } else if (hours < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Update greeting based on time of day
      const hours = now.getHours();
      if (hours < 12) {
        setGreeting('Good Morning');
      } else if (hours < 17) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
      
      // Refresh data every minute to keep statuses current
      if (now.getSeconds() === 0) {
        setRefreshTrigger(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  // Fetch class data from API
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!user?.facultyId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching class data...');
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        // Add timestamp for cache busting
        const timestamp = new Date().getTime();
        
        // Fetch faculty class data
        const response = await fetch(`/api/faculty/class-attendance-tracking?facultyId=${user.facultyId}&date=${today}&t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch class data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched class data:', data);
        
        // Transform the data to match our ScheduleItem interface
        const transformedData = data.map((item: any) => {
          // Normalize status to lowercase for consistency
          let status = (item.status || 'pending').toLowerCase();
          
          // Log the original and normalized status
          console.log(`Item ${item.id || item._id}: Original status: ${item.status}, Normalized: ${status}`);
          
          return {
            id: item.id || item._id,
            subject: item.subject || '',
            course: item.course || '',
            roomNo: item.roomNo || '',
            time: item.timeSlot || '',
            timeSlot: item.timeSlot || '',
            startTime: item.startTime || '',
            endTime: item.endTime || '',
            status: status,
            date: item.date || '',
            facultyId: item.facultyId || '',
            attendanceMarkedAt: item.attendanceMarkedAt || ''
          };
        });
        
        setScheduleData(transformedData);
      } catch (err) {
        console.error('Error fetching schedule data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch schedule data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScheduleData();
    
    // Set up interval to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing schedule data...');
      setRefreshTrigger(prev => prev + 1);
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId);
  }, [refreshTrigger, user]); // Refetch when user changes or refresh is triggered

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Handle attendance marking
  const handleMarkAttendance = (schedule: ScheduleItem) => {
    setSelectedClass(schedule);
    setIsDialogOpen(true);
  };

  const handleAddAbsentStudent = () => {
    if (newAbsentStudent.trim()) {
      setAbsentStudentNames([...absentStudentNames, newAbsentStudent.trim()]);
      setNewAbsentStudent('');
    }
  };

  const handleRemoveAbsentStudent = (index: number) => {
    setAbsentStudentNames(absentStudentNames.filter((_, i) => i !== index));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !user?.facultyId) {
      toast.error('Cannot submit attendance. Please try again.');
      return;
    }

    setMarkingAttendanceId(selectedClass.id);

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: user.facultyId,
          classId: selectedClass.id,
          subject: selectedClass.subject,
          course: selectedClass.course,
          roomNo: selectedClass.roomNo,
          timeSlot: selectedClass.timeSlot,
          status: 'Taken',
          date: new Date().toISOString(),
          absentStudents: markingOption === 'mark-absent' ? absentStudentNames : [],
        }),
      });

      if (response.ok) {
        toast.success('Attendance submitted successfully!');
        setIsDialogOpen(false);
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast.error('Failed to submit attendance.');
      }
    } catch (error) {
      toast.error('An error occurred while submitting attendance.');
    } finally {
      setMarkingAttendanceId(null);
    }
  };

  // Extract unique courses and subjects from the fetched data
  const uniqueCourses = ['All Courses', ...new Set(scheduleData.map(item => item.course).filter(Boolean))];
  const uniqueSubjects = ['All Subjects', ...new Set(scheduleData.map(item => item.subject).filter(Boolean))];

  const getStatusIcon = (status: string) => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'taken':
        return <Check className="inline-block w-4 h-4 text-green-500 mr-1" />;
      case 'handover':
        return <RefreshCw className="inline-block w-4 h-4 text-yellow-500 mr-1" />;
      case 'pending':
        return <Clock className="inline-block w-4 h-4 text-gray-500 mr-1" />;
      case 'window-open':
        return <Clock className="inline-block w-4 h-4 text-blue-500 mr-1" />;
      case 'missed':
        return <AlertCircle className="inline-block w-4 h-4 text-red-500 mr-1" />;
      default:
        return <Clock className="inline-block w-4 h-4 text-gray-500 mr-1" />;
    }
  };
  
  // Format status for display with proper capitalization
  const formatStatusLabel = (status: string) => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'taken': return 'Taken';
      case 'handover': return 'Handover';
      case 'pending': return 'Pending';
      case 'window-open': return 'Mark Now';
      case 'missed': return 'Missed';
      case 'handed over': return 'Handed Over';
      default: return status; // Return original if not matched
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toast Container */}
      <Toaster position="top-right" />
      
      {/* Left Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#59159d] text-white p-6">
        <div className="flex flex-col h-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Nursing Institute</h1>
          </div>
          
          <nav className="flex-1">
            <ul className="space-y-4">
              <li>
                <a href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                  <Home className="w-5 h-5" />
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/mark-attendance" className="flex items-center gap-2 text-white">
                  <CheckSquare className="w-5 h-5" />
                  Mark Attendance
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Top Bar */}
        {/* Header - always visible with placeholder during loading */}
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold">{greeting}, {loading ? 'Loading...' : user?.name}</h2>
            <p className="text-gray-600">GNM/BSc Nursing Faculty</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-gray-600">
              <div className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="focus:outline-none">
                  <Avatar>
                    {loading ? (
                      <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>
                    ) : user?.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {user?.name ? user.name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                  </Avatar>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="w-56 bg-white rounded-lg shadow-lg p-2 mt-2">
                  <DropdownMenu.Item className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer rounded-md transition-colors" onClick={() => router.push('/account')}>
                    <User className="w-4 h-4 mr-2" />
                    My Account
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                  <DropdownMenu.Item className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer rounded-md transition-colors">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Mark Attendance</h1>
            <div className="flex gap-4">
              <select
                className="px-4 py-2 rounded-md border border-gray-300"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                {uniqueCourses.map((course) => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              <select
                className="px-4 py-2 rounded-md border border-gray-300"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                {uniqueSubjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)]">
            {isLoading ? (
              // Loading state
              <div className="space-y-4">
                {[1, 2, 3, 4].map((_, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-2/3">
                        <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-1/2 animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-8 bg-gray-200 rounded-md w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              // Error state
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setRefreshTrigger(prev => prev + 1)}
                >
                  Retry
                </Button>
              </div>
            ) : scheduleData.length === 0 ? (
              // Empty state
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-gray-600">No classes found for today.</p>
              </div>
            ) : (
              // Data display
              <div className="space-y-4">
                {scheduleData.map((schedule, index) => {
                  // Apply filters
                  if (
                    (courseFilter === 'All Courses' || schedule.course === courseFilter) &&
                    (subjectFilter === 'All Subjects' || schedule.subject === subjectFilter)
                  ) {
                    // Track if this class is currently being processed for attendance marking
                    const isMarkingAttendance = schedule.id === markingAttendanceId;
                    
                    return (
                      <Card key={schedule.id || index} className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{schedule.subject}</h3>
                              <Badge variant="outline">{schedule.course}</Badge>
                              <Badge variant="outline">Room {schedule.roomNo}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">{schedule.time}</p>
                            {schedule.attendanceMarkedAt && (
                              <p className="text-xs text-gray-400 mt-1">
                                Marked at: {new Date(schedule.attendanceMarkedAt).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge
                              variant={schedule.status.toLowerCase() === 'taken' ? 'default' : 'outline'}
                              className={`flex items-center gap-1 ${
                                schedule.status.toLowerCase() === 'window-open' ? 'bg-blue-100 text-blue-800' : 
                                schedule.status.toLowerCase() === 'taken' ? 'bg-green-100 text-green-800' :
                                schedule.status.toLowerCase() === 'missed' ? 'bg-red-100 text-red-800' : ''
                              }`}
                            >
                              {getStatusIcon(schedule.status)}
                              {formatStatusLabel(schedule.status)}
                            </Badge>
                            
                            {/* Show button only for pending or window-open classes */}
                            {(schedule.status.toLowerCase() === 'pending' || schedule.status.toLowerCase() === 'window-open') && (
                              <Button 
                                variant="default" 
                                className={`ml-4 ${
                                  schedule.status.toLowerCase() === 'window-open' ? 'bg-blue-500 hover:bg-blue-600' : ''
                                }`}
                                onClick={() => handleMarkAttendance(schedule)}
                                disabled={isMarkingAttendance}
                              >
                                {isMarkingAttendance ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Marking...
                                  </>
                                ) : (
                                  'Mark Attendance'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </main>

      {isDialogOpen && selectedClass && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Attendance for {selectedClass.subject}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div
                  className={`flex-1 p-3 border rounded-md cursor-pointer ${markingOption === 'all-present' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setMarkingOption('all-present')}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">All Present</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Mark all students as present</p>
                </div>
                <div
                  className={`flex-1 p-3 border rounded-md cursor-pointer ${markingOption === 'mark-absent' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setMarkingOption('mark-absent')}
                >
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Mark Absent</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Specify absent students</p>
                </div>
              </div>
              {markingOption === 'mark-absent' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter student name"
                      value={newAbsentStudent}
                      onChange={(e) => setNewAbsentStudent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddAbsentStudent()}
                    />
                    <Button onClick={handleAddAbsentStudent}>Add</Button>
                  </div>
                  {absentStudentNames.length > 0 && (
                    <div className="border rounded-md p-2">
                      <p className="text-sm font-medium mb-2">Absent Students:</p>
                      <ul className="space-y-1">
                        {absentStudentNames.map((name, index) => (
                          <li key={index} className="flex justify-between items-center text-sm p-1 bg-gray-50 rounded">
                            {name}
                            <button
                              onClick={() => handleRemoveAbsentStudent(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitAttendance} disabled={markingAttendanceId === selectedClass.id}>
                {markingAttendanceId === selectedClass.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Attendance'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}