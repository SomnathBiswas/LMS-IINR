// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';

// export default function VerifyOTPPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const email = searchParams.get('email');
//   const userId = searchParams.get('userId');

//   const [otp, setOtp] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [countdown, setCountdown] = useState(600); // 10 minutes in seconds

//   useEffect(() => {
//     // Redirect if email or userId is missing
//     if (!email || !userId) {
//       router.push('/auth/signup');
//       return;
//     }

//     // Start countdown timer
//     const timer = setInterval(() => {
//       setCountdown((prev) => {
//         if (prev <= 1) {
//           clearInterval(timer);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [email, userId, router]);

//   const formatTime = (seconds: number) => {
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     try {
//       const response = await fetch('/api/auth/verify-otp', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email, otp, userId }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         // Redirect to sign in page after successful verification
//         router.push('/auth/signin');
//       } else {
//         setError(data.error || 'OTP verification failed');
//       }
//     } catch (error) {
//       console.error('OTP verification error:', error);
//       setError('OTP verification failed. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResendOTP = async () => {
//     setIsLoading(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/resend-otp', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email, userId }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         // Reset countdown
//         setCountdown(600);
//         alert('A new OTP has been sent to your email.');
//       } else {
//         setError(data.error || 'Failed to resend OTP');
//       }
//     } catch (error) {
//       console.error('Resend OTP error:', error);
//       setError('Failed to resend OTP. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//       <Card className="w-full max-w-md p-8 bg-white shadow-lg">
//         <div className="text-center mb-8">
//           <h1 className="text-2xl font-bold text-[#59159d]">Email Verification</h1>
//           <p className="text-gray-600 mt-2">
//             We've sent a verification code to <span className="font-semibold">{email}</span>
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="space-y-2">
//             <Label htmlFor="otp">Enter Verification Code</Label>
//             <Input
//               id="otp"
//               type="text"
//               placeholder="Enter 6-digit code"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value)}
//               className="w-full text-center text-xl tracking-widest"
//               required
//               pattern="[0-9]{6}"
//               title="Please enter a 6-digit code"
//               maxLength={6}
//             />
//           </div>

//           {error && (
//             <div className="text-red-500 text-sm text-center">{error}</div>
//           )}

//           <div className="text-center text-sm">
//             <p className="text-gray-500">
//               Time remaining: <span className="font-semibold">{formatTime(countdown)}</span>
//             </p>
//           </div>

//           <Button 
//             type="submit" 
//             className="w-full bg-[#59159d] hover:bg-[#4a1184]" 
//             disabled={isLoading || countdown === 0}
//           >
//             {isLoading ? 'Verifying...' : 'Verify'}
//           </Button>

//           <div className="text-center mt-4">
//             <p className="text-sm text-gray-600">
//               Didn't receive the code?{' '}
//               <button
//                 type="button"
//                 onClick={handleResendOTP}
//                 className="text-[#59159d] hover:underline font-medium"
//                 disabled={isLoading || countdown > 540} // Allow resend after 1 minute
//               >
//                 Resend OTP
//               </button>
//             </p>
//           </div>
//         </form>
//       </Card>
//     </div>
//   );
// }


'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Separate component that uses useSearchParams
function VerifyOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const userId = searchParams.get('userId');

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    // Redirect if email or userId is missing
    if (!email || !userId) {
      router.push('/auth/signup');
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, userId, router]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, userId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to sign in page after successful verification
        router.push('/auth/signin');
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, userId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reset countdown
        setCountdown(600);
        alert('A new OTP has been sent to your email.');
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md p-8 bg-white shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#59159d]">Email Verification</h1>
          <p className="text-gray-600 mt-2">
            We've sent a verification code to <span className="font-semibold">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center text-xl tracking-widest"
              required
              pattern="[0-9]{6}"
              title="Please enter a 6-digit code"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div className="text-center text-sm">
            <p className="text-gray-500">
              Time remaining: <span className="font-semibold">{formatTime(countdown)}</span>
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#59159d] hover:bg-[#4a1184]" 
            disabled={isLoading || countdown === 0}
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-[#59159d] hover:underline font-medium"
                disabled={isLoading || countdown > 540} // Allow resend after 1 minute
              >
                Resend OTP
              </button>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}

// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md p-8 bg-white shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#59159d] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </Card>
    </div>
  );
}

// Main page component with Suspense boundary
export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VerifyOTPForm />
    </Suspense>
  );
}