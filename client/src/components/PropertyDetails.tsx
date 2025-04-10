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
  const [localImages, setLocalImages] = React.useState<string[]>([]);
  const router = useRouter();

  // Initialize localImages from property data
  useEffect(() => {
    if (property) {
      console.log('Property data received:', property);

      // First check if we have stored images in localStorage
      const storedImagesKey = `property_${property.id}_images`;
      const storedImages = localStorage.getItem(storedImagesKey);

      if (storedImages) {
        try {
          const parsedImages = JSON.parse(storedImages);
          setLocalImages(parsedImages);
          console.log('Loaded images from local storage:', parsedImages);

          // Attempt to sync with server if we're online
          if (navigator.onLine) {
            updatePropertyImages({
              propertyId: String(property.id),
              images: parsedImages,
            })
              .unwrap()
              .then(() => {
                console.log('Successfully synced stored images with server');
                localStorage.removeItem(storedImagesKey);
              })
              .catch((err) => {
                console.error('Failed to sync stored images:', err);
              });
          }
        } catch (e) {
          console.error('Failed to parse stored images:', e);
          localStorage.removeItem(storedImagesKey);
        }
      }

      // Use property images
      // Better handling of image arrays - combine both fields and remove duplicates
      const imagesArray = Array.isArray(property.images) ? property.images : [];
      const photoUrlsArray = Array.isArray(property.photoUrls)
        ? property.photoUrls
        : [];

      // Combine both arrays and remove duplicates
      const allPropertyImages = [
        ...new Set([...imagesArray, ...photoUrlsArray]),
      ];

      console.log(`Found ${imagesArray.length} images in 'images' field`);
      console.log(`Found ${photoUrlsArray.length} images in 'photoUrls' field`);
      console.log(
        `Combined ${allPropertyImages.length} unique images from both fields`
      );

      setLocalImages(allPropertyImages);
    }
  }, [property, updatePropertyImages]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !property) return;

    try {
      console.log(
        `Uploading ${files.length} files for property ${property.id}...`
      );

      // Use RTK mutation for upload
      const result = await uploadPropertyImages({
        propertyId: String(property.id),
        images: Array.from(files),
      }).unwrap();

      console.log('Upload response:', result);

      if (result.imageUrls && Array.isArray(result.imageUrls)) {
        // Update local state immediately
        const updatedImages = [...localImages, ...result.imageUrls];
        console.log('Updating local images to:', updatedImages);
        setLocalImages(updatedImages);

        // Store in localStorage as backup
        localStorage.setItem(
          `property_${property.id}_images`,
          JSON.stringify(updatedImages)
        );

        // Try to update server
        updatePropertyImages({
          propertyId: String(property.id),
          images: updatedImages,
        })
          .unwrap()
          .then(() => {
            console.log('Successfully updated images on server');
            localStorage.removeItem(`property_${property.id}_images`);
          })
          .catch((err) => {
            console.error('Failed to update images on server:', err);
            // Keep the localStorage backup for later sync
          });
      }

      toast.success('Images uploaded successfully');
    } catch (error: any) {
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

    console.log('Images changed to:', newImages);

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
        console.log('Successfully updated images on server');
        localStorage.removeItem(`property_${property.id}_images`);
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
            <div className="flex items-center">
              <Bed className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Beds</p>
                <p className="font-semibold">{property.beds}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Bath className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Baths</p>
                <p className="font-semibold">{property.baths}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Home className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Square Feet</p>
                <p className="font-semibold">{property.squareFeet}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Posted</p>
                <p className="font-semibold">
                  {new Date(property.postedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
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
              <div className="mt-2 text-sm text-gray-600">
                <p>
                  Security Deposit: ${property.securityDeposit.toLocaleString()}
                </p>
                <p>
                  Application Fee: ${property.applicationFee.toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Features</h3>
              <ul className="space-y-1">
                <li className="flex items-center">
                  {property.isPetsAllowed ? (
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  Pets Allowed
                </li>
                <li className="flex items-center">
                  {property.isParkingIncluded ? (
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  Parking Included
                </li>
                <li className="flex items-center">
                  <Home className="h-4 w-4 text-gray-500 mr-2" />
                  {property.propertyType}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities?.map((amenity: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-gray-100">
                    {amenity}
                  </Badge>
                ))}
                {property.amenities?.length === 0 && (
                  <p className="text-sm text-gray-500">No amenities listed</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{property.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
