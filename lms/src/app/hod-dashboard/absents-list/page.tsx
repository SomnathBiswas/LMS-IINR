"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ListX } from "lucide-react";

interface AbsentRecord {
  _id: string;
  date: string;
  facultyName: string;
  subject: string;
  absentStudents: string[];
}

export default function AbsentsListPage() {
  const [records, setRecords] = useState<AbsentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/hod/absent-records');
        if (!response.ok) {
          throw new Error('Failed to fetch absent records');
        }
        const data = await response.json();
        setRecords(data.records);
      } catch (error) {
        console.error('Error fetching absent records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Absent Students List</h1>
        <p className="text-gray-600">A log of all students marked as absent by the HOD.</p>
      </div>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading records...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center p-12">
            <ListX className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No absent records</h3>
            <p className="mt-1 text-sm text-gray-500">No students have been marked as absent yet.</p>
          </div>
        ) : (
          <ScrollArea className="h-[70vh]">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Faculty Name</th>
                  <th className="p-3 text-left font-medium">Class/Subject</th>
                  <th className="p-3 text-left font-medium">Absent Students</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{format(new Date(record.date), 'PPP')}</td>
                    <td className="p-3">{record.facultyName}</td>
                    <td className="p-3">{record.subject}</td>
                    <td className="p-3">
                      <ul className="list-disc list-inside">
                        {record.absentStudents.map((student, index) => (
                          <li key={index}>{student}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}