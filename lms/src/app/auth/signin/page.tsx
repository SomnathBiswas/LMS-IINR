'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const { refreshUser } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    facultyId: '',
    password: '',
    email: '',
    role: 'Faculty'
  });
  const [isLoading, setIsLoading] = useState(false);

  const roles = ['Faculty', 'HOD'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      // For HOD users, implement 2FA with OTP
      if (formData.role === 'HOD') {
        // Store credentials in localStorage for use after OTP verification
        localStorage.setItem('hodLoginEmail', formData.email);
        localStorage.setItem('hodLoginPassword', formData.password);
        
        // Send OTP with credentials for verification
        const verifyResponse = await fetch('/api/auth/login-send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: formData.email,
            password: formData.password,
            role: formData.role
          }),
        });

        const verifyData = await verifyResponse.json();

        if (verifyResponse.ok) {
          // Redirect to OTP verification page
          router.push(`/auth/login-verify-otp?email=${encodeURIComponent(formData.email)}&role=${formData.role}`);
          return;
        } else {
          alert(verifyData.error || 'Failed to send verification code');
          setIsLoading(false);
          return;
        }
      }
      
      // For Faculty users, continue with normal login
      // Prepare the login data based on the selected role
      const loginData: Record<string, string> = {
        role: formData.role,
        password: formData.password
      };
      
      // Add role-specific fields
      if (formData.role === 'Faculty') {
        loginData.facultyId = formData.facultyId;
      }

      console.log(`Starting login request at ${performance.now() - startTime}ms`);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      console.log(`Login response received at ${performance.now() - startTime}ms`);

      if (response.ok) {
        // Get redirect URL from response if available
        const redirectUrl = data.redirect || '/';
        console.log(`Login successful (${data.processingTime || 'unknown'}ms server time), redirecting to: ${redirectUrl}`);
        
        // Handle faculty login with special redirection
        if (formData.role === 'Faculty') {
          // Store login success in sessionStorage
          sessionStorage.setItem('facultyLoginSuccess', 'true');
          sessionStorage.setItem('facultyId', formData.facultyId);
          
          // Record as active in background (don't await)
          fetch('/api/active-users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ facultyId: formData.facultyId })
          }).catch(error => {
            console.error('Failed to record active user:', error);
          });
          
          console.log('FACULTY LOGIN SUCCESS - REDIRECTING TO DEDICATED REDIRECT PAGE');
          
          // Use our dedicated redirect page that handles all edge cases
          window.location.href = '/auth/faculty-redirect';
          
          // Fallback if the redirect page navigation fails
          setTimeout(() => {
            console.log('Fallback redirect directly to dashboard');
            window.location.replace('/');
          }, 1000);
        } else {
          // For other roles, use standard redirect
          window.location.href = redirectUrl;
        }
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'role') {
      setFormData({
        facultyId: '',
        password: '',
        email: '',
        role: value
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFacultyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Remove all non-numeric characters
    const numericValue = rawValue.replace(/\D/g, '');
    // Format the ID
    const formattedId = `IINR-${numericValue}`;
    setFormData(prev => ({
      ...prev,
      facultyId: formattedId
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md p-8 bg-white shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#59159d]">{formData.role} Sign In</h1>
          <p className="text-gray-600 mt-2">Welcome back! Please sign in to continue</p>
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
                  onChange={handleFacultyIdChange}
                  className="w-full"
                  required
                  pattern="IINR-\d{3,}"
                  title="Faculty ID must be in the format IINR-XXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pr-10"
                    required
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
                <Label htmlFor="email">Email ID</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
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
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pr-10"
                    required
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
          )}

          <Button type="submit" className="w-full bg-[#59159d] hover:bg-[#4a1184]" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="flex justify-center mt-4">
            <a
              href="/auth/forgot-password"
              className="text-sm text-[#59159d] hover:underline"
            >
              Forgot Password?
            </a>
          </div>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{' '}
            <a
              href="/auth/signup"
              className="text-[#59159d] hover:underline font-medium"
            >
              Sign Up
            </a>
          </p>
        </form>
      </Card>
    </div>
  );
}