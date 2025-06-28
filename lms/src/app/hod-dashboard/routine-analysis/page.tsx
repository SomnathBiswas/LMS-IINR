'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FaPlus, FaTrash, FaRegCalendarAlt, FaUserAlt, FaChalkboardTeacher } from 'react-icons/fa';
import { useNotifications } from '@/contexts/NotificationContext';
import { subjectsList } from '@/data/subjects-data';

// Define types for our routine data
interface RoutineEntry {
  id: string;
  day: string;
  timeSlot: string;
  subject: string;
  roomNumber: string;
  department: string;
}

interface Faculty {
  _id: string;
  name: string;
  department: string;
  email?: string;
  facultyId?: string;
}

export default function RoutineAnalysisPage() {
  // State for form inputs
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:50');
  const [subject, setSubject] = useState('Anatomy');
  const [roomNumber, setRoomNumber] = useState('101');
  const [department, setDepartment] = useState('BSc');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [routineType, setRoutineType] = useState('weekly');
  
  // Access notification context
  const { addNotification } = useNotifications();
  
  // State for routine entries and preview
  const [routineEntries, setRoutineEntries] = useState<RoutineEntry[]>([]);
  
  // State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [assignedFacultyName, setAssignedFacultyName] = useState('');
  
  // State for faculty members fetched from the database
  const [facultyMembers, setFacultyMembers] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch faculty members from the database
  useEffect(() => {
    const fetchFacultyMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/faculty/list');
        
        if (!response.ok) {
          throw new Error('Failed to fetch faculty members');
        }
        
        const data = await response.json();
        setFacultyMembers(data.facultyMembers || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching faculty members:', err);
        setError('Failed to load faculty members. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFacultyMembers();
  }, []);
  
  // Use the centralized subjects list
  const subjects = subjectsList;
  
  // Days and time slots
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  // We'll now dynamically generate the time slots from the routine entries instead of using predefined ones
  
  // Departments
  const departments = [
    'BSc (1st Sem)', 'BSc (2nd Sem)', 'BSc (3rd Sem)', 'BSc (4th Sem)', 'BSc (5th Sem)', 'BSc (6th Sem)', 'BSc (7th Sem)', 'BSc (8th Sem)',
    'GNM (1st Sem)', 'GNM (2nd Sem)', 'GNM (3rd Sem)', 'GNM (4th Sem)', 'GNM (5th Sem)', 'GNM (6th Sem)',
    'PBBSc (1st Sem)', 'PBBSc (2nd Sem)', 'PBBSc (3rd Sem)', 'PBBSc (4th Sem)', 'PBBSc (5th Sem)', 'PBBSc (6th Sem)', 'PBBSc (7th Sem)', 'PBBSc (8th Sem)'
  ];
  
  // Room numbers
  const roomNumbers = ['101', '102', '103', '201', '202', '203', '301', '302', '303'];
  
  // Function to add a new routine entry
  const addRoutineEntry = () => {
    const timeSlot = `${startTime}–${endTime}`;
    const newEntry: RoutineEntry = {
      id: Date.now().toString(),
      day,
      timeSlot,
      subject,
      roomNumber,
      department
    };
    
    setRoutineEntries([...routineEntries, newEntry]);
console.log('Adding new routine entry with department:', department);
  };
  
  // Function to remove a routine entry
  const removeRoutineEntry = (id: string) => {
    setRoutineEntries(routineEntries.filter(entry => entry.id !== id));
  };
  
  // State for tracking routine submission status
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Function to send routine to faculty
  const sendRoutineToFaculty = async () => {
    if (!selectedFaculty || routineEntries.length === 0) {
      alert('Please select a faculty member and add at least one routine entry.');
      return;
    }
    
    const faculty = facultyMembers.find(f => f._id === selectedFaculty);
    if (!faculty) return;
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      // Prepare the data to send to the API
      const routineData = {
        facultyId: selectedFaculty,
        routineType,
        entries: routineEntries
      };
      
      // Send the routine data to the API
      const response = await fetch('/api/routines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routineData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save routine');
      }
      
      // Show success message
      setAssignedFacultyName(faculty.name);
      setShowSuccessModal(true);
      
      // Add notification for the routine assignment
      addNotification({
        title: `New routine sent to ${faculty.name}`,
        description: `A new ${routineType} routine has been assigned with ${routineEntries.length} entries.`,
        type: 'routine',
        isRead: false,
        relatedTo: faculty._id
      });
      
      console.log('Routine successfully sent to faculty:', {
        facultyId: selectedFaculty,
        facultyName: faculty.name,
        routineType,
        entries: routineEntries
      });
    } catch (error) {
      console.error('Error sending routine:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
      alert(`Failed to send routine: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Get a routine entry for a specific day and time slot
  const getRoutineEntryForCell = (day: string, timeSlot: string) => {
    return routineEntries.find(entry => entry.day === day && entry.timeSlot === timeSlot);
  };
  
  // Get the abbreviated day name
  const getAbbreviatedDay = (day: string) => {
    return day.substring(0, 3).toUpperCase();
  };

  // Format time slot to show AM/PM
  const formatTimeSlot = (timeSlot: string) => {
    if (!timeSlot) return '';
    
    const [startTime, endTime] = timeSlot.split('–');
    
    const formatTime = (time: string) => {
      if (!time) return '';
      
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    
    return `${formatTime(startTime)}–${formatTime(endTime)}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Routine Analysis</h1>
        <div className="flex gap-4">
          <Button 
            onClick={() => window.location.href = '/hod-dashboard/edit-routine'}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <FaChalkboardTeacher className="mr-2" /> Edit Routine
          </Button>
          <div className="flex items-center">
            <span className="mr-2">Routine Type:</span>
            <select
              className="border rounded-md px-3 py-2"
              value={routineType}
              onChange={(e) => setRoutineType(e.target.value)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <select
            className="border rounded-md px-3 py-2"
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            disabled={loading}
          >
            <option value="">Select Faculty Member</option>
            {loading ? (
              <option value="" disabled>Loading faculty members...</option>
            ) : error ? (
              <option value="" disabled>Error loading faculty members</option>
            ) : facultyMembers.length === 0 ? (
              <option value="" disabled>No faculty members found</option>
            ) : (
              facultyMembers.map((faculty) => (
                <option key={faculty._id} value={faculty._id}>
                  {faculty.name} {faculty.department ? `- ${faculty.department}` : ''}
                </option>
              ))
            )}
          </select>
          <Button 
            onClick={sendRoutineToFaculty}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!selectedFaculty || routineEntries.length === 0 || submitting}
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : 'Send Routine'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        <Card className="p-6 col-span-1">
          <h2 className="text-xl font-semibold mb-4">Create Routine Entry</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    className="w-full border rounded-md px-3 py-2"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <span className="text-gray-500">to</span>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">End Time</label>
                  <input
                    type="time"
                    className="w-full border rounded-md px-3 py-2"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              >
                {roomNumbers.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <Button 
              onClick={addRoutineEntry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
            >
              <FaPlus className="mr-2" /> Add Entry
            </Button>
          </div>
          
          {/* Current Entries */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-3">Current Entries</h3>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {routineEntries.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No entries added yet</p>
                ) : (
                  routineEntries.map((entry) => (
                    <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <div className="font-medium">{entry.day}, {entry.timeSlot}</div>
                        <div className="text-sm text-gray-600">{entry.subject} | Room {entry.roomNumber}</div>
                        <Badge variant="outline">{entry.department}</Badge>
                      </div>
                      <button 
                        onClick={() => removeRoutineEntry(entry.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </Card>
        
        {/* Routine Preview Grid */}
        <Card className="col-span-1 lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Routine Preview</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="p-6">
              <div className="grid grid-cols-8 gap-0">
                {/* Time column */}
                <div className="col-span-1">
                  <div className="h-12"></div> {/* Empty cell for alignment */}
                  {/* Get unique time slots from routine entries */}
                  {[...new Set(routineEntries.map(entry => entry.timeSlot))].sort().map((time) => (
                    <div key={time} className="h-28 flex items-center justify-center text-sm text-gray-600 font-medium">
                      {formatTimeSlot(time)}
                    </div>
                  ))}
                </div>

                {/* Days columns */}
                {days.map((day) => (
                  <div key={day} className="col-span-1">
                    <div className="h-14 flex items-center justify-center font-bold text-indigo-700 bg-indigo-50 border-b mb-0">
                      {getAbbreviatedDay(day)}
                    </div>
                    {/* Get unique time slots from routine entries */}
                    {[...new Set(routineEntries.map(entry => entry.timeSlot))].sort().map((time) => {
                      const entry = getRoutineEntryForCell(day, time);
                      return (
                        <div key={`${day}-${time}`} className="h-28 p-2 border hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-blue-50">
                          {entry && (
                            <div className="h-full flex flex-col gap-1">
                              <div className="font-medium text-sm text-indigo-700">{entry.subject}</div>
                              <div className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1 inline-block">R-{entry.roomNumber}</div>
                              <Badge variant="outline" className="text-xs bg-white/50">{entry.department}</Badge>
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
      </div>
      
      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Routine Assignment Successful</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-center text-gray-700">
              Routine successfully uploaded and assigned to <span className="font-semibold">{assignedFacultyName}</span>.
            </p>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowSuccessModal(false);
                // Clear the form after successful assignment
                setRoutineEntries([]);
                setSelectedFaculty('');
              }}
              className="w-full"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
