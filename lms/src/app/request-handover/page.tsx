'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { subjectsList } from '@/data/subjects-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertCircle, RefreshCw, Check, Filter, Home } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Avatar } from '@/components/ui/avatar';
import FacultyNotifications from '@/components/faculty/FacultyNotifications';
import DynamicGreeting from '@/components/DynamicGreeting';

export default function RequestHandoverPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  // Check if user is authenticated and is a faculty member
  useEffect(() => {
    // Skip authentication check if user data is still loading
    if (userLoading) {
      console.log('User data is still loading, skipping auth check');
      return;
    }
    
    // If user data is loaded and no user exists, redirect to signin
    if (!user && !userLoading) {
      console.log('No user found after loading, redirecting to signin');
      router.push('/auth/signin?redirect=/request-handover');
      return;
    }
    
    // If user exists but is not faculty, redirect to appropriate dashboard
    if (user && user.role !== 'Faculty') {
      console.log(`User role is ${user.role}, redirecting to appropriate dashboard`);
      if (user.role === 'Admin' || user.role === 'HOD') {
        router.push('/hod-dashboard');
      } else if (user.role === 'Student') {
        router.push('/student-dashboard');
      }
    } else if (user) {
      console.log('Faculty user confirmed, staying on page');
    }
  }, [user, userLoading, router]);
  
  // Form state
  const [dateOfClass, setDateOfClass] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [subject, setSubject] = useState('');
  const [course, setCourse] = useState('');
  const [reason, setReason] = useState('');
  const [substituteId, setSubstituteId] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [selectedClassDetails, setSelectedClassDetails] = useState<{ subject: string, course: string, originalTimeSlot: string, roomNo: string } | null>(null);

  // State for dynamic class options based on selected date
  const [todaysClassesOptions, setTodaysClassesOptions] = useState<Array<{ value: string, label: string, subject: string, course: string, originalTimeSlot: string, roomNo: string }>>([]);
  const [loadingTodaysClasses, setLoadingTodaysClasses] = useState(false);
  
  // Conflict detection state
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  // Faculty list for substitute selection
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  
  // Handover history
  const [handoverHistory, setHandoverHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('request');
  
  // Time slot options
  const timeSlots = [
    '08:00–08:50', '09:00–09:50', '10:00–10:50', '11:00–11:50', 
    '12:00–12:50', '13:00–13:50', '14:00–14:50', '15:00–15:50'
  ];
  
  // Course/department options
  const departments = ['BSc', 'GNM', 'PBBSc', 'MSc'];
  
  // Use the centralized subjects list
  const subjects = subjectsList;
  
  // Effect to fetch faculty's classes for the selected date
  useEffect(() => {
    const fetchClassesForDate = async () => {
      if (!dateOfClass || !user) {
        setTodaysClassesOptions([]);
        setTimeSlot(''); // Reset time slot if date changes
        setSubject(''); // Reset subject
        setCourse('');  // Reset course
        setRoomNo('');
        setSelectedClassDetails(null);
        return;
      }
      setLoadingTodaysClasses(true);
      try {
        // Assuming /api/routines can fetch a specific faculty's routine
        // We need to ensure it returns data filterable by date on the client or supports a date query param
        const response = await fetch(`/api/routines?facultyId=${user._id || user.facultyId}`);
        if (!response.ok) throw new Error('Failed to fetch schedule');
        const data = await response.json();
        if (data.routine && data.routine.entries) {
          const selectedDateObj = new Date(dateOfClass);
          const dayOfWeek = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });

          const classesForDay = data.routine.entries.filter((entry: any) => {
            const entryDay = entry.day || '';
            const isForSelectedDay = entryDay.toLowerCase() === dayOfWeek.toLowerCase();
            if (!isForSelectedDay) return false;

            const now = new Date();
            const classStartDateTime = new Date(dateOfClass);
            const [startHour, startMinute] = (entry.timeSlot || '00:00').split(/[:–-]/).map(Number);

            if (!isNaN(startHour) && !isNaN(startMinute)) {
              classStartDateTime.setHours(startHour, startMinute, 0, 0);
            }

            // Class must be in the future
            return classStartDateTime > now;
          }).map((entry: any) => ({
            value: (entry.id || entry._id).toString(),
            label: `${entry.timeSlot} - ${entry.subject}`,
            subject: entry.subject,
            course: entry.course || entry.department,
            originalTimeSlot: entry.timeSlot,
            roomNo: entry.roomNo || entry.roomNumber || ''
          }));
          setTodaysClassesOptions(classesForDay);
          if (classesForDay.length > 0) {
            // Optionally pre-select the first class or leave it for user selection
            // setTimeSlot(classesForDay[0].value);
            // setSubject(classesForDay[0].subject);
            // setCourse(classesForDay[0].course);
          } else {
            setTimeSlot('');
            setSubject('');
            setCourse('');
            setRoomNo('');
          }
        } else {
          setTodaysClassesOptions([]);
        }
      } catch (err) {
        console.error("Error fetching today's classes for handover:", err);
        setTodaysClassesOptions([]);
        // setError("Could not load your classes for the selected date.");
      } finally {
        setLoadingTodaysClasses(false);
      }
    };

    fetchClassesForDate();
  }, [dateOfClass, user]);

  // Fetch faculty list for substitute selection
  useEffect(() => {
    const fetchFacultyList = async () => {
      try {
        setLoadingFaculty(true);
        const response = await fetch('/api/faculty/list');
        
        if (!response.ok) {
          throw new Error('Failed to fetch faculty list');
        }
        
        const data = await response.json();
        // Filter out current user from the list
        const filteredList = data.facultyMembers.filter((faculty: any) => 
          faculty._id !== user?._id && faculty.facultyId !== user?.facultyId
        );
        
        setFacultyList(filteredList);
      } catch (err) {
        console.error('Error fetching faculty list:', err);
        setError('Failed to load faculty list. Please try again.');
      } finally {
        setLoadingFaculty(false);
      }
    };
    
    if (user) {
      fetchFacultyList();
    }
  }, [user]);
  
  // Get faculty members who know the selected subject
  const getQualifiedFaculty = () => {
    if (!subject) return facultyList;
    
    return facultyList.filter((faculty: any) => {
      // If faculty has subjectsKnown array and it includes the current subject
      return faculty.subjectsKnown && 
             Array.isArray(faculty.subjectsKnown) && 
             faculty.subjectsKnown.includes(subject);
    });
  };
  
  // Get the list of qualified faculty for the current subject
  const qualifiedFacultyList = getQualifiedFaculty();
  
  // Fetch handover history
  useEffect(() => {
    const fetchHandoverHistory = async () => {
      if (!user) return;
      
      try {
        setLoadingHistory(true);
        const response = await fetch(`/api/handovers?facultyId=${user._id || user.facultyId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch handover history');
        }
        
        const data = await response.json();
        setHandoverHistory(data.handovers || []);
      } catch (err) {
        console.error('Error fetching handover history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    if (user) {
      fetchHandoverHistory();
    }
  }, [user]);
  
  // Check substitute availability when necessary fields are filled
  useEffect(() => {
    const checkSubstituteAvailability = async () => {
      // Reset conflict state first
      setHasConflict(false);
      setConflictDetails(null);
      
      // Only check if all required fields are filled
      if (!dateOfClass || !selectedClassDetails?.originalTimeSlot || !substituteId) {
        return;
      }
      
      try {
        setCheckingAvailability(true);
        const response = await fetch(
          `/api/check-substitute-availability?substituteId=${substituteId}&dateOfClass=${dateOfClass}&timeSlot=${selectedClassDetails.originalTimeSlot}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to check substitute availability');
        }
        
        const data = await response.json();
        
        // Only set conflict data if we have a valid response
        if (data && !data.available && data.conflict) {
          setHasConflict(true);
          setConflictDetails(data.conflict);
        }
      } catch (err) {
        console.error('Error checking substitute availability:', err);
      } finally {
        setCheckingAvailability(false);
      }
    };
    
    // Add a small delay to avoid unnecessary API calls during rapid field changes
    const timer = setTimeout(() => {
      checkSubstituteAvailability();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [dateOfClass, selectedClassDetails, substituteId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!dateOfClass || !timeSlot || !subject || !course || !substituteId || !reason) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const handoverData = {
        facultyId: user?._id || user?.facultyId,
        facultyName: user?.name,
        dateOfClass,
        timeSlot: selectedClassDetails?.originalTimeSlot || timeSlot, // Send the original timeSlot string
        classId: timeSlot,
        subject,
        course,
        roomNo,
        reason,
        substituteId,
        substituteName: facultyList.find(faculty => faculty._id === substituteId)?.name || 'Unknown'
      };
      
      const response = await fetch('/api/handovers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(handoverData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit handover request');
      }
      
      // Reset form
      setDateOfClass('');
      setTimeSlot('');
      setSubject('');
      setCourse('');
      setReason('');
      setSubstituteId('');
      
      setSuccess('Handover request submitted successfully');
      
      // Add notification for handover request
      const substituteName = facultyList.find(faculty => faculty._id === substituteId)?.name || 'Unknown';
      
      // Notification for HOD
      addNotification({
        title: `New handover request from ${user?.name}`,
        description: `Class on ${dateOfClass} at ${timeSlot} - Substitute: ${substituteName}`,
        type: 'handover',
        isRead: false
      });
      
      // Refresh handover history
      const historyResponse = await fetch(`/api/handovers?facultyId=${user?._id || user?.facultyId}`);
      const historyData = await historyResponse.json();
      setHandoverHistory(historyData.handovers || []);
      
    } catch (err: any) {
      console.error('Error submitting handover request:', err);
      setError(err.message || 'Failed to submit handover request');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Handle logout
  const handleLogout = () => {
    try {
      // Clear the token cookie - multiple approaches for reliability
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
      
      // Log the action for debugging
      console.log('Logging out and redirecting to signin page');
      
      // Use the special logout parameter to bypass the middleware redirect
      window.location.href = '/auth/signin?logout=true';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error during logout. Please try again.');
    }
  };
  
  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> Pending
        </Badge>;
      case 'Approved':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Check className="w-3 h-3" /> Approved
        </Badge>;
      case 'Rejected':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Rejected
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Filter handover history by status
  const filteredHistory = statusFilter === 'All' 
    ? handoverHistory 
    : handoverHistory.filter(item => item.status === statusFilter);

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
              <li className="bg-[#59159d] rounded-lg p-3 cursor-pointer">
                <a href="/request-handover" className="flex items-center justify-between">
                  <span>Request Handover</span>
                  <RefreshCw size={24} />
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="p-4 md:p-8 md:ml-64 transition-all duration-300 ease-in-out">
        {/* Top Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-4 rounded-lg shadow-sm mt-10 md:mt-0">
          <div>
            <DynamicGreeting 
              userName={user?.name} 
              userRole={`${user?.role || 'Faculty'} | ${user?.department || 'Nursing'}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between">
            <div className="text-gray-600">
              <div className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <FacultyNotifications />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-full p-1">
                  <Avatar>
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-purple-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold border-2 border-purple-200">
                        {user?.name ? user.name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase() : '??'}
                      </div>
                    )}
                  </Avatar>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-white p-2 rounded-lg shadow-lg z-50 min-w-[200px] mr-4">
                  <DropdownMenu.Item className="px-2 py-2 hover:bg-gray-100 rounded flex items-center gap-2 cursor-pointer">
                    <a href="/account" className="flex items-center gap-2 w-full">
                      My Account
                    </a>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="px-2 py-2 hover:bg-gray-100 rounded flex items-center gap-2 cursor-pointer text-red-600" onClick={handleLogout}>
                    Logout
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>
        
        <h1 className="text-2xl font-bold mb-6">Request Class Handover</h1>
        
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'request' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('request')}
          >
            New Request
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('history')}
          >
            Handover History
          </button>
        </div>
      </div>
      
      {activeTab === 'request' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create Handover Request</h2>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded-md">
              <div className="flex">
                <Check className="h-5 w-5 text-green-400" />
                <p className="ml-3 text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Class*
                </label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2"
                  value={dateOfClass}
                  onChange={(e) => setDateOfClass(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Slot*
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={timeSlot} // This will be the identifier (e.g., originalTimeSlot or a unique ID)
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    const classDetail = todaysClassesOptions.find(opt => opt.value === selectedValue);
                    if (classDetail) {
                      setTimeSlot(classDetail.value); // Store the selected value (identifier)
                      
                      // If subject is changing, reset the substituteId to ensure we select a qualified faculty
                      if (subject !== classDetail.subject) {
                        setSubstituteId('');
                      }
                      
                      setSubject(classDetail.subject);
                      setCourse(classDetail.course);
                      setRoomNo(classDetail.roomNo);
                      setSelectedClassDetails({ subject: classDetail.subject, course: classDetail.course, originalTimeSlot: classDetail.originalTimeSlot, roomNo: classDetail.roomNo });
                    } else {
                      setTimeSlot('');
                      setSubject('');
                      setCourse('');
                      setRoomNo('');
                      setSelectedClassDetails(null);
                      setSubstituteId(''); // Reset substitute selection when no class is selected
                    }
                  }}
                  required
                  disabled={loadingTodaysClasses || todaysClassesOptions.length === 0}
                >
                  <option value="">{loadingTodaysClasses ? "Loading classes..." : "Select Class (Time Slot - Subject)"}</option>
                  {todaysClassesOptions.map((opt) => (
                    <option key={opt.value + opt.label} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  {todaysClassesOptions.length === 0 && !loadingTodaysClasses && dateOfClass && (
                    <option value="" disabled>No classes found for selected date.</option>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject* (auto-filled)
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 bg-gray-100"
                  value={subject}
                  readOnly
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course / Department* (auto-filled)
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 bg-gray-100"
                  value={course}
                  readOnly
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room No. (auto-filled)
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 bg-gray-100"
                  value={roomNo}
                  readOnly
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Handover*
                </label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 min-h-[100px]"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a reason for the handover request"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Substitute Faculty*
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={substituteId}
                  onChange={(e) => setSubstituteId(e.target.value)}
                  required
                  disabled={loadingFaculty || checkingAvailability}
                >
                  <option value="">Select Substitute Faculty</option>
                  {loadingFaculty ? (
                    <option value="" disabled>Loading faculty members...</option>
                  ) : qualifiedFacultyList.length === 0 ? (
                    <option value="" disabled>
                      {subject ? `No faculty members qualified to teach ${subject}` : 'No faculty members available'}
                    </option>
                  ) : (
                    qualifiedFacultyList.map((faculty) => (
                      <option key={faculty._id} value={faculty._id}>
                        {faculty.name} {faculty.department ? `- ${faculty.department}` : ''}
                        {faculty.subjectsKnown && Array.isArray(faculty.subjectsKnown) && 
                         faculty.subjectsKnown.includes(subject) && subject ? 
                         ' ✓ Qualified' : ''}
                      </option>
                    ))
                  )}
                </select>
                
                {/* Show selected faculty's subject expertise if available */}
                {substituteId && !checkingAvailability && (
                  <div className="mt-2">
                    {facultyList.map((faculty) => {
                      if (faculty._id === substituteId && faculty.subjectsKnown && Array.isArray(faculty.subjectsKnown)) {
                        const isQualified = faculty.subjectsKnown.includes(subject);
                        return (
                          <div key={faculty._id} className={`p-3 border rounded-md ${isQualified ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-start">
                              {isQualified ? (
                                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                              )}
                              <div>
                                <p className={`text-sm font-medium ${isQualified ? 'text-green-800' : 'text-amber-800'}`}>
                                  {isQualified ? 'Qualified Faculty' : 'Faculty May Need Support'}
                                </p>
                                <p className={`text-sm ${isQualified ? 'text-green-700' : 'text-amber-700'} mt-1`}>
                                  {isQualified 
                                    ? `${faculty.name} is qualified to teach ${subject}.` 
                                    : `${faculty.name} is not listed as qualified to teach ${subject}.`}
                                </p>
                                {faculty.subjectsKnown.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600 mb-1">Subjects known:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {faculty.subjectsKnown.map((subj: string) => (
                                        <span 
                                          key={subj} 
                                          className={`text-xs px-2 py-1 rounded-full ${subj === subject ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                                        >
                                          {subj}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
                
                {subject && facultyList.length > 0 && qualifiedFacultyList.length === 0 && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">No qualified faculty found</p>
                        <p className="text-sm text-amber-700 mt-1">
                          No faculty members are qualified to teach {subject}. Consider selecting faculty with relevant expertise.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {checkingAvailability && (
                  <div className="mt-2 text-sm text-blue-600 flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking availability...
                  </div>
                )}
                
                {hasConflict && conflictDetails && !checkingAvailability && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Scheduling Conflict Detected</p>
                        <p className="text-sm text-amber-700 mt-1">
                          {conflictDetails.conflictType === "regular_class" && (
                            <>This faculty member already has a regular class scheduled for {conflictDetails.subject || 'Unknown'} ({conflictDetails.course || 'Unknown'}) on {conflictDetails.day} at {conflictDetails.timeSlot}.</>
                          )}
                          {conflictDetails.conflictType === "handover_assignment" && (
                            <>This faculty member is already assigned as a substitute for another class ({conflictDetails.subject || 'Unknown'}) on this date at {conflictDetails.timeSlot}.</>
                          )}
                          {conflictDetails.conflictType === "approved_handover" && (
                            <>This faculty member has already been approved as a substitute for another handover request on this date at {conflictDetails.timeSlot}.</>
                          )}
                          {!conflictDetails.conflictType && (
                            <>This faculty member already has a {conflictDetails.isHandover ? 'handover' : 'class'} scheduled for {conflictDetails.subject || 'Unknown'} ({conflictDetails.course || 'Unknown'}) on {conflictDetails.day} at {conflictDetails.timeSlot}.</>
                          )}
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          Please select a different faculty member or time slot.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                disabled={loading || hasConflict}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : 'Submit Handover Request'}
              </Button>
            </div>
          </form>
        </Card>
      )}
      
      {activeTab === 'history' && (
        <Card className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-xl font-semibold">Handover History</h2>
            
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <span className="text-sm text-gray-500">Filter by status:</span>
              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
          
          {loadingHistory ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {statusFilter === 'All' 
                ? 'No handover requests found' 
                : `No ${statusFilter.toLowerCase()} handover requests found`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slot</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Substitute</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((handover) => (
                    <tr key={handover._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatDate(handover.dateOfClass)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {handover.timeSlot}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {handover.subject}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {handover.course}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {handover.substituteName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {getStatusBadge(handover.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      </main>
    </div>
  );
}
