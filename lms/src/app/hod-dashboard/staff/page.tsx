'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import { FaSearch, FaFilter, FaEnvelope, FaPhone, FaUpload, FaTimes, FaEllipsisV, FaBars, FaTh } from 'react-icons/fa';
import { subjectsList } from '@/data/subjects-data';

interface Staff {
  _id: string;
  name: string;
  role: string;
  department?: string;
  subjects?: string[];
  subjectsKnown?: string[]; // Added for handover matching
  profilePicture?: string;
  status?: 'Full-time' | 'Guest' | 'On-Probation';
  email?: string;
  phone?: string;
  facultyId?: string;
}

export default function StaffOverview() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [layout, setLayout] = useState('grid');
  const [currentStep, setCurrentStep] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [editedStaff, setEditedStaff] = useState<Staff | null>(null);
  
  // Use the centralized subjects list
  const subjects = subjectsList;
  
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    profilePhoto: null as File | null,
    role: '',
    department: '',
    subjects: [] as string[],
    subjectsKnown: [] as string[], // Added for handover matching
    status: 'Full-time'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // State for faculty data
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if the current user is HOD
  const isHOD = user?.role === 'HOD';
  
  // Fetch faculty data from the database
  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/faculty/all');
        
        if (!response.ok) {
          throw new Error('Failed to fetch faculty data');
        }
        
        const data = await response.json();
        setStaffList(data.facultyMembers || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching faculty data:', err);
        setError('Failed to load faculty data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFacultyData();
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or subject..."
              className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <FaSearch className="text-gray-400" />
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50">
            <FaFilter className="text-gray-500" />
            <span>Filter</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayout('grid')}
            className={`p-2 rounded ${layout === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            <FaTh />
          </button>
          <button
            onClick={() => setLayout('row')}
            className={`p-2 rounded ${layout === 'row' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            <FaBars />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div>
          {layout === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {staffList
                .filter(staff =>
                  staff.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  staff.subjects?.some(subject =>
                    subject.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                )
                .map(staff => (
                  <div key={staff._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="relative w-12 h-12 overflow-hidden rounded-full border-2 border-gray-200" style={{ borderRadius: '50%' }}>
                          {staff.profilePicture ? (
                            <Image
                              src={staff.profilePicture}
                              alt={staff.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                              {staff.name ? staff.name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase() : 'FA'}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{staff.name}</h3>
                          <p className="text-sm text-gray-600">{staff.role || 'Faculty'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          staff.status === 'Full-time' ? 'bg-green-100 text-green-600' :
                          staff.status === 'Guest' ? 'bg-orange-100 text-orange-600' :
                          staff.status ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {staff.status || 'Active'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <FaEnvelope size={14} className="text-gray-500 inline-block" />
                        <span>{staff.email || 'N/A'}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <FaPhone size={12} />
                        <span>{staff.phone || 'N/A'}</span>
                      </div>
                    </div>
    
                  <div className="mt-4">
                    {staff.subjects && staff.subjects.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">Subjects</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {staff.subjects.map(subject => (
                            <span
                              key={subject}
                              className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {staffList
                .filter(staff =>
                  staff.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  staff.subjects?.some(subject =>
                    subject.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                )
                .map(staff => (
                  <div key={staff._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow flex items-center space-x-6">
                    <div className="relative w-12 h-12 overflow-hidden rounded-full border-2 border-gray-200 flex-shrink-0">
                      {staff.profilePicture ? (
                        <Image
                          src={staff.profilePicture}
                          alt={staff.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {staff.name ? staff.name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase() : 'FA'}
                        </div>
                      )}
                    </div>
    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{staff.name}</p>
                      <p className="text-sm text-gray-600">{staff.role || 'Faculty'}</p>
                    </div>
    
                    <div className="flex-1 min-w-0">
                      {staff.subjects && staff.subjects.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">Subjects</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {staff.subjects.slice(0, 2).map(subject => (
                              <span key={subject} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {subject}
                              </span>
                            ))}
                            {staff.subjects.length > 2 && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                +{staff.subjects.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
    
                    <div className="flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded ${
                        staff.status === 'Full-time' ? 'bg-green-100 text-green-600' :
                        staff.status === 'Guest' ? 'bg-orange-100 text-orange-600' :
                        staff.status ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {staff.status || 'Active'}
                      </span>
                    </div>
    
                    <div className="flex-shrink-0 flex items-center gap-4">
                      {staff.email && (
                        <a href={`mailto:${staff.email}`} className="text-gray-600 hover:text-blue-500 transition-colors">
                          <FaEnvelope />
                        </a>
                      )}
                      {staff.phone && (
                        <a href={`tel:${staff.phone}`} className="text-gray-600 hover:text-blue-500 transition-colors">
                          <FaPhone />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* View Profile Modal - Removed as requested */}
      {false && (
        <div></div>
      )}

      {/* Edit Info Modal */}
      {showEditInfoModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">Edit Faculty Information</h2>
              <button 
                onClick={() => setShowEditInfoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Basic Information</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editedStaff?.name || ''}
                      onChange={(e) => editedStaff && setEditedStaff({...editedStaff, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editedStaff?.email || ''}
                      onChange={(e) => editedStaff && setEditedStaff({...editedStaff, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="tel" 
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editedStaff?.phone || ''}
                      onChange={(e) => editedStaff && setEditedStaff({...editedStaff, phone: e.target.value})}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Photo
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16 overflow-hidden rounded-full border-2 border-gray-200" style={{ borderRadius: '50%' }}>
                        {editedStaff?.profilePicture ? (
                          <Image
                            src={editedStaff.profilePicture}
                            alt={editedStaff?.name || ''}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {editedStaff?.name ? editedStaff.name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase() : 'FA'}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => editFileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <FaUpload size={14} />
                        <span>Change Photo</span>
                      </button>
                      <input 
                        type="file" 
                        ref={editFileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0] && editedStaff) {
                            // In a real app, you'd upload this to a server and get a URL back
                            // For demo purposes, we'll use a placeholder URL
                            setEditedStaff({...editedStaff, profilePicture: URL.createObjectURL(e.target.files[0])})
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Professional Information */}
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Professional Information</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editedStaff?.role || ''}
                      onChange={(e) => editedStaff && setEditedStaff({...editedStaff, role: e.target.value})}
                    >
                      <option value="Professor">Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Senior Lecturer">Senior Lecturer</option>
                      <option value="Lecturer">Lecturer</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editedStaff?.department || ''}
                      onChange={(e) => editedStaff && setEditedStaff({...editedStaff, department: e.target.value})}
                    >
                      <option value="Nursing">Nursing</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Paramedical">Paramedical</option>
                      <option value="Radiology">Radiology</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employment Status <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editedStaff?.status || ''}
                      onChange={(e) => editedStaff && setEditedStaff({...editedStaff, status: e.target.value as 'Full-time' | 'Guest' | 'On-Probation'})}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Guest">Guest</option>
                      <option value="On-Probation">On Probation</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teaching Subjects
                    </label>
                    <div className="border rounded p-3 min-h-[100px]">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editedStaff?.subjects?.map((subject, index) => (
                          <div key={index} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                            <span>{subject}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                if (editedStaff) {
                                  const updatedSubjects = [...(editedStaff.subjects || [])];
                                  updatedSubjects.splice(index, 1);
                                  setEditedStaff({...editedStaff, subjects: updatedSubjects});
                                }
                              }}
                              className="text-blue-400 hover:text-blue-600"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex">
                        <select
                          className="w-full p-2 border-t mt-2 pt-2 focus:outline-none"
                          onChange={(e) => {
                            if (e.target.value && editedStaff) {
                              const newSubject = e.target.value;
                              if (newSubject && !(editedStaff.subjects || []).includes(newSubject)) {
                                setEditedStaff({
                                  ...editedStaff, 
                                  subjects: [...(editedStaff.subjects || []), newSubject]
                                });
                              }
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">Select a subject to add</option>
                          {subjects.map((subject) => (
                            <option 
                              key={subject} 
                              value={subject}
                              disabled={(editedStaff?.subjects || []).includes(subject)}
                            >
                              {subject}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subjects Known (for handovers)
                    </label>
                    <div className="border rounded p-3 min-h-[100px]">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editedStaff?.subjectsKnown?.map((subject, index) => (
                          <div key={index} className="bg-green-50 text-green-600 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                            <span>{subject}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                if (editedStaff) {
                                  const updatedSubjects = [...(editedStaff.subjectsKnown || [])];
                                  updatedSubjects.splice(index, 1);
                                  setEditedStaff({...editedStaff, subjectsKnown: updatedSubjects});
                                }
                              }}
                              className="text-green-400 hover:text-green-600"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex">
                        <select
                          className="w-full p-2 border-t mt-2 pt-2 focus:outline-none"
                          onChange={(e) => {
                            if (e.target.value && editedStaff) {
                              const newSubject = e.target.value;
                              if (newSubject && !(editedStaff.subjectsKnown || []).includes(newSubject)) {
                                setEditedStaff({
                                  ...editedStaff, 
                                  subjectsKnown: [...(editedStaff.subjectsKnown || []), newSubject]
                                });
                              }
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">Select a subject expertise to add</option>
                          {subjects.map((subject) => (
                            <option 
                              key={subject} 
                              value={subject}
                              disabled={(editedStaff?.subjectsKnown || []).includes(subject)}
                            >
                              {subject}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditInfoModal(false);
                  setSelectedStaff(null);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editedStaff && selectedStaff) {
                    // Update the staff in the staffList
                    const updatedStaffList = staffList.map(staff => 
                      staff._id === selectedStaff._id ? editedStaff : staff
                    );
                    setStaffList(updatedStaffList);
                    
                    // Show a success message (in a real app)
                    alert('Staff information updated successfully!');
                    
                    // Close the modal
                    setShowEditInfoModal(false);
                    setSelectedStaff(null);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Add New Staff</h2>
              <button 
                onClick={() => setShowAddStaffModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Steps Indicator */}
              <div className="flex justify-between mb-8">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {step}
                    </div>
                    <span className="text-sm mt-2 text-gray-600">
                      {step === 1 ? 'Basic Info' : 
                       step === 2 ? 'Professional' : 
                       step === 3 ? 'Subjects' : 'Access & Review'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="Enter full name"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newStaff.fullName}
                        onChange={(e) => setNewStaff({...newStaff, fullName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile Photo
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                          {newStaff.profilePhoto ? (
                            <img 
                              src={URL.createObjectURL(newStaff.profilePhoto as Blob)} 
                              alt="Profile" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300">
                              <span className="text-gray-600 text-xs">Photo</span>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center space-x-2"
                        >
                          <FaUpload size={14} />
                          <span>Upload</span>
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setNewStaff({...newStaff, profilePhoto: e.target.files[0]})
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="email" 
                        placeholder="name@university.edu"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newStaff.email}
                        onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="tel" 
                        placeholder="e.g. +91 99999 99999"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newStaff.phone}
                        onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select 
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newStaff.gender}
                        onChange={(e) => setNewStaff({...newStaff, gender: e.target.value})}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date" 
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newStaff.dateOfBirth}
                        onChange={(e) => setNewStaff({...newStaff, dateOfBirth: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-end">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-4 py-2 border rounded mr-4 hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}
                {currentStep < 4 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // Handle form submission
                      setShowAddStaffModal(false);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
