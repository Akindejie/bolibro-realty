import { useState, ChangeEvent, FormEvent } from 'react';
import { useUploadLeaseDocumentMutation } from '@/state/api';
import { toast } from 'react-hot-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface LeaseDocumentUploadProps {
  leaseId: number;
  onSuccess?: () => void;
}

export function LeaseDocumentUpload({
  leaseId,
  onSuccess,
}: LeaseDocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('lease-agreement');
  const [isUploading, setIsUploading] = useState(false);

  const [uploadLeaseDocument] = useUploadLeaseDocumentMutation();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!documentType) {
      toast.error('Please select a document type');
      return;
    }

    setIsUploading(true);

    try {
      await uploadLeaseDocument({
        leaseId,
        documentType,
        file,
      }).unwrap();

      toast.success('Document uploaded successfully');
      setFile(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="documentType">Document Type</Label>
        <Select value={documentType} onValueChange={setDocumentType}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lease-agreement">Lease Agreement</SelectItem>
            <SelectItem value="addendum">Lease Addendum</SelectItem>
            <SelectItem value="inspection">Property Inspection</SelectItem>
            <SelectItem value="notice">Notice</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="document">Select Document</Label>
        <Input
          id="document"
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        <p className="text-xs text-gray-500">
          Accepted formats: PDF, DOC, DOCX, JPG, PNG (max 15MB)
        </p>
      </div>

      <Button type="submit" disabled={!file || isUploading} className="w-full">
        {isUploading ? 'Uploading...' : 'Upload Document'}
      </Button>
    </form>
  );
}
