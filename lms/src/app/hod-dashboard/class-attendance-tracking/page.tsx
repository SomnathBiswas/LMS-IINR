"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { format, addMinutes, isValid } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Check,
  AlertCircle,
  Filter,
  X,
  UserCheck,
  Loader2,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

// Types
interface FacultyClass {
  id: string;
  _id?: string | object;
  parentRoutineId?: string;
  originalEntryId?: string;
  facultyId: string;
  facultyName: string;
  subject: string;
  department: string;
  course: string;
  startTime: Date;
  endTime: Date;
  roomNumber: string;
  status: 'upcoming' | 'window-open' | 'taken' | 'missed';
  attendanceStatus?: string;
  attendanceMarkedAt?: Date | string;
  absentStudents?: string[];
}

const parseTimeString = (timeStr: string): [number, number] => {
  if (!timeStr || typeof timeStr !== 'string') {
    return [9, 0];
  }
  timeStr = timeStr.trim().toUpperCase();
  let period = '';
  if (timeStr.includes('AM')) {
    period = 'AM';
    timeStr = timeStr.replace('AM', '').trim();
  } else if (timeStr.includes('PM')) {
    period = 'PM';
    timeStr = timeStr.replace('PM', '').trim();
  }
  let hours = 0;
  let minutes = 0;
  if (timeStr.includes(':')) {
    [hours, minutes] = timeStr.split(':').map(part => parseInt(part.trim()) || 0);
  } else if (timeStr.includes('.')) {
    [hours, minutes] = timeStr.split('.').map(part => parseInt(part.trim()) || 0);
  } else {
    hours = parseInt(timeStr) || 0;
    minutes = 0;
  }
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  hours = Math.max(0, Math.min(23, hours));
  minutes = Math.max(0, Math.min(59, minutes));
  return [hours, minutes];
};

const formatRoutineToClass = (routine: any, faculty: any): FacultyClass => {
  const timeSlot = routine.timeSlot || routine.time || (routine.startTime && routine.endTime ? `${routine.startTime} - ${routine.endTime}` : '09:00 AM - 10:00 AM');
  let [startTimeStr, endTimeStr] = timeSlot.split(/–|-|to/).map((t: string) => t.trim());

  const now = new Date();
  const [startHours, startMinutes] = parseTimeString(startTimeStr);
  const [endHours, endMinutes] = parseTimeString(endTimeStr);
  
  const startTime = new Date(now);
  startTime.setHours(startHours, startMinutes, 0, 0);
  
  const endTime = new Date(now);
  endTime.setHours(endHours, endMinutes, 0, 0);
  
  const facultyName = faculty?.name || routine.facultyName || 'Unknown Faculty';
  const subject = routine.subject || 'Unknown Subject';
  const department = routine.department;
  const course = routine.department;
  const roomNumber = routine.roomNumber || '';
  const facultyId = faculty?._id?.toString() || routine.facultyId?.toString() || `faculty-${Math.random()}`;

  return {
    id: routine._id?.toString() || `class-${Math.random()}`,
    _id: routine._id,
    parentRoutineId: routine.parentRoutineId,
    originalEntryId: routine.originalEntryId,
    facultyId: facultyId,
    facultyName: facultyName,
    subject: subject,
    department: department,
    course: course,
    startTime: startTime,
    endTime: endTime,
    roomNumber: roomNumber,
    status: (routine.status || routine.attendanceStatus || 'upcoming').toLowerCase(),
    attendanceStatus: (routine.attendanceStatus || routine.status)?.toLowerCase(),
    attendanceMarkedAt: routine.attendanceMarkedAt,
    absentStudents: routine.absentStudents || [],
  };
};

const updateClassStatuses = (now: Date, classesToUpdate: FacultyClass[]) => {
  return classesToUpdate.map(cls => {
    if (cls.status === 'taken') return cls;
    
    const end = new Date(cls.endTime);
    const windowEnd = addMinutes(end, 30);
    
    let newStatus: FacultyClass['status'] = 'upcoming';
    if (now > windowEnd) {
      newStatus = 'missed';
    } else if (now >= end) {
      newStatus = 'window-open';
    }
    
    return { ...cls, status: newStatus };
  });
};

