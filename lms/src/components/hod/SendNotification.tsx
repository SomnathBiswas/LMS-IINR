'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { toast } from 'react-hot-toast';
import { Upload, X, FileText, Calendar, Clock, Send } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Faculty {
  _id: string;
  name: string;
  email: string;
  facultyId: string;
  department?: string;
}

interface NotificationFormData {
  title: string;
  type: 'Meeting' | 'Exam' | 'Holiday' | 'Circular' | 'Others';
  description: string;
  sendToAll: boolean;
  selectedFaculty: string[];
  scheduledFor: Date | null;
  attachments: File[];
}

export default function SendNotification() {
  const { user } = useUser();
  const { addNotification } = useNotifications();
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    type: 'Meeting',
    description: '',
    sendToAll: true,
    selectedFaculty: [],
    scheduledFor: null,
    attachments: []
  });

  useEffect(() => {
    fetchFacultyMembers();
  }, []);

  const fetchFacultyMembers = async () => {
    try {
      const response = await fetch('/api/faculty/list');
      if (!response.ok) {
        throw new Error('Failed to fetch faculty members');
      }
      const data = await response.json();
      setFacultyList(data.facultyMembers || []);
      console.log('Faculty members loaded:', data.facultyMembers);
    } catch (error) {
      console.error('Error fetching faculty members:', error);
      toast.error('Failed to load faculty members');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleFacultySelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, selectedFaculty: selectedOptions }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, scheduledFor: date }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...filesArray] }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    
    if (!formData.sendToAll && formData.selectedFaculty.length === 0) {
      toast.error('Please select at least one faculty member');
      return;
    }

    setLoading(true);
    
    try {
      // Create FormData object for file uploads
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('sendToAll', String(formData.sendToAll));
      
      if (!formData.sendToAll) {
        formData.selectedFaculty.forEach(id => {
          formDataToSend.append('selectedFaculty', id);
        });
      }
      
      if (formData.scheduledFor) {
        formDataToSend.append('scheduledFor', formData.scheduledFor.toISOString());
      }
      
      formData.attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });
      
      formDataToSend.append('hodId', user?._id || '');
      formDataToSend.append('hodName', user?.name || '');
      formDataToSend.append('department', user?.department || '');
      
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        body: formDataToSend,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send notification');
      }
      
      toast.success('Notification successfully sent');
      
      // Add to notification system
      const recipients = formData.sendToAll ? 'All Faculty' : 
        formData.selectedFaculty.map(id => {
          const faculty = facultyList.find(f => f._id === id);
          return faculty ? faculty.name : '';
        }).filter(Boolean).join(', ');
      
      addNotification({
        title: `New official notification published`,
        description: `${formData.title} - Published for ${recipients}`,
        type: 'announcement',
        isRead: false
      });
      
      // Reset form
      setFormData({
        title: '',
        type: 'Meeting',
        description: '',
        sendToAll: true,
        selectedFaculty: [],
        scheduledFor: null,
        attachments: []
      });
      
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Send Official Announcement</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title of Notification
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Urgent Staff Meeting, Midterm Exam Schedule"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          
          {/* Notification Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Notification Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Meeting">Meeting</option>
              <option value="Exam">Exam</option>
              <option value="Holiday">Holiday</option>
              <option value="Circular">Circular</option>
              <option value="Others">Others</option>
            </select>
          </div>
          
          {/* Scheduled Date/Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule Notification
            </label>
            <div className="flex items-center">
              <DatePicker
                selected={formData.scheduledFor}
                onChange={handleDateChange}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Schedule for later (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {formData.scheduledFor && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, scheduledFor: null }))}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave blank to send immediately</p>
          </div>
          
          {/* Description */}
          <div className="col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Description / Message
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter the details of your announcement here..."
              required
            ></textarea>
          </div>
          
          {/* File Attachments */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Supporting Documents
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                    <span>Upload files</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, PNG, JPG, DOCX up to 10MB each
                </p>
              </div>
            </div>
            
            {/* File List */}
            {formData.attachments.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700">Attached Files:</h4>
                <ul className="mt-2 divide-y divide-gray-200">
                  {formData.attachments.map((file, index) => (
                    <li key={index} className="py-2 flex justify-between items-center">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-800">{file.name}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Recipients */}
          <div className="col-span-2">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="sendToAll"
                name="sendToAll"
                checked={formData.sendToAll}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="sendToAll" className="ml-2 block text-sm text-gray-700">
                Send to All Faculty
              </label>
            </div>
            
            {!formData.sendToAll && (
              <div>
                <label htmlFor="selectedFaculty" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Recipients
                </label>
                <select
                  id="selectedFaculty"
                  name="selectedFaculty"
                  multiple
                  value={formData.selectedFaculty}
                  onChange={handleFacultySelection}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  size={5}
                >
                  {facultyList.map(faculty => (
                    <option key={faculty._id} value={faculty._id}>
                      {faculty.name} ({faculty.facultyId})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple faculty members</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                {formData.scheduledFor ? 'Schedule Notification' : 'Send Notification'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
