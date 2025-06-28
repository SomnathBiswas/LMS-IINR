'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, loading } = useUser();
  const router = useRouter();

  if (loading) return null;

  const handleLogout = async () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    router.push('/auth/signin');
  };

  // return (
  //   <div className="p-4 flex justify-between items-center">
  //     <div>
  //       <h1 className="text-2xl font-semibold text-gray-900">Good Morning, {user?.name || 'User'}</h1>
  //       <p className="text-sm text-gray-600">{user?.role || ''}</p>
  //     </div>
  //     <button
  //       onClick={handleLogout}
  //       className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
  //     >
  //       Logout
  //     </button>
  //   </div>
  // );
}