export default function ClassAttendanceTrackingPage() {
  const [classes, setClasses] = useState<FacultyClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [facultyFilter, setFacultyFilter] = useState('All Faculty');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [availableDepartments, setAvailableDepartments] = useState<string[]>(['All Departments']);
  const [availableFaculty, setAvailableFaculty] = useState<string[]>(['All Faculty']);
  const [selectedClass, setSelectedClass] = useState<FacultyClass | null>(null);
  const [absentStudentNames, setAbsentStudentNames] = useState<string[]>([]);
  const [newAbsentStudent, setNewAbsentStudent] = useState<string>('');
  const [showAbsentList, setShowAbsentList] = useState<boolean>(false);
  const [selectedClassForAbsentList, setSelectedClassForAbsentList] = useState<FacultyClass | null>(null);
  const [markingOption, setMarkingOption] = useState<'all-present' | 'mark-absent'>('all-present');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info'; }>({ show: false, message: '', type: 'info' });
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const dateToFetch = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const apiUrl = `/api/hod/class-attendance-tracking?date=${dateToFetch}&t=${new Date().getTime()}`;
      const response = await fetch(apiUrl, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || !Array.isArray(data.classes)) {
        throw new Error('Invalid data format');
      }

      const processedClasses = data.classes.map((cls: any) => {
        const faculty = data.faculties?.find((f: any) => f._id.toString() === (cls.facultyId || '').toString());
        return formatRoutineToClass(cls, faculty);
      });

      const now = new Date();
      const classesWithUpdatedStatus = updateClassStatuses(now, processedClasses);
      
      setClasses(classesWithUpdatedStatus);
      
      const departments = ['All Departments', ...new Set(classesWithUpdatedStatus.map(cls => cls.department))];
      const facultyNames = ['All Faculty', ...new Set(classesWithUpdatedStatus.map(cls => cls.facultyName))];
      
      setAvailableDepartments(departments);
      setAvailableFaculty(facultyNames);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching classes:', error);
      setNotification({ show: true, message: `Error: ${error instanceof Error ? error.message : 'Failed to fetch data'}`, type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleRefresh = () => {
    fetchClasses();
  };

  const handleOpenAttendanceDialog = (cls: FacultyClass) => {
    setSelectedClass(cls);
    setAbsentStudentNames([]);
    setMarkingOption('all-present');
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
    if (!selectedClass) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/hod/class-attendance-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: selectedClass.facultyId,
          routineId: selectedClass.parentRoutineId,
          entryId: selectedClass.originalEntryId,
          date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
          status: 'taken',
          absentStudents: markingOption === 'mark-absent' ? absentStudentNames : [],
          subject: selectedClass.subject,
          facultyName: selectedClass.facultyName,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit attendance');
      }
      
      setNotification({ show: true, message: `Attendance marked for ${selectedClass.subject}`, type: 'success' });
      fetchClasses(); // Refresh data after submission
    } catch (error) {
      console.error('Error marking attendance:', error);
      setNotification({ show: true, message: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`, type: 'error' });
    } finally {
      setSubmitting(false);
      setSelectedClass(null);
    }
  };

  const handleOpenAbsentList = (cls: FacultyClass) => {
    setSelectedClassForAbsentList(cls);
    setShowAbsentList(true);
  };

  const filteredClasses = classes.filter(cls => 
    (departmentFilter === 'All Departments' || cls.department === departmentFilter) &&
    (facultyFilter === 'All Faculty' || cls.facultyName === facultyFilter) &&
    (statusFilter === 'All Statuses' || cls.status === statusFilter.toLowerCase())
  );

  const formatStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'window-open': return 'bg-green-100 text-green-800';
      case 'taken': return 'bg-gray-100 text-gray-800';
      case 'missed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Class Attendance Tracking</h1>
          <p className="text-gray-600">Monitor and manage faculty class attendance</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing} className="flex items-center gap-2">
          {refreshing ? <><Loader2 className="h-4 w-4 animate-spin" /> Refreshing...</> : 'Refresh'}
        </Button>
      </div>
      {lastUpdated && <p className="text-sm text-gray-500 mb-4">Last updated: {format(lastUpdated, 'MMM d, yyyy h:mm a')}</p>}
      {notification.show && <div className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`}>{notification.message}</div>}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2"><Filter className="h-4 w-4" /> <span className="font-medium">Filters:</span></div>
          <div className="flex-1 min-w-[200px]">
            <select className="w-full p-2 border rounded-md" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
              {availableDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <select className="w-full p-2 border rounded-md" value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)}>
              {availableFaculty.map(faculty => <option key={faculty} value={faculty}>{faculty}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <select className="w-full p-2 border rounded-md" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All Statuses</option>
              <option>Upcoming</option>
              <option>Window Open</option>
              <option>Taken</option>
              <option>Missed</option>
            </select>
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading classes...</span></div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center p-12"><p className="text-gray-500">No classes found matching your filters.</p></div>
        ) : (
          <ScrollArea className="h-[60vh]">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left font-medium">Faculty</th>
                  <th className="p-3 text-left font-medium">Subject</th>
                  <th className="p-3 text-left font-medium">Department</th>
                  <th className="p-3 text-left font-medium">Time</th>
                  <th className="p-3 text-left font-medium">Room</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map(cls => (
                  <tr key={cls.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{cls.facultyName}</td>
                    <td className="p-3">{cls.subject}</td>
                    <td className="p-3">{cls.department}</td>
                    <td className="p-3"><span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{isValid(cls.startTime) ? format(cls.startTime, 'h:mm a') : 'N/A'} - {isValid(cls.endTime) ? format(cls.endTime, 'h:mm a') : 'N/A'}</span></td>
                    <td className="p-3">{cls.roomNumber}</td>
                    <td className="p-3"><Badge className={getStatusColor(cls.status)}>{formatStatusLabel(cls.status)}</Badge></td>
                    <td className="p-3">
                      {cls.status === 'window-open' || cls.status === 'missed' ? (
                        <Button size="sm" onClick={() => handleOpenAttendanceDialog(cls)} className="flex items-center gap-1">
                          <Check className="h-4 w-4" /> Mark {cls.status === 'missed' && 'Late'}
                        </Button>
                      ) : cls.status === 'taken' ? (
                        cls.absentStudents && cls.absentStudents.length > 0 ? (
                          <Button size="sm" variant="outline" onClick={() => handleOpenAbsentList(cls)}>Absent List</Button>
                        ) : (
                          <span className="text-green-600 flex items-center gap-1"><Check className="h-4 w-4" /> Marked</span>
                        )
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </Card>
      {selectedClass && (
        <DialogPrimitive.Root open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
              <DialogPrimitive.Title className="text-xl font-semibold mb-2">Mark Attendance</DialogPrimitive.Title>
              <div className="text-gray-600 mb-4">
                <p>{selectedClass.subject} by {selectedClass.facultyName}</p>
                <div className="text-sm">{format(selectedClass.startTime, 'h:mm a')} - {format(selectedClass.endTime, 'h:mm a')}</div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className={`flex-1 p-3 border rounded-md cursor-pointer ${markingOption === 'all-present' ? 'border-blue-500 bg-blue-50' : ''}`} onClick={() => setMarkingOption('all-present')}>
                    <div className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-blue-600" /> <span className="font-medium">All Present</span></div>
                    <p className="text-sm text-gray-600 mt-1">Mark all students as present</p>
                  </div>
                  <div className={`flex-1 p-3 border rounded-md cursor-pointer ${markingOption === 'mark-absent' ? 'border-blue-500 bg-blue-50' : ''}`} onClick={() => setMarkingOption('mark-absent')}>
                    <div className="flex items-center gap-2"><X className="h-5 w-5 text-red-600" /> <span className="font-medium">Mark Absent</span></div>
                    <p className="text-sm text-gray-600 mt-1">Specify absent students</p>
                  </div>
                </div>
                {markingOption === 'mark-absent' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 p-2 border rounded-md" placeholder="Enter student name" value={newAbsentStudent} onChange={e => setNewAbsentStudent(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddAbsentStudent()} />
                      <Button onClick={handleAddAbsentStudent}>Add</Button>
                    </div>
                    {absentStudentNames.length > 0 ? (
                      <div className="border rounded-md p-2">
                        <p className="text-sm font-medium mb-2">Absent Students:</p>
                        <ul className="space-y-1">
                          {absentStudentNames.map((name, index) => (
                            <li key={index} className="flex justify-between items-center text-sm p-1 bg-gray-50 rounded">{name} <button onClick={() => handleRemoveAbsentStudent(index)} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button></li>
                          ))}
                        </ul>
                      </div>
                    ) : <p className="text-sm text-gray-500">No absent students added yet.</p>}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <DialogPrimitive.Close asChild><Button variant="outline">Cancel</Button></DialogPrimitive.Close>
                <Button onClick={handleSubmitAttendance} disabled={submitting}>{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : 'Submit Attendance'}</Button>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
      {showAbsentList && selectedClassForAbsentList && (
        <DialogPrimitive.Root open={showAbsentList} onOpenChange={setShowAbsentList}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
              <DialogPrimitive.Title className="text-xl font-semibold mb-2">Absent Students</DialogPrimitive.Title>
              <div className="text-gray-600 mb-4">
                <p>{selectedClassForAbsentList.subject} by {selectedClassForAbsentList.facultyName}</p>
                <div className="text-sm">{format(selectedClassForAbsentList.startTime, 'h:mm a')} - {format(selectedClassForAbsentList.endTime, 'h:mm a')}</div>
              </div>
              <div className="space-y-3">
                {selectedClassForAbsentList.absentStudents && selectedClassForAbsentList.absentStudents.length > 0 ? (
                  <div className="border rounded-md p-2">
                    <ul className="space-y-1">
                      {selectedClassForAbsentList.absentStudents.map((name, index) => <li key={index} className="flex justify-between items-center text-sm p-1 bg-gray-50 rounded">{name}</li>)}
                    </ul>
                  </div>
                ) : <p className="text-sm text-gray-500">No absent students recorded for this class.</p>}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <DialogPrimitive.Close asChild><Button variant="outline">Close</Button></DialogPrimitive.Close>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </div>
  );
}
