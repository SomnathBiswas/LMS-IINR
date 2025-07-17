// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';

// export default function LoginVerifyOTPPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const email = searchParams.get('email');
//   const role = searchParams.get('role');

//   const [otp, setOtp] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [countdown, setCountdown] = useState(600); // 10 minutes in seconds

//   useEffect(() => {
//     // Redirect if email or role is missing
//     if (!email || !role) {
//       router.push('/auth/signin');
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
//   }, [email, role, router]);

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
//       // First verify the OTP
//       const otpResponse = await fetch('/api/auth/login-verify-otp', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email, otp, role }), // Use login-specific OTP verification
//       });

//       const otpData = await otpResponse.json();

//       if (!otpResponse.ok) {
//         setError(otpData.error || 'OTP verification failed');
//         setIsLoading(false);
//         return;
//       }
      
//       // OTP verified, now get credentials from localStorage and log in
//       const storedEmail = localStorage.getItem('hodLoginEmail');
//       const storedPassword = localStorage.getItem('hodLoginPassword');
      
//       if (!storedEmail || !storedPassword) {
//         setError('Login session expired. Please try again.');
//         setIsLoading(false);
//         return;
//       }
      
//       // Now perform the actual login
//       const loginResponse = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ 
//           email: storedEmail, 
//           password: storedPassword, 
//           role: 'HOD' 
//         }),
//       });

//       const loginData = await loginResponse.json();
      
//       // Clear stored credentials for security
//       localStorage.removeItem('hodLoginEmail');
//       localStorage.removeItem('hodLoginPassword');

//       if (loginResponse.ok) {
//         // Check for redirect URL in response or headers
//         const redirectUrl = loginData.redirect || loginResponse.headers.get('X-Auth-Redirect') || '/hod-dashboard';
//         console.log('Login successful, redirecting to:', redirectUrl);
        
//         // Use multiple redirection methods to ensure it works
//         try {
//           // Method 1: Direct replace (most reliable)
//           window.location.replace(redirectUrl);
          
//           // Method 2: Backup with timeout in case Method 1 fails
//           setTimeout(() => {
//             console.log('Checking if redirect happened...');
//             if (window.location.pathname !== redirectUrl) {
//               console.log('Redirect with replace failed, trying href');
//               window.location.href = redirectUrl;
//             }
//           }, 500);
          
//           // Method 3: Final fallback
//           setTimeout(() => {
//             console.log('Final redirect attempt');
//             router.push(redirectUrl);
//           }, 1000);
//         } catch (e) {
//           console.error('Error during redirect:', e);
//           // Last resort
//           window.location.href = redirectUrl;
//         }
//       } else {
//         setError(loginData.error || 'Login failed');
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
//       // Get stored credentials for resending OTP
//       const storedEmail = localStorage.getItem('hodLoginEmail');
//       const storedPassword = localStorage.getItem('hodLoginPassword');
      
//       if (!storedEmail || !storedPassword) {
//         setError('Login session expired. Please try again from the sign-in page.');
//         setIsLoading(false);
//         return;
//       }
      
//       const response = await fetch('/api/auth/login-send-otp', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ 
//           email: storedEmail, 
//           password: storedPassword, 
//           role: role 
//         }),
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
//           <h1 className="text-2xl font-bold text-[#59159d]">Login Verification</h1>
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
function LoginVerifyOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const role = searchParams.get('role');

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    // Redirect if email or role is missing
    if (!email || !role) {
      router.push('/auth/signin');
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
  }, [email, role, router]);

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
      // First verify the OTP
      const otpResponse = await fetch('/api/auth/login-verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, role }), // Use login-specific OTP verification
      });

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        setError(otpData.error || 'OTP verification failed');
        setIsLoading(false);
        return;
      }
      
      // OTP verified, now get credentials from localStorage and log in
      const storedEmail = localStorage.getItem('hodLoginEmail');
      const storedPassword = localStorage.getItem('hodLoginPassword');
      
      if (!storedEmail || !storedPassword) {
        setError('Login session expired. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Now perform the actual login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: storedEmail, 
          password: storedPassword, 
          role: 'HOD' 
        }),
      });

      const loginData = await loginResponse.json();
      
      // Clear stored credentials for security
      localStorage.removeItem('hodLoginEmail');
      localStorage.removeItem('hodLoginPassword');

      if (loginResponse.ok) {
        // Check for redirect URL in response or headers
        const redirectUrl = loginData.redirect || loginResponse.headers.get('X-Auth-Redirect') || '/hod-dashboard';
        console.log('Login successful, redirecting to:', redirectUrl);
        
        // Use multiple redirection methods to ensure it works
        try {
          // Method 1: Direct replace (most reliable)
          window.location.replace(redirectUrl);
          
          // Method 2: Backup with timeout in case Method 1 fails
          setTimeout(() => {
            console.log('Checking if redirect happened...');
            if (window.location.pathname !== redirectUrl) {
              console.log('Redirect with replace failed, trying href');
              window.location.href = redirectUrl;
            }
          }, 500);
          
          // Method 3: Final fallback
          setTimeout(() => {
            console.log('Final redirect attempt');
            router.push(redirectUrl);
          }, 1000);
        } catch (e) {
          console.error('Error during redirect:', e);
          // Last resort
          window.location.href = redirectUrl;
        }
      } else {
        setError(loginData.error || 'Login failed');
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
      // Get stored credentials for resending OTP
      const storedEmail = localStorage.getItem('hodLoginEmail');
      const storedPassword = localStorage.getItem('hodLoginPassword');
      
      if (!storedEmail || !storedPassword) {
        setError('Login session expired. Please try again from the sign-in page.');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/auth/login-send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: storedEmail, 
          password: storedPassword, 
          role: role 
        }),
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
          <h1 className="text-2xl font-bold text-[#59159d]">Login Verification</h1>
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
export default function LoginVerifyOTPPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginVerifyOTPForm />
    </Suspense>
  );
}