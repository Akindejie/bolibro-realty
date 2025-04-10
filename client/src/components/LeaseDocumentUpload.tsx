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

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

export function LeaseDocumentUpload({
  leaseId,
  onSuccess,
}: LeaseDocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('lease-agreement');
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [uploadLeaseDocument] = useUploadLeaseDocumentMutation();

  const validateFile = (file: File): boolean => {
    setFileError(null);

    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `File size exceeds 15MB limit (${(file.size / (1024 * 1024)).toFixed(
          2
        )}MB)`
      );
      return false;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileError(
        `File type "${file.type}" is not supported. Please use PDF, DOC, DOCX, JPG, or PNG.`
      );
      return false;
    }

    return true;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        e.target.value = ''; // Reset file input
        setFile(null);
      }
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

      // Reset file input
      const fileInput = document.getElementById('document') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      // Error is handled by the API's onQueryStarted error handler
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
          className={fileError ? 'border-red-500' : ''}
        />
        {fileError ? (
          <p className="text-xs text-red-500">{fileError}</p>
        ) : (
          <p className="text-xs text-gray-500">
            Accepted formats: PDF, DOC, DOCX, JPG, PNG (max 15MB)
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={!file || isUploading || !!fileError}
        className="w-full"
      >
        {isUploading ? 'Uploading...' : 'Upload Document'}
      </Button>
    </form>
  );
}
