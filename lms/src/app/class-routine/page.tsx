'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Calendar, Filter, Check, Clock, AlertCircle, RefreshCw, Home, User, LogOut, Printer } from 'lucide-react';
import { scheduleData } from '@/data/dashboard-data';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import FacultyNotifications from '@/components/faculty/FacultyNotifications';

export default function ClassRoutinePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const router = useRouter();
  const { user, loading } = useUser();
  const [courseFilter, setCourseFilter] = useState('All Courses');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [roomFilter, setRoomFilter] = useState('All Rooms');
  // Initialize with empty string to avoid hydration mismatch
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeString, setTimeString] = useState('');
  const [greeting, setGreeting] = useState('');
  
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

  // Set up time updates only on the client side
  useEffect(() => {
    // Set initial time string immediately on client
    setTimeString(currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setTimeString(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      
      // Update greeting based on time of day
      const hours = now.getHours();
      if (hours < 12) {
        setGreeting('Good Morning');
      } else if (hours < 17) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // State for routine data
  const [routineData, setRoutineData] = useState<any>(null);
  const [routineLoading, setRoutineLoading] = useState(true);
  const [routineError, setRoutineError] = useState<string | null>(null);
  
  // Fetch routine data for the current faculty user
  useEffect(() => {
    const fetchRoutineData = async () => {
      if (!user || !user._id) return;
      
      try {
        setRoutineLoading(true);
        const response = await fetch(`/api/routines?facultyId=${user._id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch routine data');
        }
        
        const data = await response.json();
        setRoutineData(data.routine);
        
        // Extract unique time slots from the routine data
        if (data.routine && data.routine.entries && data.routine.entries.length > 0) {
          const uniqueTimeSlots = [...new Set(data.routine.entries.map((entry: any) => entry.timeSlot))] as string[];
          uniqueTimeSlots.sort();
          setTimeSlots(uniqueTimeSlots.length > 0 ? uniqueTimeSlots : 
            ['08:00–08:50', '09:00–09:50', '10:00–10:50', '11:00–11:50']);
        } else {
          // Fallback to default time slots if no routine data is available
          setTimeSlots(['08:00–08:50', '09:00–09:50', '10:00–10:50', '11:00–11:50']);
        }
        
        setRoutineError(null);
      } catch (error) {
        console.error('Error fetching routine data:', error);
        setRoutineError('Failed to load your class routine. Please try again later.');
        // Set default time slots on error
        setTimeSlots(['08:00–08:50', '09:00–09:50', '10:00–10:50', '11:00–11:50']);
      } finally {
        setRoutineLoading(false);
      }
    };
    
    if (!loading && user) {
      fetchRoutineData();
    }
  }, [user, loading]);
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  // We'll now dynamically generate the time slots from the routine data
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  // For filtering default data when no routine is assigned
  const uniqueCourses = ['All Courses', ...new Set(scheduleData.map(item => item.course))];
  const uniqueSubjects = ['All Subjects', ...new Set(scheduleData.map(item => item.subject))];
  const uniqueRooms = ['All Rooms', ...new Set(scheduleData.map(item => item.roomNo))];

  // Get routine entry for a specific day and time slot
  const getRoutineEntryForCell = (day: string, timeSlot: string) => {
    if (!routineData || !routineData.entries || routineData.entries.length === 0) {
      // Fallback to default data if no routine is assigned
      return getDefaultClassForTimeSlot(day, timeSlot);
    }
    
    // Find the entry in the assigned routine
    return routineData.entries.find((entry: any) => 
      entry.day === day && entry.timeSlot === timeSlot
    );
  };
  
  // Fallback function to use default data
  const getDefaultClassForTimeSlot = (day: string, timeSlot: string) => {
    // Convert day format to match scheduleData (if needed)
    const dayAbbr = day.substring(0, 3).toUpperCase();
    
    // Convert time slot format to match scheduleData (if needed)
    const formattedTimeSlot = timeSlot.replace('–', '-');
    
    return scheduleData.find(schedule => {
      const matchesTime = schedule.time === formattedTimeSlot;
      const matchesCourse = courseFilter === 'All Courses' || schedule.course === courseFilter;
      const matchesSubject = subjectFilter === 'All Subjects' || schedule.subject === subjectFilter;
      const matchesRoom = roomFilter === 'All Rooms' || schedule.roomNo === roomFilter;
      return matchesTime && matchesCourse && matchesSubject && matchesRoom;
    });
  };
  
  // Get abbreviated day name for display
  const getAbbreviatedDay = (day: string) => {
    return day.substring(0, 3).toUpperCase();
  };
  
  // Reference to the routine table for downloading
  const routineTableRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
          }
          body {
            background-color: white;
          }
          .no-print {
            display: none !important;
          }
          .printable-area {
            display: block !important;
          }
          main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .h-\[calc\(100vh-12rem\)\] {
            height: auto !important;
            overflow: visible !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
          }
          .grid-cols-8 {
            grid-template-columns: repeat(8, minmax(0, 1fr));
          }
          .h-32 {
            height: auto !important;
            min-height: 4rem;
          }
          .md\:hidden {
            display: none !important;
          }
        }
      `}</style>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#59159d] text-white p-2 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-white no-print"
        aria-label="Toggle menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 no-print"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Left Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-[#59159d] text-white p-6 z-40 transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 no-print`}>
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
            </ul>
            <ul className="space-y-4">
              <li className="hover:bg-[#59159d] rounded-lg p-3 cursor-pointer">
                <a href="/class-routine" className="flex items-center justify-between">
                  <span>Class Routine</span>
                  <Calendar size={24} />
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-4 md:p-8 md:ml-64 transition-all duration-300 ease-in-out">
        {/* Top Bar */}
        {/* Header - always visible with placeholder during loading */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-4 rounded-lg shadow-sm mt-10 md:mt-0 no-print">
          <div>
            <h2 className="text-2xl font-semibold">{greeting}, {loading ? 'Loading...' : user?.name}</h2>
            <p className="text-gray-600">GNM/BSc Nursing Faculty</p>
          </div>
            <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between">
              <div className="text-gray-600">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {timeString}
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
                <DropdownMenu.Content sideOffset={5} align="end" className="w-56 bg-white rounded-lg shadow-lg p-2 mt-2 z-50 mr-4 border border-gray-200">
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
        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 no-print">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold">Class Routine</h2>
            <div className="text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <Button
            onClick={handlePrint}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            disabled={routineLoading}
          >
            <Printer className="w-4 h-4" />
            Print Routine
          </Button>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              className="bg-white border rounded-md px-3 py-2"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              {uniqueCourses.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
            <select
              className="bg-white border rounded-md px-3 py-2"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select
              className="bg-white border rounded-md px-3 py-2"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
            >
              {uniqueRooms.map((room) => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Day Selector - Only visible on small screens */}
        <div className="block md:hidden mb-4 no-print">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Day</label>
          <select 
            className="w-full bg-white border rounded-md px-3 py-2"
            onChange={(e) => {
              // Scroll to the selected day's section
              const dayElement = document.getElementById(`mobile-day-${e.target.value}`);
              if (dayElement) {
                dayElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            {days.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>

        {/* Desktop View - Hidden on mobile */}
        {/* Desktop View - Hidden on mobile */}
        <Card className="hidden md:block w-full overflow-hidden mt-8 printable-area">
          <ScrollArea className="h-[calc(100vh-12rem)] w-full overflow-x-auto">
            <div className="p-6" ref={routineTableRef}>
              <div className="grid grid-cols-8 gap-0 min-w-[800px]">
                {/* Time column */}
                <div className="col-span-1">
                  <div className="h-12"></div> {/* Empty cell for alignment */}
                  {timeSlots.map((time) => (
                    <div key={time} className="h-32 flex items-center justify-center text-sm text-gray-600 font-medium">
                      {time}
                    </div>
                  ))}
                </div>

                {/* Days columns */}
                {days.map((day) => (
                  <div key={day} className="col-span-1">
                    <div className="h-14 flex items-center justify-center font-bold text-indigo-700 bg-indigo-50 border-b mb-0">
                      {day}
                    </div>
                    {timeSlots.map((time) => {
                      const entry = getRoutineEntryForCell(day, time);
                      return (
                        <div key={`${day}-${time}`} className="h-32 p-3 border hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-blue-50">
                          {entry && (
                            <div className="h-full flex flex-col gap-2">
                              <div className="font-medium text-sm text-indigo-700">{entry.subject}</div>
                              <div className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1 inline-block">R-{entry.roomNumber || entry.roomNo}</div>
                              <Badge variant="outline" className="text-xs bg-white/50">{entry.department || entry.course}</Badge>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </Card>

        {/* Mobile View - Only visible on small screens */}
        <div className="md:hidden">
          {days.map((day) => (
            <Card key={day} className="mb-4 overflow-hidden" id={`mobile-day-${day}`}>
              <div className="bg-indigo-50 p-4 border-b">
                <h3 className="text-lg font-bold text-indigo-700">{day}</h3>
              </div>
              <div className="p-4">
                {timeSlots.map((time) => {
                  const entry = getRoutineEntryForCell(day, time);
                  return (
                    <div key={`${day}-${time}`} className="mb-4 p-3 border rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-blue-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm text-gray-600">{time}</div>
                        {entry && (
                          <div className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">R-{entry.roomNumber || entry.roomNo}</div>
                        )}
                      </div>
                      {entry ? (
                        <div>
                          <div className="font-medium text-indigo-700 mb-1">{entry.subject}</div>
                          <Badge variant="outline" className="text-xs bg-white/50">{entry.department || entry.course}</Badge>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">No class scheduled</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}