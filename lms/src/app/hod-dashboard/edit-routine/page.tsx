'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FaPlus, FaTrash, FaRegCalendarAlt, FaUserAlt, FaChalkboardTeacher, FaHistory, FaEdit } from 'react-icons/fa';
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
  status?: string;
}

interface Faculty {
  _id: string;
  name: string;
  department: string;
  email?: string;
  facultyId?: string;
}

interface Routine {
  _id: string;
  facultyId: string;
  routineType: string;
  entries: RoutineEntry[];
  createdAt: string;
  updatedAt: string;
  version: number;
  isLatest: boolean;
}

export default function EditRoutinePage() {
  // State for faculty selection
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [facultyMembers, setFacultyMembers] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for routine data
  const [routineData, setRoutineData] = useState<Routine | null>(null);
  const [routineHistory, setRoutineHistory] = useState<any[]>([]);
  const [routineLoading, setRoutineLoading] = useState(false);
  
  // State for form inputs
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:50');
  const [subject, setSubject] = useState('Anatomy');
  const [roomNumber, setRoomNumber] = useState('101');
  const [department, setDepartment] = useState('BSc');
  const [routineType, setRoutineType] = useState('weekly');
  
  // State for routine entries and preview
  const [routineEntries, setRoutineEntries] = useState<RoutineEntry[]>([]);
  
  // State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Access notification context
  const { addNotification } = useNotifications();
  
  // Days and time slots
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Departments
  const departments = ['BSc', 'GNM', 'PBBSc', 'MSc'];
  
  // Room numbers
  const roomNumbers = ['101', '102', '103', '201', '202', '203', '301', '302', '303'];
  
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
  
  // Fetch routine data when faculty is selected
  useEffect(() => {
    const fetchRoutineData = async () => {
      if (!selectedFaculty) {
        setRoutineData(null);
        setRoutineEntries([]);
        return;
      }
      
      try {
        setRoutineLoading(true);
        const response = await fetch(`/api/routines?facultyId=${selectedFaculty}&includeHistory=true`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch routine data');
        }
        
        const data = await response.json();
        
        if (data.routine) {
          setRoutineData(data.routine);
          setRoutineEntries(data.routine.entries || []);
          setRoutineType(data.routine.routineType || 'weekly');
        } else {
          setRoutineData(null);
          setRoutineEntries([]);
        }
        
        setRoutineHistory(data.routineHistory || []);
        
      } catch (error) {
        console.error('Error fetching routine data:', error);
        setError('Failed to load routine data. Please try again later.');
      } finally {
        setRoutineLoading(false);
      }
    };
    
    fetchRoutineData();
  }, [selectedFaculty]);
  
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
  };
  
  // Function to remove a routine entry
  const removeRoutineEntry = (id: string) => {
    setRoutineEntries(routineEntries.filter(entry => entry.id !== id));
  };
  
  // State for tracking routine submission status
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Function to update routine for faculty
  const updateRoutineForFaculty = async () => {
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
      const routineUpdateData = {
        facultyId: selectedFaculty,
        routineType,
        entries: routineEntries,
        isUpdate: true,
        updateRoutineId: routineData?._id
      };
      
      // Send the routine data to the API
      const response = await fetch('/api/routines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routineUpdateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update routine');
      }
      
      const result = await response.json();
      
      // Show success message
      setSuccessMessage(`Routine updated and sent to ${faculty.name} (version ${result.version})`);
      setShowSuccessModal(true);
      
      // Add notification for the routine update
      addNotification({
        title: `Routine updated for ${faculty.name}`,
        description: `The routine has been updated with ${routineEntries.length} entries (version ${result.version}).`,
        type: 'routine',
        isRead: false,
        relatedTo: faculty._id
      });
      
    } catch (error) {
      console.error('Error updating routine:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
      alert(`Failed to update routine: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Function to load a specific routine version from history
  const loadRoutineVersion = async (routineId: string) => {
    try {
      setRoutineLoading(true);
      const response = await fetch(`/api/routines?routineId=${routineId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch routine version');
      }
      
      const data = await response.json();
      
      if (data.routine) {
        setRoutineEntries(data.routine.entries || []);
        setRoutineType(data.routine.routineType || 'weekly');
      }
      
    } catch (error) {
      console.error('Error fetching routine version:', error);
      setError('Failed to load routine version. Please try again later.');
    } finally {
      setRoutineLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Faculty Routine</h1>
        <div className="flex gap-4">
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
          <Button 
            onClick={updateRoutineForFaculty}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!selectedFaculty || routineEntries.length === 0 || submitting}
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : 'Update Routine'}
          </Button>
        </div>
      </div>
      
      {/* Display routine history if available */}
      {routineHistory.length > 0 && (
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <FaHistory className="mr-2" /> Routine History
          </h2>
          <div className="flex flex-wrap gap-2">
            {routineHistory.map((history) => (
              <Button
                key={history._id}
                variant="outline"
                size="sm"
                onClick={() => loadRoutineVersion(history._id)}
                className="flex items-center"
              >
                <span>Version {history.version || 1}</span>
                <span className="text-xs ml-2 text-gray-500">
                  ({new Date(history.createdAt).toLocaleDateString()})
                </span>
              </Button>
            ))}
          </div>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        <Card className="p-6 col-span-1">
          <h2 className="text-xl font-semibold mb-4">Edit Routine Entry</h2>
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
                {subjectsList.map((s) => (
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
            {selectedFaculty && facultyMembers.find(f => f._id === selectedFaculty) && (
              <p className="text-gray-600">
                Faculty: {facultyMembers.find(f => f._id === selectedFaculty)?.name}
              </p>
            )}
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
                    {[...new Set(routineEntries.map(entry => entry.timeSlot))].sort().map((time) => {
                      const entry = routineEntries.find(e => e.day === day && e.timeSlot === time);
                      return (
                        <div key={`${day}-${time}`} className="h-28 p-3 border hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-blue-50">
                          {entry && (
                            <div className="h-full flex flex-col gap-2">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-green-600">{successMessage}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
