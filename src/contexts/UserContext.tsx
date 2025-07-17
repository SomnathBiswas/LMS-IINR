'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  _id: string;
  facultyId: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  department?: string;
  employeeId?: string;
  profilePicture?: string;
};

type UserContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    console.log('Fetching user data...');
    try {
      const response = await fetch('/api/auth/user', { credentials: 'include' });
      const data = await response.json();
      console.log('User API response:', data);

      if (response.ok) {
        console.log('User data fetched successfully:', data);
        setUser(data);
        setError(null);
      } else {
        console.error('Failed to fetch user data:', data.error);
        setUser(null);
        setError(data.error);
      }
    } catch (err) {
      console.error('An error occurred while fetching user data:', err);
      setUser(null);
      setError('Failed to fetch user data');
    } finally {
      setLoading(false);
      console.log('Finished fetching user data.');
    }
  };

  const refreshUser = async () => {
    // setLoading(true);
    // Don't set user to null, as it causes a flicker and re-render issues.
    // Instead, we'll just fetch the user in the background and update the state
    // once the new data is available.
    await fetchUser();
  };

  useEffect(() => {
    setTimeout(() => {
      fetchUser();
    }, 100);
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}