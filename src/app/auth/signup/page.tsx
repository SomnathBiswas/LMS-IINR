'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, X } from 'lucide-react';
import { subjectsList } from '@/data/subjects-data';

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    facultyId: '',
    name: '',
    hodName: '',
    hodEmail: '',
    password: '',
    confirmPassword: '',
    role: 'Faculty',
    subjectsKnown: [] as string[]
  });
  
  // Use the centralized subjects list
  const availableSubjects = subjectsList;
  
  // Handle subject selection
  const handleSubjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSubject = e.target.value;
    if (selectedSubject && !formData.subjectsKnown.includes(selectedSubject)) {
      setFormData({
        ...formData,
        subjectsKnown: [...formData.subjectsKnown, selectedSubject]
      });
    }
  };
  
  // Remove a subject from the selected list
  const removeSubject = (subjectToRemove: string) => {
    setFormData({
      ...formData,
      subjectsKnown: formData.subjectsKnown.filter(subject => subject !== subjectToRemove)
    });
  };

  const roles = ['Faculty', 'HOD'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // For HOD users, check if passwords match
      if (formData.role === 'HOD' && formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (formData.role === 'Faculty') {
          // Faculty users go directly to sign in
          router.push('/auth/signin');
        } else if (formData.role === 'HOD') {
          // HOD users go to OTP verification page
          // Include test OTP in URL for development purposes
          router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.hodEmail)}&userId=${encodeURIComponent(data.userId)}${data.testOtp ? `&testOtp=${data.testOtp}` : ''}`);
        }
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md p-8 bg-white shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#59159d]">{formData.role} Sign Up</h1>
          <p className="text-gray-600 mt-2">Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              required
            >
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {formData.role === 'Faculty' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="facultyId">Faculty ID</Label>
                <Input
                  id="facultyId"
                  name="facultyId"
                  type="text"
                  placeholder="IINR-001"
                  value={formData.facultyId}
                  onChange={handleChange}
                  className="w-full"
                  required
                  pattern="IINR-\d{3,}"
                  title="Faculty ID must be in the format IINR-XXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subjectsKnown">Subjects Known</Label>
                <div className="mb-2">
                  <select
                    id="subjectsKnown"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onChange={handleSubjectSelect}
                    defaultValue=""
                  >
                    <option value="" disabled>Select subjects you can teach</option>
                    {availableSubjects
                      .map(subject => (
                        <option key={subject} value={subject} disabled={formData.subjectsKnown.includes(subject)}>
                          {subject}
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.subjectsKnown.map(subject => (
                    <Badge key={subject} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                      {subject}
                      <button 
                        type="button" 
                        onClick={() => removeSubject(subject)}
                        className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                  {formData.subjectsKnown.length === 0 && (
                    <span className="text-sm text-gray-500 italic">No subjects selected</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select all subjects that you are qualified to teach. This helps with class handovers.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="hodName">HOD Name</Label>
                <Input
                  id="hodName"
                  name="hodName"
                  type="text"
                  placeholder="Enter HOD name"
                  value={formData.hodName}
                  onChange={handleChange}
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hodEmail">HOD Email ID</Label>
                <Input
                  id="hodEmail"
                  name="hodEmail"
                  type="email"
                  placeholder="Enter HOD email address"
                  value={formData.hodEmail}
                  onChange={handleChange}
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pr-10"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </>
          )}

          <Button type="submit" className="w-full bg-[#59159d] hover:bg-[#4a1184]">
            Sign Up
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a
              href="/auth/signin"
              className="text-[#59159d] hover:underline font-medium"
            >
              Sign In
            </a>
          </p>
        </form>
      </Card>
    </div>
  );
}