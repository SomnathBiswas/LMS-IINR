'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccountsSignupPage() {
  const router = useRouter();
  const [accountsId, setAccountsId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/accounts/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountsId,
          password,
          confirmPassword,
          role: 'Accounts'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to login page after successful registration
        router.push('/auth/accounts/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-[#59159d]">Accounts Sign Up</CardTitle>
          <CardDescription className="text-center">
            Create a new accounts department user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountsId">Accounts ID</Label>
              <Input
                id="accountsId"
                placeholder="ACC-XXXX"
                value={accountsId}
                onChange={(e) => setAccountsId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm font-medium text-red-500">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-[#59159d] hover:bg-[#4a1184]"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-center text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/accounts/login" className="text-[#59159d] hover:underline">
              Sign in
            </Link>
          </p>
          <Link href="/home" className="text-sm text-center text-[#59159d] hover:underline">
            Back to Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
