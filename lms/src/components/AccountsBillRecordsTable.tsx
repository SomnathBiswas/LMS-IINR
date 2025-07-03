'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Eye, Check, X, Download, FileSpreadsheet } from 'lucide-react';
import { BillData } from './BillSubmissionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface AccountsBillRecordsTableProps {
  bills: (BillData & { _id: string })[];
  onUpdatePaymentStatus: (billId: string, status: 'Paid' | 'Unpaid') => void;
  onFilterChange?: (startDate: string, endDate: string) => void;
}

export default function AccountsBillRecordsTable({ bills, onUpdatePaymentStatus, onFilterChange }: AccountsBillRecordsTableProps) {
  const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filteredBills, setFilteredBills] = useState<(BillData & { _id: string })[]>(bills);

  useEffect(() => {
    setFilteredBills(bills);
  }, [bills]);

  const handleDateFilterChange = () => {
    if (onFilterChange) {
      onFilterChange(startDate, endDate);
    } else {
      // Local filtering if no onFilterChange provided
      if (!startDate && !endDate) {
        setFilteredBills(bills);
        return;
      }
      
      const filtered = bills.filter(bill => {
        const billDate = new Date(bill.dateTime);
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date(8640000000000000); // Max date
        
        // Set hours to 0 for start date and 23:59:59 for end date for inclusive comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        return billDate >= start && billDate <= end;
      });
      
      setFilteredBills(filtered);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    if (onFilterChange) {
      onFilterChange('', '');
    } else {
      setFilteredBills(bills);
    }
  };

  const handleDownloadBill = (bill: BillData) => {
    if (bill.billImage) {
      // Convert base64 to blob
      const byteString = atob(bill.billImage.split(',')[1]);
      const mimeString = bill.billImage.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeString });
      
      // Create a download link
      const fileName = `Bill_${bill.serialNumber}_${bill.ownerName.replace(/\s+/g, '_')}.${mimeString.split('/')[1]}`;
      saveAs(blob, fileName);
    }
  };

  const exportToExcel = () => {
    // Prepare data for Excel export
    const exportData = bills.map(bill => ({
      'Serial Number': bill.serialNumber,
      'Owner Name': bill.ownerName,
      'Institute': bill.submittedInstitute,
      'Date & Time': new Date(bill.dateTime).toLocaleString(),
      'Amount': `₹${bill.amount}`,
      'Overview': bill.overview,
      'Payment Status': bill.paymentStatus,
      'Bill': bill.billImage ? 'View Bill' : 'N/A',
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Add hyperlinks to the 'Bill' column
    bills.forEach((bill, index) => {
      if (bill.billImage) {
        const cellAddress = `H${index + 2}`; // H is the 8th column
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].l = { Target: bill.billImage, Tooltip: 'Click to view the bill image' };
        }
      }
    });
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Security Bills');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Save file
    saveAs(data, `Security_Bills_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (bills.length === 0) {
    return <div className="text-center py-8 text-gray-500">No bill records found.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-40"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-[#59159d] text-[#59159d] hover:bg-[#59159d] hover:text-white"
              onClick={handleDateFilterChange}
            >
              Apply Filter
            </Button>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-500 hover:bg-gray-100"
              onClick={clearFilters}
            >
              Clear
            </Button>
          </div>
        </div>
        <div className="flex justify-end">
        <Button
          variant="outline"
          className="flex items-center gap-2 border-[#59159d] text-[#59159d] hover:bg-[#59159d] hover:text-white"
          onClick={exportToExcel}
          disabled={bills.length === 0}
        >
          <FileSpreadsheet size={16} />
          Export to Excel
        </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>S.No</TableHead>
            <TableHead>Bill</TableHead>
            <TableHead>Owner Name</TableHead>
            <TableHead>Institute</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Overview</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBills.map((bill) => (
            <TableRow key={bill._id}>
              <TableCell>{bill.serialNumber}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setSelectedBill(bill)}
                    >
                      <Eye size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Bill Image</DialogTitle>
                    </DialogHeader>
                    {bill.billImage && (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-center">
                          <img 
                            src={bill.billImage} 
                            alt={`Bill #${bill.serialNumber}`} 
                            className ="max-h-[70vh] object-contain"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 border-[#59159d] text-[#59159d] hover:bg-[#59159d] hover:text-white"
                            onClick={() => handleDownloadBill(bill)}
                          >
                            <Download size={16} />
                            Download Bill
                          </Button>
                        </DialogFooter>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </TableCell>
              <TableCell>{bill.ownerName}</TableCell>
              <TableCell>{bill.submittedInstitute}</TableCell>
              <TableCell>{new Date(bill.dateTime).toLocaleString()}</TableCell>
              <TableCell>₹{bill.amount}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={bill.overview}>
                {bill.overview}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  bill.paymentStatus === 'Paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {bill.paymentStatus}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-1 ${
                      bill.paymentStatus === 'Paid' ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                    onClick={() => onUpdatePaymentStatus(bill._id, 'Paid')}
                    disabled={bill.paymentStatus === 'Paid'}
                  >
                    <Check size={14} />
                    Mark Paid
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-1 ${
                      bill.paymentStatus === 'Unpaid' ? 'bg-gray-100 text-gray-400' : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                    onClick={() => onUpdatePaymentStatus(bill._id, 'Unpaid')}
                    disabled={bill.paymentStatus === 'Unpaid'}
                  >
                    <X size={14} />
                    Mark Unpaid
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}