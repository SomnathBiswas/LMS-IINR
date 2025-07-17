'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    // Get the phone number from session storage
    const storedPhone = sessionStorage.getItem('resetPhone');
    if (!storedPhone) {
      // Redirect back to forgot password page if no phone number is found
      router.push('/auth/forgot-password');
      return;
    }
    
    setPhone(storedPhone);

    // Set up countdown timer for OTP resend
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        setIsLoading(false);
        return;
      }

      // Call the API to verify OTP
      const response = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the verification token for the next step
        sessionStorage.setItem('resetToken', data.resetToken);
        
        // Redirect to reset password page
        router.push('/auth/forgot-password/reset-password');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsLoading(true);
    setCanResend(false);
    setTimeLeft(60);

    try {
      // Call the API to resend OTP
      const response = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }

    // Restart the timer
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // Format phone number for display
  const formatPhone = (phone: string) => {
    if (phone.length === 10) {
      return `+91 ${phone.substring(0, 5)}*****`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md p-8 bg-white shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#59159d]">Verify OTP</h1>
          <p className="text-gray-600 mt-2">
            We've sent a 6-digit OTP to {formatPhone(phone)}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="******"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
              className="w-full text-center text-lg tracking-widest"
              required
              maxLength={6}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Enter the 6-digit code sent to your phone
              </p>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs text-[#59159d] hover:underline"
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-xs text-gray-500">
                  Resend in {timeLeft}s
                </p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#59159d] hover:bg-[#4a1184]"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>

          <div className="flex justify-center mt-4">
            <a
              href="/auth/forgot-password"
              className="text-sm text-gray-600 hover:text-[#59159d] flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Phone Entry
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
}
