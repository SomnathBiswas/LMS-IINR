'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Format phone number to ensure it has the correct format
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      
      if (formattedPhone.length < 10) {
        setError('Please enter a valid phone number');
        setIsLoading(false);
        return;
      }

      // Call the API to send OTP
      const response = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the phone number in session storage for the next step
        sessionStorage.setItem('resetPhone', formattedPhone);
        
        // For development: display the OTP if it's returned from the API
        if (data.otp) {
          setDevOtp(data.otp);
          // Wait 2 seconds before redirecting to show the OTP
          setTimeout(() => {
            router.push('/auth/forgot-password/verify-otp');
          }, 2000);
        } else {
          // Redirect to OTP verification page
          router.push('/auth/forgot-password/verify-otp');
        }
      } else {
        setError(data.error || 'Phone number not found');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md p-8 bg-white shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#59159d]">Forgot Password</h1>
          <p className="text-gray-600 mt-2">Enter your phone number to reset your password</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {devOtp && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <p className="text-yellow-700 text-sm">Development Mode: Your OTP is <span className="font-bold">{devOtp}</span></p>
            <p className="text-yellow-700 text-xs mt-1">Redirecting to verification page...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+91 9876543210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full"
              required
            />
            <p className="text-xs text-gray-500">
              Enter the phone number associated with your account
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#59159d] hover:bg-[#4a1184]"
            disabled={isLoading}
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </Button>

          <div className="flex justify-center mt-4">
            <a
              href="/auth/signin"
              className="text-sm text-gray-600 hover:text-[#59159d] flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
}
