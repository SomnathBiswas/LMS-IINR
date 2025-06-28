'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SideNavbar from '@/components/SideNavbar';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <SideNavbar />
      
      {/* Header */}
      <header className="bg-[#59159d] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">IINR Management System</Link>
            <Link href="/">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#59159d]">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center text-[#59159d] mb-12">About Us</h1>
        
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-2xl font-bold text-[#59159d] mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              At IINR, our mission is to provide a comprehensive and integrated management system that empowers educational institutions to streamline their operations, enhance security, and manage financial resources efficiently.
            </p>
            <p className="text-gray-700">
              We believe in creating technology solutions that are user-friendly, secure, and adaptable to the evolving needs of educational institutions.
            </p>
          </div>
          <div className="relative h-80 rounded-lg overflow-hidden shadow-xl bg-gradient-to-r from-purple-100 to-indigo-200">
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#59159d] mb-3">Our Mission</h3>
                <p className="text-gray-700">Providing comprehensive management solutions for educational excellence</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="relative h-80 rounded-lg overflow-hidden shadow-xl md:order-1 order-2 bg-gradient-to-r from-indigo-200 to-purple-100">
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#59159d] mb-3">Our Team</h3>
                <p className="text-gray-700">Dedicated professionals working together to transform educational management</p>
              </div>
            </div>
          </div>
          <div className="md:order-2 order-1">
            <h2 className="text-2xl font-bold text-[#59159d] mb-4">Our Team</h2>
            <p className="text-gray-700 mb-4">
              Our team consists of dedicated professionals with expertise in education management, security systems, and financial operations. We work collaboratively to develop solutions that address the unique challenges faced by educational institutions.
            </p>
            <p className="text-gray-700">
              With a combined experience of over 50 years in the education sector, our team brings a wealth of knowledge and insights to every project we undertake.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-[#59159d] mb-6 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold text-[#59159d] mb-2">Innovation</h3>
                <p className="text-gray-700">
                  We continuously strive to innovate and improve our solutions to meet the changing needs of educational institutions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold text-[#59159d] mb-2">Integrity</h3>
                <p className="text-gray-700">
                  We uphold the highest standards of integrity in all our interactions and operations.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold text-[#59159d] mb-2">Excellence</h3>
                <p className="text-gray-700">
                  We are committed to delivering excellence in every aspect of our work.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#59159d] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">IINR Management System</h3>
              <p className="text-sm opacity-80">© {new Date().getFullYear()} IINR. All rights reserved.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#59159d]">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
