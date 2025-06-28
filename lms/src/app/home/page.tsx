'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SideNavbar from '@/components/SideNavbar';
import { BookOpen, Shield, CreditCard, ArrowRight, CheckCircle, Zap, Award, Users, BarChart } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

  const navigateToLogin = () => {
    router.push('/auth/signin');
  };
  
  const navigateToSecurityLogin = () => {
    router.push('/auth/security/login');
  };
  
  const navigateToAccountsLogin = () => {
    router.push('/auth/accounts/login');
  };

  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 5000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      {/* Side Navbar */}
      <SideNavbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-purple-200 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-indigo-300 opacity-20 blur-3xl"></div>
        
        <div className="container mx-auto px-4 pt-24 pb-32 flex flex-col items-center relative z-10">
          <Badge className="mb-6 bg-purple-100 text-[#59159d] hover:bg-purple-200 transition-all duration-300 px-4 py-1.5 text-sm font-medium rounded-full">
            Institutional Excellence
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#59159d] to-[#7e3ad6] mb-6 leading-tight">
            NF Management System
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-center mb-12 leading-relaxed">
            A comprehensive platform integrating Learning Management, Security, and Accounts for efficient institutional operations.
          </p>
          
          {/* Feature highlights with animation */}
          <div className="relative w-full max-w-4xl mx-auto h-80 rounded-2xl overflow-hidden shadow-2xl bg-white mb-12 border border-purple-100">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/10"></div>
            
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="w-full max-w-3xl">
                <div className="flex justify-center mb-4">
                  <div className="flex space-x-2">
                    {[0, 1, 2].map((i) => (
                      <button 
                        key={i}
                        onClick={() => setActiveFeature(i)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${activeFeature === i ? 'bg-[#59159d] scale-125' : 'bg-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="relative h-56">
                  <div className={`absolute inset-0 transition-all duration-500 transform ${activeFeature === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
                    <div className="flex flex-col md:flex-row items-center justify-between h-full">
                      <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                        <h2 className="text-3xl font-bold text-[#59159d] mb-4 flex items-center">
                          <BookOpen className="mr-3" size={32} />
                          Learning Management
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Comprehensive tools for course management, attendance tracking, and resource sharing to enhance the learning experience.
                        </p>
                        <Button className="bg-[#59159d] hover:bg-[#4a1184] text-white">
                          Learn More
                        </Button>
                      </div>
                      <div className="md:w-1/2 flex justify-center">
                        <img 
                          src="./images/1.jpg" 
                          alt="Learning Management" 
                          className="object-contain h-48 rounded-lg shadow-md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className={`absolute inset-0 transition-all duration-500 transform ${activeFeature === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
                    <div className="flex flex-col md:flex-row items-center justify-between h-full">
                      <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                        <h2 className="text-3xl font-bold text-[#59159d] mb-4 flex items-center">
                          <Shield className="mr-3" size={32} />
                          Security Management
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Advanced security protocols for access control, incident reporting, and campus safety management.
                        </p>
                        <Button className="bg-[#59159d] hover:bg-[#4a1184] text-white">
                          Learn More
                        </Button>
                      </div>
                      <div className="md:w-1/2 flex justify-center">
                        <img 
                          src="./images/2.jpg" 
                          alt="Security Management" 
                          className="object-contain h-48 rounded-lg shadow-md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className={`absolute inset-0 transition-all duration-500 transform ${activeFeature === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
                    <div className="flex flex-col md:flex-row items-center justify-between h-full">
                      <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                        <h2 className="text-3xl font-bold text-[#59159d] mb-4 flex items-center">
                          <CreditCard className="mr-3" size={32} />
                          Accounts Management
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Streamlined financial operations with integrated accounting tools for educational institutions.
                        </p>
                        <Button className="bg-[#59159d] hover:bg-[#4a1184] text-white">
                          Learn More
                        </Button>
                      </div>
                      <div className="md:w-1/2 flex justify-center">
                        <img 
                          src="./images/3.jpg" 
                          alt="Accounts Management" 
                          className="object-contain h-48 rounded-lg shadow-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Systems Section */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-[#59159d] hover:bg-purple-200 transition-all duration-300 px-4 py-1.5 text-sm font-medium rounded-full">
              Our Solutions
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-[#59159d] mb-6">
              Integrated Management Systems
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform offers seamless integration across all institutional departments
            </p>
          </div>

          {/* Tabs for system selection */}
          <Tabs defaultValue="lms" className="w-full max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-12 bg-purple-50">
              <TabsTrigger 
                value="lms" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#59159d] data-[state=active]:shadow-sm py-3 flex items-center justify-center gap-2"
              >
                <BookOpen size={18} />
                Learning
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#59159d] data-[state=active]:shadow-sm py-3 flex items-center justify-center gap-2"
              >
                <Shield size={18} />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="accounts" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#59159d] data-[state=active]:shadow-sm py-3 flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                Accounts
              </TabsTrigger>
            </TabsList>
            
            {/* LMS Content */}
            <TabsContent value="lms" className="mt-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 shadow-sm border border-purple-100">
                <div className="flex items-center mb-8">
                  <div className="bg-[#59159d] p-3 rounded-full mr-4">
                    <BookOpen size={32} className="text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-[#59159d]">Learning Management System</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <EnhancedFeatureCard
                    title="Course Management"
                    description="Easily create, update, and manage courses with detailed information and resources."
                    icon={<BookOpen className="text-[#59159d]" />}
                  />
                  <EnhancedFeatureCard
                    title="Attendance Tracking"
                    description="Track and manage student attendance with automated reports and notifications."
                    icon={<CheckCircle className="text-[#59159d]" />}
                  />
                  <EnhancedFeatureCard
                    title="Resource Sharing"
                    description="Share and access academic resources, materials, and documents in one place."
                    icon={<Users className="text-[#59159d]" />}
                  />
                </div>
                
                <div className="mt-12 flex justify-center">
                  <Button onClick={navigateToLogin} className="bg-[#59159d] hover:bg-[#4a1184] text-white px-6 py-2 rounded-full flex items-center gap-2 group transition-all duration-300">
                    Explore Learning Features
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Security Content */}
            <TabsContent value="security" className="mt-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 shadow-sm border border-purple-100">
                <div className="flex items-center mb-8">
                  <div className="bg-[#59159d] p-3 rounded-full mr-4">
                    <Shield size={32} className="text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-[#59159d]">Security Management System</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <EnhancedFeatureCard
                    title="Access Control"
                    description="Manage and monitor access to campus facilities with advanced security protocols."
                    icon={<Shield className="text-[#59159d]" />}
                  />
                  <EnhancedFeatureCard
                    title="Incident Reporting"
                    description="Report and track security incidents with detailed documentation and follow-up procedures."
                    icon={<Zap className="text-[#59159d]" />}
                  />
                  <EnhancedFeatureCard
                    title="Surveillance Management"
                    description="Coordinate and manage campus surveillance systems for enhanced security."
                    icon={<Award className="text-[#59159d]" />}
                  />
                </div>
                
                <div className="mt-12 flex justify-center">
                  <Button onClick={navigateToSecurityLogin} className="bg-[#59159d] hover:bg-[#4a1184] text-white px-6 py-2 rounded-full flex items-center gap-2 group transition-all duration-300">
                    Explore Security Features
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Accounts Content */}
            <TabsContent value="accounts" className="mt-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 shadow-sm border border-purple-100">
                <div className="flex items-center mb-8">
                  <div className="bg-[#59159d] p-3 rounded-full mr-4">
                    <CreditCard size={32} className="text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-[#59159d]">Accounts Management System</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <EnhancedFeatureCard
                    title="Fee Management"
                    description="Process and track student fees with automated billing and payment tracking."
                    icon={<CreditCard className="text-[#59159d]" />}
                  />
                  <EnhancedFeatureCard
                    title="Financial Reporting"
                    description="Generate comprehensive financial reports for institutional budgeting and planning."
                    icon={<BarChart className="text-[#59159d]" />}
                  />
                  <EnhancedFeatureCard
                    title="Expense Tracking"
                    description="Monitor and manage institutional expenses with detailed categorization and approval workflows."
                    icon={<Zap className="text-[#59159d]" />}
                  />
                </div>
                
                <div className="mt-12 flex justify-center">
                  <Button onClick={navigateToAccountsLogin} className="bg-[#59159d] hover:bg-[#4a1184] text-white px-6 py-2 rounded-full flex items-center gap-2 group transition-all duration-300">
                    Explore Accounts Features
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* About Section */}
      <div className="py-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-purple-100 to-indigo-100 opacity-20 transform -skew-y-6"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-[#59159d] hover:bg-purple-200 transition-all duration-300 px-4 py-1.5 text-sm font-medium rounded-full">
              Our Story
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-[#59159d] mb-6">
              About NF Management System
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <div className="space-y-6">
                <p className="text-lg text-gray-600 leading-relaxed">
                  The NF Management System is a comprehensive platform that integrates Learning Management, Security, and Accounts functionalities into a unified system.
                  Our platform streamlines institutional operations, enhances security protocols, and optimizes financial management.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  With a user-friendly interface and robust features, NF Management System provides educational institutions with the tools they need to operate efficiently and effectively.
                </p>
                
                <div className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <CheckCircle size={20} className="text-[#59159d]" />
                    </div>
                    <p className="font-medium text-gray-800">Seamless Integration Across Departments</p>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <CheckCircle size={20} className="text-[#59159d]" />
                    </div>
                    <p className="font-medium text-gray-800">Real-time Data Synchronization</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <CheckCircle size={20} className="text-[#59159d]" />
                    </div>
                    <p className="font-medium text-gray-800">Advanced Security & Privacy Controls</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-r from-[#59159d] to-indigo-600 p-8 flex items-center justify-center">
                  <div className="text-center text-white">
                    <h3 className="text-3xl font-bold mb-6">Our Vision</h3>
                    <p className="text-xl leading-relaxed">Empowering educational institutions with integrated management solutions for better efficiency and outcomes.</p>
                    <div className="mt-8 flex justify-center">
                      <Award size={64} className="text-white/80" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#59159d] text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-8">
              <h3 className="text-3xl font-bold mb-4">NF Management System</h3>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">Transforming institutional management with integrated solutions</p>
            </div>
            
            <div className="w-24 h-1 bg-purple-300 rounded-full mb-8"></div>
            
            <p className="text-sm text-white/70">© {new Date().getFullYear()} NF. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Enhanced Feature Card Component with modern design
function EnhancedFeatureCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <Card className="hover:shadow-xl transition-all duration-300 border border-purple-100 hover:border-purple-200 overflow-hidden group">
      <CardContent className="p-6 relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -m-12 opacity-50 group-hover:scale-150 transition-all duration-500"></div>
        <div className="relative z-10">
          <div className="bg-purple-50 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors duration-300">
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-3 text-[#59159d] group-hover:translate-x-1 transition-transform duration-300">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Original Feature Card Component (kept for reference)
function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2 text-[#59159d]">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}
