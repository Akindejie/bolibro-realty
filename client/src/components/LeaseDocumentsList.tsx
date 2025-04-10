import { formatDate } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { FileIcon, FileTextIcon, ImageIcon, FileCheckIcon } from 'lucide-react';

interface LeaseDocument {
  id: number;
  documentType: string;
  documentUrl: string;
  uploadedAt: string;
  uploadedByRole: string;
}

interface LeaseDocumentsListProps {
  documents: LeaseDocument[];
  isLoading?: boolean;
}

export function LeaseDocumentsList({
  documents,
  isLoading = false,
}: LeaseDocumentsListProps) {
  if (isLoading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-4">No documents found for this lease.</div>
    );
  }

  const getDocumentIcon = (documentType: string, url: string) => {
    if (url.endsWith('.pdf')) {
      return <FileIcon className="h-4 w-4 text-red-500" />;
    } else if (url.endsWith('.doc') || url.endsWith('.docx')) {
      return <FileTextIcon className="h-4 w-4 text-blue-500" />;
    } else if (url.includes('image') || url.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return <ImageIcon className="h-4 w-4 text-green-500" />;
    }
    return <FileCheckIcon className="h-4 w-4" />;
  };

  const getDocumentTypeName = (type: string) => {
    const types: Record<string, string> = {
      'lease-agreement': 'Lease Agreement',
      addendum: 'Lease Addendum',
      inspection: 'Property Inspection',
      notice: 'Notice',
      other: 'Other Document',
    };
    return types[type] || type;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="flex items-center space-x-2">
                {getDocumentIcon(doc.documentType, doc.documentUrl)}
                <span>{getDocumentTypeName(doc.documentType)}</span>
              </TableCell>
              <TableCell>{formatDate(new Date(doc.uploadedAt))}</TableCell>
              <TableCell className="capitalize">{doc.uploadedByRole}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(doc.documentUrl, '_blank')}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
