'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BillSubmissionForm, { BillData } from '@/components/BillSubmissionForm';
import BillRecordsTable from '@/components/BillRecordsTable';

export default function SecurityDashboard() {
  const router = useRouter();
  const [securityName, setSecurityName] = useState('');
  const [securityId, setSecurityId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [bills, setBills] = useState<BillData[]>([]);
  // Initialize with 1, but will be updated after fetching bills
  const [nextSerialNumber, setNextSerialNumber] = useState(() => {
    // Try to get the serial number from localStorage first
    if (typeof window !== 'undefined') {
      const savedSerialNumber = localStorage.getItem('nextBillSerialNumber');
      return savedSerialNumber ? parseInt(savedSerialNumber, 10) : 1;
    }
    return 1;
  });

  useEffect(() => {
    // Check if user is authenticated as Security
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user', { credentials: 'include' });
        const data = await response.json();
        
        if (response.ok && data.role === 'Security') {
          setSecurityName(data.name || 'Security Staff');
          setSecurityId(data.securityId || '');
          
          // Load saved bills from the database
          const fetchBills = async () => {
            try {
              const response = await fetch('/api/bills');
              if (response.ok) {
                const fetchedBills = await response.json();
                setBills(fetchedBills);
                if (fetchedBills.length > 0) {
                  // Find the highest serial number in the existing bills
                  const maxSerialNumber = Math.max(...fetchedBills.map((bill: BillData) => bill.serialNumber));
                  // Set the next serial number to be one higher than the max
                  const newSerialNumber = maxSerialNumber + 1;
                  setNextSerialNumber(newSerialNumber);
                  localStorage.setItem('nextBillSerialNumber', newSerialNumber.toString());
                }
              }
            } catch (error) {
              console.error('Error fetching bills:', error);
            }
          };
          fetchBills();
        } else {
          // Redirect to login if not authenticated as Security
          router.push('/auth/security/login');
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        router.push('/auth/security/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/home');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };
  
  const handleBillSubmit = (billData: BillData) => {
    // Make sure we're using the correct serial number from the form
    const submittedBill = {
      ...billData,
      serialNumber: nextSerialNumber // Ensure we use the current nextSerialNumber
    };
    
    // Add the new bill to the list
    setBills(prevBills => [...prevBills, submittedBill]);
    
    // Increment the serial number for the next bill
    setNextSerialNumber(prevSerialNumber => {
      const newSerialNumber = prevSerialNumber + 1;
      localStorage.setItem('nextBillSerialNumber', newSerialNumber.toString());
      return newSerialNumber;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100">
        <p className="text-lg font-medium text-[#59159d]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#59159d]">Security Dashboard</h1>
            <p className="text-gray-600">Welcome, {securityName} ({securityId})</p>
          </div>
          <Button 
            variant="outline" 
            className="border-[#59159d] text-[#59159d] hover:bg-[#59159d] hover:text-white"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
        
        <div className="w-full">
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bill Submission Form</CardTitle>
                <CardDescription>Upload bills and fill in the required details</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Pass the next available serial number to the form */}
                {/* Display the next available serial number in the form */}
                <BillSubmissionForm onSubmit={handleBillSubmit} serialNumber={nextSerialNumber} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Bill Records</CardTitle>
                <CardDescription>View all submitted bills</CardDescription>
              </CardHeader>
              <CardContent>
                <BillRecordsTable bills={bills} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
