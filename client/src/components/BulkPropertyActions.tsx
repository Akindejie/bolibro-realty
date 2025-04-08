import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Check, ChevronDown, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface BulkPropertyActionsProps {
  selectedProperties: number[];
  onStatusUpdate: (status: PropertyStatus) => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const BulkPropertyActions: React.FC<BulkPropertyActionsProps> = ({
  selectedProperties,
  onStatusUpdate,
  onDelete,
  isDeleting,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleStatusChange = (status: PropertyStatus) => {
    onStatusUpdate(status);
  };

  const confirmDelete = () => {
    onDelete();
    setIsDeleteDialogOpen(false);
  };

  if (selectedProperties.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm font-medium text-gray-700">
        {selectedProperties.length} properties selected
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center">
            Update Status
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleStatusChange('Available')}>
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span>Available</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange('Rented')}>
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span>Rented</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleStatusChange('UnderMaintenance')}
          >
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <span>Under Maintenance</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleStatusChange('Inactive')}>
            <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
            <span>Inactive</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsDeleteDialogOpen(true)}
        className="flex items-center"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selectedProperties.length} Properties
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProperties.length}{' '}
              properties? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Properties'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkPropertyActions;
