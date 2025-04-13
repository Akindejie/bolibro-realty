'use client';

// This is manager property page
// It shows all the properties that the manager has created

import Card from '@/components/Card';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import Breadcrumbs from '@/components/Breadcrumbs';
import BulkPropertyActions from '@/components/BulkPropertyActions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useDeletePropertyMutation,
  useGetManagerPropertiesQuery,
  useUpdateBulkPropertyStatusMutation,
} from '@/state/api';
import { useAppSelector } from '@/state/redux';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const Properties = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  console.log('User object:', JSON.stringify(user, null, 2));

  // Get the ID from the JWT token if available, otherwise fall back to the user.id
  // The JWT token contains the correct Supabase ID we need to use
  const userId = user?.supabaseId || user?.id; // If supabaseId doesn't exist, fall back to id

  const [deleteProperty] = useDeletePropertyMutation();
  const [updateBulkPropertyStatus] = useUpdateBulkPropertyStatusMutation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<number | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const router = useRouter();

  const {
    data: managerProperties,
    isLoading,
    error,
  } = useGetManagerPropertiesQuery(userId || '', {
    skip: !isAuthenticated || !userId,
  });

  const handleDeleteProperty = (propertyId: number) => {
    setPropertyToDelete(propertyId);
    setIsDeleteDialogOpen(true);
  };

  const handleEditProperty = (propertyId: number) => {
    router.push(`/managers/properties/edit/${propertyId}`);
  };

  const confirmDelete = async () => {
    if (propertyToDelete) {
      await deleteProperty(propertyToDelete);
      setIsDeleteDialogOpen(false);
    }
  };

  const handlePropertySelection = (propertyId: number) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleSelectAll = () => {
    if (managerProperties) {
      if (selectedProperties.length === managerProperties.length) {
        // Deselect all
        setSelectedProperties([]);
      } else {
        // Select all
        setSelectedProperties(managerProperties.map((property) => property.id));
      }
    }
  };

  const handleBulkStatusUpdate = async (status: PropertyStatus) => {
    if (selectedProperties.length > 0) {
      await updateBulkPropertyStatus({
        propertyIds: selectedProperties,
        status,
      });
      setSelectedProperties([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProperties.length === 0) return;

    setIsBulkDeleting(true);
    try {
      // Delete properties one by one, we don't have a bulk delete endpoint
      for (const id of selectedProperties) {
        await deleteProperty(id);
      }
      setSelectedProperties([]);
    } catch (error) {
      console.error('Error deleting properties:', error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading manager properties</div>;

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/managers' },
    { label: 'Properties', href: '/managers/properties' },
  ];

  const areAllSelected =
    managerProperties &&
    managerProperties.length > 0 &&
    selectedProperties.length === managerProperties.length;

  return (
    <div className="dashboard-container">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex justify-between items-center">
        <Header
          title="My Properties"
          subtitle="View and manage your property listings"
        />
        <div className="flex items-center gap-2">
          <div
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <Checkbox checked={areAllSelected} />
            <span>{areAllSelected ? 'Deselect All' : 'Select All'}</span>
          </div>
        </div>
      </div>

      <BulkPropertyActions
        selectedProperties={selectedProperties}
        onStatusUpdate={handleBulkStatusUpdate}
        onDelete={handleBulkDelete}
        isDeleting={isBulkDeleting}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {managerProperties?.map((property) => (
          <div key={property.id} className="relative">
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={selectedProperties.includes(property.id)}
                onCheckedChange={() => handlePropertySelection(property.id)}
                className="bg-white/80 border-gray-400"
              />
            </div>
            <Card
              key={property.id}
              property={property}
              isFavorite={false}
              onFavoriteToggle={() => {}}
              showFavoriteButton={false}
              propertyLink={`/managers/properties/${property.id}`}
              isManager={true}
              onDelete={handleDeleteProperty}
              onEdit={handleEditProperty}
            />
          </div>
        ))}
      </div>
      {(!managerProperties || managerProperties.length === 0) && (
        <p>You don&apos;t manage any properties</p>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Property Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Properties;
