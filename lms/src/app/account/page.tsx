'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Camera, User, Lock, Bell, LogOut, Home, Calendar, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function AccountPage() {
  console.log('AccountPage rendering');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize form data when user data is loaded
  useEffect(() => {
    console.log('User context in AccountPage:', user);
    if (user) {
      console.log('User data is present, setting form data.');
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || 'Male'
      });
      
      // If user has a profile picture, set it
      if (user.profilePicture) {
        setSelectedImage(user.profilePicture);
      }
    } else {
      console.log('User data is not available yet.');
    }
  }, [user]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setSelectedImage(imageData);
        // We'll save the image when the form is submitted
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Prepare the data to send to the API
      const updateData = {
        ...formData,
        profilePicture: selectedImage
      };

      // Send the update request
      const response = await fetch('/api/auth/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh user data to get the updated info
        await refreshUser();
        alert('Profile updated successfully!');
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('An error occurred while updating your profile');
    } finally {
      setIsSaving(false);
    }
  };

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

              <li className="hover:bg-[#59159d] rounded-lg p-3 cursor-pointer">
                <a href="/attendance-report" className="flex items-center justify-between">
                  <span>Attendance Report</span>
                  <Calendar size={24} />
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
      <main className="p-4 md:p-8 md:ml-64 transition-all duration-300 ease-in-out">
        <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 mt-10 md:mt-0">
          <h1 className="text-2xl font-semibold">Account Settings</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <Card className="p-6 col-span-1">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {selectedImage ? (
                    <img src={selectedImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
                      {user?.name ? user.name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase() : '??'}
                    </div>
                  )}
                </Avatar>
                <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Camera className="w-4 h-4 text-gray-600" />
                </label>
                <input
                  type="file"
                  id="profile-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              <h2 className="text-xl font-semibold mt-4">{user?.name || 'Loading...'}</h2>
              <p className="text-gray-600">{user?.role || ''}</p>
            </div>

            <nav>
              <ul className="space-y-2">
                <li className="bg-purple-50 text-purple-700 rounded-lg p-3 cursor-pointer">
                  <a href="/account" className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    Account Info
                  </a>
                </li>
              </ul>
            </nav>
          </Card>

          {/* Main Content */}
          <Card className="p-6 col-span-1 lg:col-span-3">
            <h3 className="text-xl font-semibold mb-6">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg bg-gray-50"
                  value={user?.role || ''}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="w-full p-2 border rounded-lg"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg bg-gray-50"
                  value={user?.department || 'Nursing'}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full p-2 border rounded-lg"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg bg-gray-50"
                  value={user?.employeeId || user?.facultyId || ''}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="w-full p-2 border rounded-lg"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  className="w-full p-2 border rounded-lg"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button 
                type="button"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                onClick={() => router.push('/')}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </main>
    </div>
  );
}