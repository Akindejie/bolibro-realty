'use client';

// This is manager property edit page
// where you can edit the property details

import { CustomFormField } from '@/components/FormField';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import { Form } from '@/components/ui/form';
import { PropertyEditFormData, propertyEditSchema } from '@/lib/schemas';
import {
  useGetPropertyQuery,
  useUpdatePropertyMutation,
  useUploadPropertyImagesMutation,
  useUpdatePropertyImagesMutation,
} from '@/state/api';
import { useAppSelector } from '@/state/redux';
import { AmenityEnum, HighlightEnum, PropertyTypeEnum } from '@/lib/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import PropertyImageGallery from '@/components/PropertyImageGallery';
import { toast } from 'sonner';

interface EditPropertyPageProps {
  params: {
    id: string;
  };
}

const EditProperty = ({ params }: EditPropertyPageProps) => {
  const propertyId = parseInt(params.id);
  const [updateProperty, { isLoading: isSubmitting, isSuccess }] =
    useUpdatePropertyMutation();
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const { data: property, isLoading } = useGetPropertyQuery(propertyId);
  const router = useRouter();
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploadPropertyImages] = useUploadPropertyImagesMutation();
  const [updatePropertyImages] = useUpdatePropertyImagesMutation();

  const form = useForm<PropertyEditFormData>({
    resolver: zodResolver(propertyEditSchema),
    defaultValues: {
      name: '',
      description: '',
      pricePerMonth: 0,
      securityDeposit: 0,
      applicationFee: 0,
      isPetsAllowed: false,
      isParkingIncluded: false,
      photoUrls: [],
      amenities: '',
      highlights: '',
      beds: 0,
      baths: 0,
      squareFeet: 0,
      propertyType: PropertyTypeEnum.Apartment,
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
  });

  useEffect(() => {
    if (property) {
      // Convert array values to strings for select fields
      const amenitiesString = Array.isArray(property.amenities)
        ? property.amenities.join(',')
        : property.amenities || '';

      const highlightsString = Array.isArray(property.highlights)
        ? property.highlights.join(',')
        : property.highlights || '';

      // Use location object if available, otherwise use direct property fields
      const address = property.location?.address || property.address || '';
      const city = property.location?.city || property.city || '';
      const state = property.location?.state || property.state || '';
      const country = property.location?.country || property.country || '';
      const postalCode =
        property.location?.postalCode || property.postalCode || '';

      form.reset({
        name: property.name || '',
        description: property.description || '',
        pricePerMonth: property.pricePerMonth || 0,
        securityDeposit: property.securityDeposit || 0,
        applicationFee: property.applicationFee || 0,
        isPetsAllowed: Boolean(property.isPetsAllowed),
        isParkingIncluded: Boolean(property.isParkingIncluded),
        photoUrls: [],
        amenities: amenitiesString,
        highlights: highlightsString,
        beds: property.beds || 0,
        baths: property.baths || 0,
        squareFeet: property.squareFeet || 0,
        propertyType: property.propertyType || PropertyTypeEnum.Apartment,
        address: address,
        city: city,
        state: state,
        country: country,
        postalCode: postalCode,
      });

      // Also update the address search field
      setAddressSearch(address);
    }
  }, [property, form]);

  useEffect(() => {
    if (isSuccess) {
      router.push('/managers/properties');
    }
  }, [isSuccess, router]);

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) return;

    setIsSearching(true);
    try {
      const geocodingUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&addressdetails=1&limit=5`;
      const geocodingResponse = await axios.get(geocodingUrl, {
        headers: {
          'User-Agent': 'Bolibro-Realty (bolibro623@gmail.com)',
        },
      });
      setAddressSuggestions(geocodingResponse.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setAddressSearch(query);

    const debouncedSearch = setTimeout(() => {
      searchAddress(query);
    }, 500);

    return () => clearTimeout(debouncedSearch);
  };

  const selectAddress = (suggestion: any) => {
    const address = suggestion.address;

    form.setValue('address', suggestion.display_name.split(',')[0] || '');
    form.setValue(
      'city',
      address.city || address.town || address.village || ''
    );
    form.setValue('state', address.state || '');
    form.setValue('country', address.country || '');
    form.setValue('postalCode', address.postcode || '');

    setShowSuggestions(false);
    setAddressSearch(suggestion.display_name);
  };

  const onSubmit = async (data: PropertyEditFormData) => {
    if (!isAuthenticated || !user?.id) {
      toast.error('No manager ID found');
      return;
    }

    try {
      const formData = new FormData();

      // Convert comma-separated strings back to arrays for server
      const amenities = data.amenities
        ? data.amenities.split(',').filter(Boolean)
        : [];
      const highlights = data.highlights
        ? data.highlights.split(',').filter(Boolean)
        : [];

      // Add all form fields to formData
      Object.entries(data).forEach(([key, value]) => {
        // Skip null or undefined values
        if (value === null || value === undefined) {
          console.log(`Skipping ${key} because it's null or undefined`);
          return;
        }

        if (key === 'photoUrls' && value && (value as File[]).length > 0) {
          const files = value as File[];
          console.log(`Adding ${files.length} photos to FormData`);
          files.forEach((file: File, index) => {
            formData.append('photos', file);
            console.log(`  - Added photo ${index + 1}: ${file.name}`);
          });
        } else if (key === 'amenities') {
          console.log(
            `Adding amenities as JSON string: ${JSON.stringify(amenities)}`
          );
          formData.append(key, JSON.stringify(amenities));
        } else if (key === 'highlights') {
          formData.append(key, JSON.stringify(highlights));
        } else if (key !== 'photos' && value !== null && value !== undefined) {
          // Skip photos as they're handled separately
          formData.append(key, String(value));
        }
      });

      // Always include the manager ID
      console.log(`Adding managerId: ${user.id}`);
      formData.append('managerId', user.id);

      // Log FormData entries for debugging
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(
          `${key}: ${
            typeof value === 'string' ? value : `[${value.constructor.name}]`
          }`
        );
      }

      // Use try-catch for the update operation
      try {
        console.log(`Submitting update request for property ID: ${propertyId}`);
        const result = await updateProperty({
          id: propertyId,
          data: formData,
        }).unwrap();

        console.log('Update result:', result);
        toast.success('Property updated successfully!');

        // Wait a moment before redirecting
        setTimeout(() => {
          router.push('/managers/properties');
        }, 1500);
      } catch (apiError: any) {
        console.error('API error updating property:', apiError);
        console.error('API error details:', JSON.stringify(apiError, null, 2));

        // Show detailed error message
        const errorMessage =
          apiError.data?.message ||
          apiError.error ||
          'Failed to update property';
        toast.error(errorMessage);

        // Log additional details for debugging
        if (apiError.status) {
          console.error(`Status code: ${apiError.status}`);
        }

        if (apiError.data?.validationErrors) {
          console.error('Validation errors:', apiError.data.validationErrors);
        }
      }
    } catch (error: any) {
      console.error('Error preparing data for update:', error);
      toast.error(`Error preparing form data: ${error.message}`);
    }
  };

  const handleFileUpload = async (files: FileList | null): Promise<void> => {
    if (!files || files.length === 0) return;

    try {
      await uploadPropertyImages({
        propertyId: String(propertyId),
        images: Array.from(files),
      }).unwrap();

      // The component will be updated through the API response and re-render
    } catch (error) {
      console.error('Failed to upload images:', error);
    }
  };

  const handleImagesChange = async (images: string[]) => {
    try {
      await updatePropertyImages({
        propertyId: String(propertyId),
        images,
      }).unwrap();
    } catch (error) {
      console.error('Failed to update images:', error);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="dashboard-container">
      <Header
        title="Edit Property"
        subtitle="Update your property listing information"
        showBackButton
        backButtonDestination="/managers/properties"
      />
      <div className="bg-white rounded-xl p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-4 space-y-10"
          >
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <CustomFormField name="name" label="Property Name" />
                <CustomFormField
                  name="description"
                  label="Description"
                  type="textarea"
                />
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Fees */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Fees</h2>
              <CustomFormField
                name="pricePerMonth"
                label="Price per Month"
                type="number"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomFormField
                  name="securityDeposit"
                  label="Security Deposit"
                  type="number"
                />
                <CustomFormField
                  name="applicationFee"
                  label="Application Fee"
                  type="number"
                />
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Property Details */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomFormField
                  name="beds"
                  label="Number of Beds"
                  type="number"
                />
                <CustomFormField
                  name="baths"
                  label="Number of Baths"
                  type="number"
                />
                <CustomFormField
                  name="squareFeet"
                  label="Square Feet"
                  type="number"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <CustomFormField
                  name="isPetsAllowed"
                  label="Pets Allowed"
                  type="switch"
                />
                <CustomFormField
                  name="isParkingIncluded"
                  label="Parking Included"
                  type="switch"
                />
              </div>
              <div className="mt-4">
                <CustomFormField
                  name="propertyType"
                  label="Property Type"
                  type="select"
                  options={Object.keys(PropertyTypeEnum).map((type) => ({
                    value: type,
                    label: type,
                  }))}
                />
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Amenities and Highlights */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Amenities and Highlights
              </h2>
              <div className="space-y-6">
                <CustomFormField
                  name="amenities"
                  label="Amenities"
                  type="select"
                  multiple={true}
                  placeholder="Select amenities"
                  options={Object.keys(AmenityEnum).map((amenity) => ({
                    value: amenity,
                    label: amenity.replace(/([A-Z])/g, ' $1').trim(),
                  }))}
                />
                <CustomFormField
                  name="highlights"
                  label="Highlights"
                  type="select"
                  multiple={true}
                  placeholder="Select highlights"
                  options={Object.keys(HighlightEnum).map((highlight) => ({
                    value: highlight,
                    label: highlight.replace(/([A-Z])/g, ' $1').trim(),
                  }))}
                />
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Photos */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Property Images</h2>
              <PropertyImageGallery
                images={property?.images || []}
                onImagesChange={handleImagesChange}
                onImageUpload={handleFileUpload}
              />
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Address Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Property Location</h2>
              <div className="mb-4">
                <label
                  htmlFor="address-search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Search Address
                </label>
                <div className="relative">
                  <Input
                    id="address-search"
                    type="text"
                    placeholder="Type to search address"
                    value={addressSearch}
                    onChange={handleAddressInputChange}
                    className="w-full p-4 border-gray-200"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  )}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => selectAddress(suggestion)}
                        >
                          <p className="font-medium">
                            {suggestion.display_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Search for an address or fill in the fields below manually
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <CustomFormField
                  name="address"
                  label="Address (Street & Number)"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CustomFormField name="city" label="City" />
                  <CustomFormField name="state" label="State/Province" />
                  <CustomFormField name="postalCode" label="Postal Code" />
                </div>
                <CustomFormField name="country" label="Country" />
              </div>
            </div>

            <Button
              type="submit"
              className="bg-primary-700 text-white w-full mt-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Property...
                </>
              ) : (
                'Update Property'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EditProperty;
