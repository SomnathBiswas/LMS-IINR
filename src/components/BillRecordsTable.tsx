'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Download, FileSpreadsheet, FileDown } from 'lucide-react';
import { BillData } from './BillSubmissionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

interface BillRecordsTableProps {
  bills: BillData[];
}

export default function BillRecordsTable({ bills }: BillRecordsTableProps) {
  const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
  
  // Function to download bill image
  const downloadBillImage = (bill: BillData) => {
    if (!bill.billImage) return;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = bill.billImage;
    link.download = `Bill_${bill.serialNumber}_${bill.ownerName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Function to export bills to CSV
  const exportToCSV = () => {
    // Create CSV headers
    const headers = ['Serial Number', 'Owner Name', 'Institute', 'Date & Time', 'Amount', 'Overview', 'Payment Status'];
    
    // Convert bill data to CSV rows
    const csvRows = bills.map(bill => [
      bill.serialNumber,
      bill.ownerName,
      bill.submittedInstitute,
      new Date(bill.dateTime).toLocaleString(),
      bill.amount,
      bill.overview,
      bill.paymentStatus
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bill_Records_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Function to create a ZIP file with Excel and bill images
  const exportToExcel = async () => {
    // Create Excel without images first
    const xlsHeaders = '<tr><th>Serial Number</th><th>Owner Name</th><th>Institute</th><th>Date &amp; Time</th><th>Amount</th><th>Overview</th><th>Payment Status</th><th>Bill Image</th></tr>';
    
    // Convert bill data to Excel rows with simple text for bill images
    const xlsRows = bills.map(bill => {
      // Just show text indicating if bill image is available
      const imageText = bill.billImage ? 'Bill Image Available' : 'No image';
      
      return `
      <tr>
        <td>${bill.serialNumber}</td>
        <td>${bill.ownerName}</td>
        <td>${bill.submittedInstitute}</td>
        <td>${new Date(bill.dateTime).toLocaleString()}</td>
        <td>${bill.amount}</td>
        <td>${bill.overview}</td>
        <td>${bill.paymentStatus}</td>
        <td>${imageText}</td>
      </tr>
    `;
    }).join('');
    
    // Create a note at the top of the Excel file
    const noteRow = `
      <tr>
        <td colspan="8" style="background-color: #FFFFCC; font-weight: bold; padding: 10px;">
          Note: The "Bill Image" column indicates whether a bill image is available. To view images, please use the Eye icon in the application.
        </td>
      </tr>
    `;
    
    // Combine into a simple HTML table that Excel can open
    const xlsContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Bill Records</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h2>Bill Records Export - ${new Date().toLocaleDateString()}</h2>
          <table>
            ${noteRow}
            ${xlsHeaders}
            ${xlsRows}
          </table>
        </body>
      </html>
    `;
    
    // Create a separate PDF with bill images for reference
    // For now, we'll just create a better Excel file with instructions
    // A full PDF generation would require additional libraries
    
    // Create a Blob and download link
    const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bill_Records_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (bills.length === 0) {
    return <div className="text-center py-8 text-gray-500">No bill records found. Submit your first bill above.</div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={exportToCSV}
        >
          <FileDown size={16} />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={exportToExcel}
        >
          <FileSpreadsheet size={16} />
          Export Excel
        </Button>

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
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill, index) => (
            <TableRow key={`bill-${bill.serialNumber}-${index}`}>
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
                      <div className="flex justify-center">
                        <img 
                          src={bill.billImage} 
                          alt={`Bill #${bill.serialNumber}`} 
                          className="max-h-[70vh] object-contain"
                        />
                      </div>
                    )}
                    <DialogFooter className="mt-4">
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-1"
                        onClick={() => downloadBillImage(bill)}
                      >
                        <Download size={16} />
                        Download Image
                      </Button>
                    </DialogFooter>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
