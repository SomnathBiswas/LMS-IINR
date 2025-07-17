'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, Filter, Download, User, FileText } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { format } from 'date-fns';

interface HandoverRequest {
  _id: string;
  facultyId: string;
  facultyName: string;
  dateOfClass: string;
  timeSlot: string;
  subject: string;
  course: string;
  reason: string;
  substituteId: string;
  substituteName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface Faculty {
  _id: string;
  name: string;
  email: string;
  facultyId: string;
}

export default function HandoverRequestsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { addNotification } = useNotifications();
  const [handoverRequests, setHandoverRequests] = useState<HandoverRequest[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Selected handover for actions
  const [selectedHandover, setSelectedHandover] = useState<HandoverRequest | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'change' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [selectedSubstituteId, setSelectedSubstituteId] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  
  // Check if user is authenticated and is an HOD
  useEffect(() => {
    if (userLoading) return;
    
    if (!user) {
      router.push('/auth/signin?redirect=/hod-dashboard/handovers');
      return;
    }
    
    if (user.role !== 'HOD') {
      if (user.role === 'Faculty') {
        router.push('/faculty-dashboard');
      } else if (user.role === 'Student') {
        router.push('/student-dashboard');
      } else if (user.role === 'Admin') {
        router.push('/admin-dashboard');
      }
    }
  }, [user, userLoading, router]);
  
  // Fetch handover requests
  useEffect(() => {
    const fetchHandoverRequests = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Build query params for filters
        let queryParams = new URLSearchParams();
        if (statusFilter !== 'All') queryParams.append('status', statusFilter);
        if (dateFilter) queryParams.append('dateOfClass', dateFilter);
        if (subjectFilter) queryParams.append('subject', subjectFilter);
        
        const response = await fetch(`/api/handovers?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch handover requests');
        }
        
        const data = await response.json();
        setHandoverRequests(data.handovers || []);
      } catch (err) {
        console.error('Error fetching handover requests:', err);
        setError('Failed to load handover requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.role === 'HOD') {
      fetchHandoverRequests();
    }
  }, [user, statusFilter, dateFilter, facultyFilter, subjectFilter]);
  
  // Fetch faculty list for substitute selection
  useEffect(() => {
    const fetchFacultyList = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/faculty/list');
        
        if (!response.ok) {
          throw new Error('Failed to fetch faculty list');
        }
        
        const data = await response.json();
        setFacultyList(data.facultyMembers || []);
      } catch (err) {
        console.error('Error fetching faculty list:', err);
      }
    };
    
    if (user && user.role === 'HOD') {
      fetchFacultyList();
    }
  }, [user]);
  
  // Handle approve handover
  const handleApproveHandover = async () => {
    if (!selectedHandover) return;
    
    try {
      const response = await fetch(`/api/handovers/${selectedHandover._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'Approved',
          remarks: remarks
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve handover request');
      }
      
      // Update the local state
      setHandoverRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === selectedHandover._id 
            ? { ...request, status: 'Approved', remarks, updatedAt: new Date().toISOString() } 
            : request
        )
      );
      
      setSuccess('Handover request approved successfully');
      setShowActionDialog(false);
      setRemarks('');
      
      // Add notification for handover approval
      addNotification({
        title: `Handover request approved for ${selectedHandover.facultyName}`,
        description: `Class on ${selectedHandover.dateOfClass} at ${selectedHandover.timeSlot} will be handled by ${selectedHandover.substituteName}`,
        type: 'approval',
        isRead: false,
        relatedTo: selectedHandover.facultyId
      });
      
      // Notify the substitute faculty
      notifySubstituteFaculty(selectedHandover, 'Approved');
      
    } catch (err) {
      console.error('Error approving handover request:', err);
      setError('Failed to approve handover request. Please try again.');
    }
  };
  
