'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BillData as BillSubmissionData } from '@/components/BillSubmissionForm';

interface BillData extends BillSubmissionData {
  _id: string;
}
import AccountsBillRecordsTable from '@/components/AccountsBillRecordsTable';

export default function AccountsDashboard() {
  const router = useRouter();
  const [accountsName, setAccountsName] = useState('');
  const [accountsId, setAccountsId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [bills, setBills] = useState<BillData[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    // Check if user is authenticated as Accounts
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user', { credentials: 'include' });
        const data = await response.json();
        
        if (response.ok && data.role === 'Accounts') {
          setAccountsName(data.name || 'Accounts Staff');
          setAccountsId(data.accountsId || '');
          
          // Bills will be fetched in a separate effect
        } else {
          // Redirect to login if not authenticated as Accounts
          router.push('/auth/accounts/login');
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        router.push('/auth/accounts/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchBills = async (startDate: string = '', endDate: string = '') => {
    try {
      setIsLoading(true);
      let url = '/api/bills';
      
      // Add date filters if provided
      if (startDate || endDate) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        url = `${url}?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Handle the new response format which includes bills and pagination
        const fetchedBills = data.bills || [];
        setBills(fetchedBills);
      } else {
        console.error('Failed to fetch bills:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBills();
  }, []);
  
  const handleFilterChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    fetchBills(newStartDate, newEndDate);
  };

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
  
  const handleUpdatePaymentStatus = async (billId: string, status: 'Paid' | 'Unpaid') => {
    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: status }),
      });

      if (response.ok) {
        setBills(prevBills =>
          prevBills.map(bill =>
            (bill as any)._id === billId ? { ...bill, paymentStatus: status } : bill
          )
        );
      } else {
        console.error('Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
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
            <h1 className="text-3xl font-bold text-[#59159d]">Accounts Dashboard</h1>
            <p className="text-gray-600">Welcome, {accountsName} ({accountsId})</p>
          </div>
          <Button 
            variant="outline" 
            className="border-[#59159d] text-[#59159d] hover:bg-[#59159d] hover:text-white"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Security Bill Records</CardTitle>
            <CardDescription>Review and update payment status for security bills</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountsBillRecordsTable 
              bills={bills} 
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
              onFilterChange={handleFilterChange}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
