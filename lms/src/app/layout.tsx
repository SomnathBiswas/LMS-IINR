'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { UserProvider } from '@/contexts/UserContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import Header from '@/components/Header';
import ActiveStatusTracker from '@/components/ActiveStatusTracker';
import MedicalBackground from '@/components/MedicalBackground';
import { usePathname } from 'next/navigation';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');
  // Always exclude Header from HOD dashboard pages
  const isHodDashboard = pathname?.startsWith('/hod-dashboard');

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider>
          <NotificationProvider>
            <MedicalBackground>
              {/* Only show Header on non-auth, non-HOD dashboard pages */}
              {!isAuthPage && !isHodDashboard && <Header />}
              <ActiveStatusTracker />
              {children}
            </MedicalBackground>
          </NotificationProvider>
        </UserProvider>
      </body>
    </html>
  );
}