  // Handle reject handover
  const handleRejectHandover = async () => {
    if (!selectedHandover) return;
    
    try {
      const response = await fetch(`/api/handovers/${selectedHandover._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'Rejected',
          remarks: remarks
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject handover request');
      }
      
      // Update the local state
      setHandoverRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === selectedHandover._id 
            ? { ...request, status: 'Rejected', remarks, updatedAt: new Date().toISOString() } 
            : request
        )
      );
      
      setSuccess('Handover request rejected successfully');
      setShowActionDialog(false);
      setRemarks('');
      
      // Add notification for handover rejection
      addNotification({
        title: `Handover request rejected for ${selectedHandover.facultyName}`,
        description: `Class on ${selectedHandover.dateOfClass} at ${selectedHandover.timeSlot} - Reason: ${remarks || 'No reason provided'}`,
        type: 'rejection',
        isRead: false,
        relatedTo: selectedHandover.facultyId
      });
      
    } catch (err) {
      console.error('Error rejecting handover request:', err);
      setError('Failed to reject handover request. Please try again.');
    }
  };
  
  // Handle change substitute
  const handleChangeSubstitute = async () => {
    if (!selectedHandover || !selectedSubstituteId) return;
    
    try {
      const substituteFaculty = facultyList.find(faculty => faculty._id === selectedSubstituteId);
      
      if (!substituteFaculty) {
        throw new Error('Selected substitute faculty not found');
      }
      
      const response = await fetch(`/api/handovers/${selectedHandover._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'Approved',
          substituteId: selectedSubstituteId,
          substituteName: substituteFaculty.name,
          remarks: remarks
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to change substitute faculty');
      }
      
      // Update the local state
      setHandoverRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === selectedHandover._id 
            ? { 
                ...request, 
                status: 'Approved', 
                substituteId: selectedSubstituteId, 
                substituteName: substituteFaculty.name,
                remarks,
                updatedAt: new Date().toISOString() 
              } 
            : request
        )
      );
      
      setSuccess('Substitute faculty changed and handover approved successfully');
      setShowActionDialog(false);
      setRemarks('');
      setSelectedSubstituteId('');
      
      // Add notification for handover approval with substitute change
      addNotification({
        title: `Handover request approved with substitute change`,
        description: `${selectedHandover.facultyName}'s class on ${selectedHandover.dateOfClass} will now be handled by ${substituteFaculty.name}`,
        type: 'approval',
        isRead: false,
        relatedTo: selectedHandover.facultyId
      });
      
      // Notify the new substitute faculty
      notifySubstituteFaculty({...selectedHandover, substituteId: selectedSubstituteId, substituteName: substituteFaculty.name}, 'Approved');
      
    } catch (err) {
      console.error('Error changing substitute faculty:', err);
      setError('Failed to change substitute faculty. Please try again.');
    }
  };
  
  // Notify substitute faculty
  const notifySubstituteFaculty = async (handover: HandoverRequest, status: string) => {
    try {
      // This is a placeholder for actual notification logic
      // In a real implementation, you would call an API endpoint to send notifications
      console.log(`Notifying substitute faculty ${handover.substituteName} about handover request ${status.toLowerCase()}`);
      
      // Add notification for the substitute faculty
      addNotification({
        title: `You've been assigned as a substitute`,
        description: `You will cover ${handover.facultyName}'s class on ${handover.dateOfClass} at ${handover.timeSlot}. Subject: ${handover.subject}`,
        type: 'handover',
        isRead: false,
        relatedTo: handover.substituteId
      });
      
      // Example notification API call (commented out)
      /*
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: handover.substituteId,
          type: 'handover',
          title: `Handover Request ${status}`,
          message: `You have been assigned as a substitute for ${handover.facultyName}'s class on ${handover.dateOfClass} at ${handover.timeSlot}. Subject: ${handover.subject}, Course: ${handover.course}.`,
          relatedId: handover._id
        })
      });
      */
    } catch (err) {
      console.error('Error notifying substitute faculty:', err);
    }
  };
  
  // Export handover requests
  const exportHandoverRequests = () => {
    // Create CSV content
    const headers = ['Faculty Name', 'Date of Class', 'Time Slot', 'Subject', 'Course', 'Reason', 'Substitute', 'Status', 'Remarks'];
    
    const csvContent = [
      headers.join(','),
      ...handoverRequests.map(request => [
        `"${request.facultyName}"`,
        `"${new Date(request.dateOfClass).toLocaleDateString()}"`,
        `"${request.timeSlot}"`,
        `"${request.subject}"`,
        `"${request.course}"`,
        `"${request.reason}"`,
        `"${request.substituteName}"`,
        `"${request.status}"`,
        `"${request.remarks || ''}"`
      ].join(','))
    ].join('\n');
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `handover-requests-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      case 'Pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
    }
  };
  
  // If user is still loading or not HOD, show loading or nothing
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#59159d]"></div>
      </div>
    );
  }
  
  if (!user || user.role !== 'HOD') {
    return null;
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Handover Requests</h1>
        
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={exportHandoverRequests}
          >
            <Download size={16} />
            Export
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
            <div>
              <label htmlFor="status-filter" className="text-sm text-gray-500 block mb-1">Status</label>
              <select
                id="status-filter"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="date-filter" className="text-sm text-gray-500 block mb-1">Date</label>
              <input
                id="date-filter"
                type="date"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="faculty-filter" className="text-sm text-gray-500 block mb-1">Faculty</label>
              <input
                id="faculty-filter"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Search by name"
                value={facultyFilter}
                onChange={(e) => setFacultyFilter(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="subject-filter" className="text-sm text-gray-500 block mb-1">Subject</label>
              <input
                id="subject-filter"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Search by subject"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle size={16} className="mr-2" />
          {error}
          <button 
            className="ml-auto text-red-700 hover:text-red-900"
            onClick={() => setError(null)}
          >
            <XCircle size={16} />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <CheckCircle size={16} className="mr-2" />
          {success}
          <button 
            className="ml-auto text-green-700 hover:text-green-900"
            onClick={() => setSuccess(null)}
          >
            <XCircle size={16} />
          </button>
        </div>
      )}
      
      {/* Handover Requests Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requesting Faculty
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suggested Substitute
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#59159d]"></div>
                    </div>
                  </td>
                </tr>
              ) : handoverRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No handover requests found
                  </td>
                </tr>
              ) : (
                handoverRequests
                  .filter(request => 
                    (facultyFilter === '' || request.facultyName.toLowerCase().includes(facultyFilter.toLowerCase()))
                  )
                  .map(request => (
                    <tr key={request._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={16} className="text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{request.facultyName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar size={14} className="mr-1 text-gray-500" />
                            {formatDate(request.dateOfClass)}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock size={14} className="mr-1 text-gray-500" />
                            {request.timeSlot}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.course}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={request.reason}>
                          {request.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.substituteName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {request.status === 'Pending' ? (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-800"
                              onClick={() => {
                                setSelectedHandover(request);
                                setActionType('approve');
                                setShowActionDialog(true);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => {
                                setSelectedHandover(request);
                                setActionType('change');
                                setSelectedSubstituteId(request.substituteId);
                                setShowActionDialog(true);
                              }}
                            >
                              Change
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => {
                                setSelectedHandover(request);
                                setActionType('reject');
                                setShowActionDialog(true);
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {request.status === 'Approved' ? 'Approved' : 'Rejected'}
                            {request.remarks && (
                              <span className="ml-2 cursor-pointer text-blue-500 hover:text-blue-700" title={request.remarks}>
                                <FileText size={14} />
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Action Dialog */}
      {showActionDialog && selectedHandover && (
        <Dialog.Root open={showActionDialog} onOpenChange={setShowActionDialog}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <Dialog.Title className="text-lg font-bold text-gray-900 mb-4">
                {actionType === 'approve' && 'Approve Handover Request'}
                {actionType === 'change' && 'Change Substitute Faculty'}
                {actionType === 'reject' && 'Reject Handover Request'}
              </Dialog.Title>
              
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Faculty</p>
                    <p className="text-sm font-medium">{selectedHandover.facultyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="text-sm font-medium">{formatDate(selectedHandover.dateOfClass)} at {selectedHandover.timeSlot}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subject</p>
                    <p className="text-sm font-medium">{selectedHandover.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Course</p>
                    <p className="text-sm font-medium">{selectedHandover.course}</p>
                  </div>
                </div>
                
                {actionType === 'change' && (
                  <div className="mb-4">
                    <label htmlFor="substitute" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Substitute Faculty
                    </label>
                    <select
                      id="substitute"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={selectedSubstituteId}
                      onChange={(e) => setSelectedSubstituteId(e.target.value)}
                    >
                      <option value="">Select a faculty member</option>
                      {facultyList.map(faculty => (
                        <option key={faculty._id} value={faculty._id}>
                          {faculty.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks (optional)
                  </label>
                  <textarea
                    id="remarks"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Add any comments or instructions..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowActionDialog(false);
                    setRemarks('');
                    setSelectedSubstituteId('');
                  }}
                >
                  Cancel
                </Button>
                
                {actionType === 'approve' && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleApproveHandover}
                  >
                    Approve
                  </Button>
                )}
                
                {actionType === 'change' && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleChangeSubstitute}
                    disabled={!selectedSubstituteId}
                  >
                    Change & Approve
                  </Button>
                )}
                
                {actionType === 'reject' && (
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleRejectHandover}
                  >
                    Reject
                  </Button>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
