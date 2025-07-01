'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Paperclip, X } from 'lucide-react';
import { format } from 'date-fns';

interface BillSubmissionFormProps {
  onSubmit: (billData: BillData) => void;
  serialNumber: number;
}

export interface BillData {
  serialNumber: number;
  billImage: string | null;
  ownerName: string;
  submittedInstitute: string;
  dateTime: string;
  amount: string;
  overview: string;
  paymentStatus: 'Unpaid' | 'Paid';
}

export default function BillSubmissionForm({ onSubmit, serialNumber }: BillSubmissionFormProps) {
  const [billData, setBillData] = useState<BillData>({
    serialNumber,
    billImage: null,
    ownerName: '',
    submittedInstitute: 'IINR',
    dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    amount: '',
    overview: '',
    paymentStatus: 'Unpaid'
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBillData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setBillData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setBillData(prev => ({ ...prev, billImage: result }));
      };
      
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerCameraInput = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const clearImage = () => {
    setPreviewImage(null);
    setBillData(prev => ({ ...prev, billImage: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billData.billImage) {
      alert('Please upload a bill image');
      return;
    }
    if (!billData.ownerName) {
      alert('Please enter bill owner name');
      return;
    }
    if (!billData.amount) {
      alert('Please enter bill amount');
      return;
    }
    if (!billData.overview) {
      alert('Please enter bill overview');
      return;
    }

    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit bill');
      }

      const newBill = await response.json();
      onSubmit(newBill);

      // Reset form
      setBillData({
        serialNumber: serialNumber + 1,
        billImage: null,
        ownerName: '',
        submittedInstitute: 'IINR',
        dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        amount: '',
        overview: '',
        paymentStatus: 'Unpaid'
      });
      setPreviewImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } catch (error) {
      console.error('Error submitting bill:', error);
      alert('An error occurred while submitting the bill. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input 
            id="serialNumber" 
            value={billData.serialNumber} 
            disabled 
            className="bg-gray-100"
          />
        </div>
        
        <div>
          <Label>Bill Upload</Label>
          <div className="flex items-center gap-4 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={triggerCameraInput}
              className="h-10 w-10"
            >
              <Camera size={18} />
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={triggerFileInput}
              className="h-10 w-10"
            >
              <Paperclip size={18} />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          {previewImage && (
            <div className="mt-4 relative">
              <img 
                src={previewImage} 
                alt="Bill preview" 
                className="max-h-40 rounded border border-gray-300" 
              />
              <button 
                type="button" 
                onClick={clearImage} 
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="ownerName">Bill Owner Name</Label>
          <Input 
            id="ownerName" 
            name="ownerName" 
            value={billData.ownerName} 
            onChange={handleInputChange} 
            placeholder="Enter bill owner name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="submittedInstitute">Submitted Institute</Label>
          <Select 
            value={billData.submittedInstitute} 
            onValueChange={(value) => handleSelectChange('submittedInstitute', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select institute" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IINR">IINR</SelectItem>
              <SelectItem value="KGH">KGH</SelectItem>
              <SelectItem value="ICH">ICH</SelectItem>
              <SelectItem value="CCNR">CCNR</SelectItem>
              <SelectItem value="IIHMAHS">IIHMAHS</SelectItem>
              <SelectItem value="IIPSR">IIPSR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="dateTime">Date and Time</Label>
          <Input 
            id="dateTime" 
            name="dateTime" 
            type="datetime-local" 
            value={billData.dateTime} 
            onChange={handleInputChange} 
            disabled 
            className="bg-gray-100"
          />
        </div>
        
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input 
            id="amount" 
            name="amount" 
            type="number" 
            value={billData.amount} 
            onChange={handleInputChange} 
            placeholder="Enter bill amount"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="overview">Bill Overview</Label>
          <Textarea 
            id="overview" 
            name="overview" 
            value={billData.overview} 
            onChange={handleInputChange} 
            placeholder="What is this bill for?"
            rows={3}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="paymentStatus">Payment Status</Label>
          <Input 
            id="paymentStatus" 
            value={billData.paymentStatus} 
            disabled 
            className="bg-gray-100"
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full bg-[#59159d] hover:bg-[#4a1184]">
        Submit Bill
      </Button>
    </form>
  );
}
