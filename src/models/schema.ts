import { ObjectId } from 'mongodb';

export interface FacultyClass {
  id: string;
  subject: string;
  timeSlot: string;
  roomNo?: string;
  status: string;
  attendanceStatus?: string;
}

export interface RoutineEntry {
  _id?: string | ObjectId;
  id?: string;
  day?: string;
  subject: string;
  time?: string;
  timeSlot?: string;
  roomNo?: string;
  room?: string;
  status?: string;
  attendanceStatus?: string;
  handover?: boolean;
  handoverStatus?: string;
  originalFacultyName?: string;
  handoverDate?: string | Date;
  substituteName?: string;
}

export interface AttendanceRecord {
  _id?: string | ObjectId;
  facultyId?: string;
  routineId?: string;
  classId?: string;
  date?: string;
  status: string;
  subject?: string;
  timeSlot?: string;
  faculty?: { _id: string | ObjectId };
  createdAt?: string | Date;
  updatedAt?: string | Date;
  attendanceMarkedAt?: string | Date;
  absentStudents?: string[];
}

export interface Routine {
  _id?: string | ObjectId;
  facultyId?: string;
  entries?: RoutineEntry[];
  [key: string]: any;
}

export interface User {
    _id: string;
    name: string;
    role: string;
    department?: string;
    subjects?: string[];
    profilePicture?: string;
    status?: 'Full-time' | 'Guest' | 'On-Probation';
    email?: string;
    phone?: string;
    facultyId?: string;
}