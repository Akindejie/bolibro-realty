import React, { useState, useEffect } from 'react';
import {
  Bed,
  Bath,
  Home,
  Calendar,
  DollarSign,
  Check,
  X,
  MapPin,
  Edit,
} from 'lucide-react';
import { Property } from '@/types/prismaTypes';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import PropertyImageGallery from './PropertyImageGallery';
import {
  useUpdatePropertyImagesMutation,
  useUploadPropertyImagesMutation,
} from '@/state/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PropertyDetailsProps {
  property: Property;
  isEditable?: boolean;
}

// Define PropertyStatus type directly
type PropertyStatus = 'Available' | 'Rented' | 'UnderMaintenance' | 'Inactive';

const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  property,
  isEditable = false,
}) => {
  const [uploadPropertyImages] = useUploadPropertyImagesMutation();
  const [updatePropertyImages] = useUpdatePropertyImagesMutation();
  const [localImages, setLocalImages] = useState<string[]>([]);
  const router = useRouter();

  // Initialize localImages from property data
  useEffect(() => {
    if (property) {
      // First check if we have stored images in localStorage
      const storedImagesKey = `property_${property.id}_images`;
      const storedImages = localStorage.getItem(storedImagesKey);

      if (storedImages) {
        try {
          const parsedImages = JSON.parse(storedImages);
          setLocalImages(parsedImages);

          // Attempt to sync with server if we're online
          if (navigator.onLine) {
            updatePropertyImages({
              propertyId: String(property.id),
              images: parsedImages,
            })
              .unwrap()
              .then(() => {
                localStorage.removeItem(storedImagesKey);
                console.log('Successfully synced stored images with server');
              })
              .catch((err) => {
                console.error('Failed to sync stored images:', err);
                // Don't remove from localStorage so we can try again later
              });
          }
        } catch (e) {
          console.error('Error parsing stored images:', e);
          localStorage.removeItem(storedImagesKey);
        }
      } else {
        // Use property images from the API
        // Better handling of image arrays - combine both fields and remove duplicates
        const imagesArray = Array.isArray(property.images)
          ? property.images
          : [];
        const photoUrlsArray = Array.isArray(property.photoUrls)
          ? property.photoUrls
          : [];

        // Combine both arrays and remove duplicates
        const allPropertyImages = [
          ...new Set([...imagesArray, ...photoUrlsArray]),
        ];

        // Only update local images if they've changed
        const currentImagesString = JSON.stringify(localImages);
        const newImagesString = JSON.stringify(allPropertyImages);

        if (currentImagesString !== newImagesString) {
          setLocalImages(allPropertyImages);
        }
      }
    }
  }, [property, property?.id, updatePropertyImages]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !property) return;

    try {
      // Use RTK mutation for upload
      const result = await uploadPropertyImages({
        propertyId: String(property.id),
        images: Array.from(files),
      }).unwrap();

      if (result.imageUrls && Array.isArray(result.imageUrls)) {
        // Update local state immediately
        const updatedImages = [...localImages, ...result.imageUrls];
        setLocalImages(updatedImages);

        // Store in localStorage as backup
        localStorage.setItem(
          `property_${property.id}_images`,
          JSON.stringify(updatedImages)
        );

        // Try to update server
        try {
          await updatePropertyImages({
            propertyId: String(property.id),
            images: updatedImages,
          }).unwrap();

          // Successfully updated on server, clear localStorage
          localStorage.removeItem(`property_${property.id}_images`);
          toast.success('Images uploaded successfully');

          // Force a page refresh after a short delay to ensure the changes are visible
          setTimeout(() => {
            const refreshTimestamp = Date.now();
            const propertyDetailsUrl = `/managers/properties/${property.id}?refresh=${refreshTimestamp}`;
            router.push(propertyDetailsUrl);
          }, 800);
        } catch (updateErr) {
          console.error('Failed to update images on server:', updateErr);
          // Keep the localStorage backup for later sync
          toast.success(
            'Images uploaded but not synced with server. Changes saved locally.'
          );
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);

      // Check if it's a specific error with a message from the server
      let errorMessage = 'Failed to upload images. Please try again.';

      if (error?.data?.message) {
        errorMessage = `Server error: ${error.data.message}`;
        console.error('Server error details:', error.data);
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      }

      toast.error(errorMessage);
    }
  };

  const handleImagesChange = (newImages: string[]) => {
    if (!property) return;

    // Update local state immediately for responsive UI
    setLocalImages(newImages);

    // Save to localStorage as backup
    localStorage.setItem(
      `property_${property.id}_images`,
      JSON.stringify(newImages)
    );

    // Try to update server
    updatePropertyImages({
      propertyId: String(property.id),
      images: newImages,
    })
      .unwrap()
      .then(() => {
        localStorage.removeItem(`property_${property.id}_images`);
        toast.success('Images updated successfully');

        // Force a page refresh after a short delay to ensure the changes are visible
        setTimeout(() => {
          const refreshTimestamp = Date.now();
          const propertyDetailsUrl = `/managers/properties/${property.id}?refresh=${refreshTimestamp}`;
          router.push(propertyDetailsUrl);
        }, 800);
      })
      .catch((err) => {
        console.error('Failed to update images on server:', err);
        // We already saved to localStorage above, so the changes won't be lost
        if (navigator.onLine) {
          toast.error(
            'Failed to update images on server. Changes saved locally and will sync automatically when possible.'
          );
        }
      });
  };

  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Rented':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'UnderMaintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Image Gallery */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Property Details</h2>
            {isEditable && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/managers/properties/edit/${property.id}`)
                }
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Property
              </Button>
            )}
          </div>
          <PropertyImageGallery
            images={localImages}
            onImagesChange={isEditable ? handleImagesChange : undefined}
            onImageUpload={isEditable ? handleFileUpload : undefined}
          />
        </div>

        {/* Property Info */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">{property.name}</h1>
              <div className="flex items-center mt-1">
                <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                <p className="text-gray-600">
                  {property.location?.address || property.address},
                  {property.location?.city || property.city},
                  {property.location?.state || property.state},
                  {property.location?.postalCode || property.postalCode}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(property.status)}>
              {property.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Price</h3>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-2xl font-bold">
                  ${property.pricePerMonth.toLocaleString()}
                </span>
                <span className="text-gray-500 ml-1">/month</span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">Security Deposit</p>
                  <p className="font-semibold">
                    ${property.securityDeposit.toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">Application Fee</p>
                  <p className="font-semibold">
                    ${property.applicationFee.toLocaleString()}
                  </p>
                </div>
                {property.cleaningFee && (
                  <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">Cleaning Fee</p>
                    <p className="font-semibold">
                      ${property.cleaningFee.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Property Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 text-gray-500 mr-2" />
                    <p className="text-sm font-medium">Beds</p>
                  </div>
                  <p className="font-semibold">{property.beds}</p>
                </div>
                <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 text-gray-500 mr-2" />
                    <p className="text-sm font-medium">Baths</p>
                  </div>
                  <p className="font-semibold">{property.baths}</p>
                </div>
                <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <Home className="h-4 w-4 text-gray-500 mr-2" />
                    <p className="text-sm font-medium">Square Feet</p>
                  </div>
                  <p className="font-semibold">{property.squareFeet}</p>
                </div>
                <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <Home className="h-4 w-4 text-gray-500 mr-2" />
                    <p className="text-sm font-medium">Property Type</p>
                  </div>
                  <p className="font-semibold">{property.propertyType}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Features</h3>
              <div className="space-y-2">
                <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md">
                  {property.isPetsAllowed ? (
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <p className="text-sm font-medium">Pets Allowed</p>
                </div>
                <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md">
                  {property.isParkingIncluded ? (
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <p className="text-sm font-medium">Parking Included</p>
                </div>
                <div className="px-3 py-2 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Available on</p>
                    <p className="font-semibold text-sm">
                      {new Date(property.postedDate).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="my-6">
            <h3 className="text-lg font-semibold mb-2">
              Amenities & Highlights
            </h3>
            <div className="bg-gray-50 rounded-md p-4">
              {property.amenities?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map(
                      (amenity: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-white border-gray-300"
                        >
                          {amenity}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

              {property.highlights?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Highlights</h4>
                  <div className="flex flex-wrap gap-2">
                    {property.highlights.map(
                      (highlight: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-white border-gray-300"
                        >
                          {highlight}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

              {!property.amenities?.length && !property.highlights?.length && (
                <p className="text-sm text-gray-500">
                  No amenities or highlights listed
                </p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-gray-700">{property.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
