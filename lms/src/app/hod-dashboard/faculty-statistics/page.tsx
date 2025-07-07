"use client";

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  ChevronDown, 
  Check, 
  X, 
  Clock, 
  Loader2,
  BarChart3,
  PieChart,
  CalendarDays
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Faculty {
  _id: string;
  name: string;
  department?: string;
  email?: string;
}

interface FacultyStatistics {
  facultyId: string;
  facultyName: string;
  totalClasses: number;
  takenClasses: number;
  missedClasses: number;
  handoverClasses: number;
  attendancePercentage: number;
  classes: {
    date: string;
    subject: string;
    timeSlot: string;
    status: string;
    roomNumber: string;
  }[];
}

export default function FacultyStatisticsPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [statistics, setStatistics] = useState<FacultyStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Fetch faculties on component mount
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await fetch('/api/faculty/list');
        const data = await response.json();
        if (data.facultyMembers && Array.isArray(data.facultyMembers)) {
          setFaculties(data.facultyMembers);
        } else {
          console.error('Invalid faculty data format:', data);
        }
      } catch (error) {
        console.error('Error fetching faculties:', error);
      }
    };
    
    fetchFaculties();
  }, []);
  
  // Function to fetch faculty statistics
  const fetchStatistics = async () => {
    if (!selectedFacultyId) {
      alert('Please select a faculty member');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/hod/faculty-statistics?facultyId=${selectedFacultyId}&startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      
      if (data.success && data.statistics) {
        setStatistics(data.statistics);
      } else {
        alert(data.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      alert('An error occurred while fetching statistics');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'taken':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'handover':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
      case 'window-open':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Function to format date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Faculty Statistics Report</h1>
          <p className="text-gray-600">View attendance statistics for faculty members</p>
        </div>
      </div>
      
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="faculty">Select Faculty</Label>
            <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
              <SelectTrigger id="faculty" className="w-full">
                <SelectValue placeholder="Select faculty" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty._id} value={faculty._id}>
                    {faculty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={fetchStatistics} 
              disabled={loading || !selectedFacultyId}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
      
      {statistics && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">{statistics.facultyName}</h2>
                <p className="text-gray-600">Report Period: {formatDate(startDate)} to {formatDate(endDate)}</p>
              </div>
              <div className="mt-2 md:mt-0">
                <span className="text-sm text-gray-500">Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}</span>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Class Details</TabsTrigger>
                <TabsTrigger value="chart">Charts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Total Classes</p>
                        <h3 className="text-2xl font-bold">{statistics.totalClasses}</h3>
                      </div>
                      <CalendarDays className="h-8 w-8 text-blue-500" />
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-green-50 border-green-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Classes Taken</p>
                        <h3 className="text-2xl font-bold">{statistics.takenClasses}</h3>
                      </div>
                      <Check className="h-8 w-8 text-green-500" />
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-red-50 border-red-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Classes Missed</p>
                        <h3 className="text-2xl font-bold">{statistics.missedClasses}</h3>
                      </div>
                      <X className="h-8 w-8 text-red-500" />
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-purple-50 border-purple-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Attendance Rate</p>
                        <h3 className="text-2xl font-bold">{statistics.attendancePercentage}%</h3>
                      </div>
                      <PieChart className="h-8 w-8 text-purple-500" />
                    </div>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Attendance Summary</h3>
                  <Card className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Classes Taken: {statistics.takenClasses}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>Classes Missed: {statistics.missedClasses}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>Classes Handed Over: {statistics.handoverClasses}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="h-24 flex items-end gap-2">
                          <div 
                            className="bg-green-500 rounded-t-md w-8" 
                            style={{ 
                              height: `${(statistics.takenClasses / statistics.totalClasses) * 100}%`,
                              minHeight: '4px'
                            }}
                          ></div>
                          <div 
                            className="bg-red-500 rounded-t-md w-8" 
                            style={{ 
                              height: `${(statistics.missedClasses / statistics.totalClasses) * 100}%`,
                              minHeight: '4px'
                            }}
                          ></div>
                          <div 
                            className="bg-blue-500 rounded-t-md w-8" 
                            style={{ 
                              height: `${(statistics.handoverClasses / statistics.totalClasses) * 100}%`,
                              minHeight: '4px'
                            }}
                          ></div>
                        </div>
                        <div className="flex gap-2 text-xs text-gray-500 mt-1">
                          <div className="w-8 text-center">Taken</div>
                          <div className="w-8 text-center">Missed</div>
                          <div className="w-8 text-center">Handover</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Remarks</h3>
                  <Card className="p-4">
                    <p className="text-gray-700">
                      {statistics.attendancePercentage >= 90 
                        ? "Excellent attendance record. Faculty has maintained a very high attendance rate."
                        : statistics.attendancePercentage >= 75
                        ? "Good attendance record. Faculty has maintained a satisfactory attendance rate."
                        : statistics.attendancePercentage >= 60
                        ? "Average attendance record. Faculty should improve their attendance rate."
                        : "Poor attendance record. Faculty needs to significantly improve their attendance rate."
                      }
                    </p>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="pt-4">
                <Card className="p-4">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableCaption>Class attendance details for {statistics.facultyName}</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Time Slot</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statistics.classes.map((cls, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(cls.date)}</TableCell>
                            <TableCell>{cls.subject}</TableCell>
                            <TableCell>{cls.timeSlot}</TableCell>
                            <TableCell>{cls.roomNumber}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(cls.status)}`}>
                                {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </Card>
              </TabsContent>
              
              <TabsContent value="chart" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Attendance Distribution</h3>
                    <div className="flex justify-center">
                      <div className="relative w-48 h-48">
                        {/* Simple pie chart visualization */}
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {/* Taken classes slice */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#22c55e"
                            strokeWidth="20"
                            strokeDasharray={`${(statistics.takenClasses / statistics.totalClasses) * 251.2} 251.2`}
                            transform="rotate(-90 50 50)"
                          />
                          {/* Missed classes slice */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#ef4444"
                            strokeWidth="20"
                            strokeDasharray={`${(statistics.missedClasses / statistics.totalClasses) * 251.2} 251.2`}
                            strokeDashoffset={`${-(statistics.takenClasses / statistics.totalClasses) * 251.2}`}
                            transform="rotate(-90 50 50)"
                          />
                          {/* Handover classes slice */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#3b82f6"
                            strokeWidth="20"
                            strokeDasharray={`${(statistics.handoverClasses / statistics.totalClasses) * 251.2} 251.2`}
                            strokeDashoffset={`${-((statistics.takenClasses + statistics.missedClasses) / statistics.totalClasses) * 251.2}`}
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Taken ({statistics.takenClasses})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm">Missed ({statistics.missedClasses})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Handover ({statistics.handoverClasses})</span>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Attendance Rate</span>
                          <span className="text-sm font-medium">{statistics.attendancePercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${statistics.attendancePercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Classes Taken Rate</span>
                          <span className="text-sm font-medium">
                            {statistics.totalClasses > 0 
                              ? Math.round((statistics.takenClasses / statistics.totalClasses) * 100) 
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${statistics.totalClasses > 0 
                                ? (statistics.takenClasses / statistics.totalClasses) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Classes Missed Rate</span>
                          <span className="text-sm font-medium">
                            {statistics.totalClasses > 0 
                              ? Math.round((statistics.missedClasses / statistics.totalClasses) * 100) 
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ 
                              width: `${statistics.totalClasses > 0 
                                ? (statistics.missedClasses / statistics.totalClasses) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Classes Handover Rate</span>
                          <span className="text-sm font-medium">
                            {statistics.totalClasses > 0 
                              ? Math.round((statistics.handoverClasses / statistics.totalClasses) * 100) 
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${statistics.totalClasses > 0 
                                ? (statistics.handoverClasses / statistics.totalClasses) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      )}
    </div>
  );
}
