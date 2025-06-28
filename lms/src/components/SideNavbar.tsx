'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X, Info, Phone, BookOpen, Shield, CreditCard, ChevronDown, ChevronRight } from 'lucide-react';

interface SideNavbarProps {
  className?: string;
}

export default function SideNavbar({ className }: SideNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const router = useRouter();

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  const toggleServices = () => {
    setServicesOpen(!servicesOpen);
  };
  
  const navigateToLogin = () => {
    router.push('/auth/signin');
    setIsOpen(false);
  };
  
  const navigateToSecurityLogin = () => {
    router.push('/auth/security/login');
    setIsOpen(false);
  };
  
  const navigateToAccountsLogin = () => {
    router.push('/auth/accounts/login');
    setIsOpen(false);
  };

  return (
    <div className={`${className}`}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 bg-[#59159d] text-white hover:bg-[#4a1184] rounded-full shadow-lg"
        onClick={toggleNavbar}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleNavbar}
        />
      )}

      {/* Side Navbar */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-[#59159d] mb-8">IINR Menu</h2>
          <nav className="space-y-4">
            {/* Our Services Dropdown */}
            <div className="space-y-2">
              <button
                onClick={toggleServices}
                className="w-full flex items-center justify-between gap-2 text-gray-700 hover:text-[#59159d] transition-colors p-2 rounded-md hover:bg-purple-50"
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={20} />
                  <span>Our Services</span>
                </div>
                {servicesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {/* Services Submenu */}
              {servicesOpen && (
                <div className="pl-8 space-y-3 mt-2">
                  <button
                    onClick={navigateToLogin}
                    className="w-full flex items-center gap-2 text-gray-700 hover:text-[#59159d] transition-colors p-2 rounded-md hover:bg-purple-50"
                  >
                    <BookOpen size={16} />
                    <span>Faculty Login</span>
                  </button>
                  
                  <button
                    onClick={navigateToSecurityLogin}
                    className="w-full flex items-center gap-2 text-gray-700 hover:text-[#59159d] transition-colors p-2 rounded-md hover:bg-purple-50"
                  >
                    <Shield size={16} />
                    <span>Security Login</span>
                  </button>
                  
                  <button
                    onClick={navigateToAccountsLogin}
                    className="w-full flex items-center gap-2 text-gray-700 hover:text-[#59159d] transition-colors p-2 rounded-md hover:bg-purple-50"
                  >
                    <CreditCard size={16} />
                    <span>Accounts Login</span>
                  </button>
                </div>
              )}
            </div>
            
            <Link 
              href="/about-us" 
              className="flex items-center gap-2 text-gray-700 hover:text-[#59159d] transition-colors p-2 rounded-md hover:bg-purple-50"
              onClick={toggleNavbar}
            >
              <Info size={20} />
              <span>About Us</span>
            </Link>
            <Link 
              href="/contact-us" 
              className="flex items-center gap-2 text-gray-700 hover:text-[#59159d] transition-colors p-2 rounded-md hover:bg-purple-50"
              onClick={toggleNavbar}
            >
              <Phone size={20} />
              <span>Contact Us</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
