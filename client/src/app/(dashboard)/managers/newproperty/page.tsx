'use client';

import { CustomFormField } from '@/components/FormField';
import Header from '@/components/Header';
import { Form } from '@/components/ui/form';
import { PropertyFormData, propertySchema } from '@/lib/schemas';
import { useCreatePropertyMutation, useGetAuthUserQuery } from '@/state/api';
import { AmenityEnum, HighlightEnum, PropertyTypeEnum } from '@/lib/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const NewProperty = () => {
  const [createProperty, { isLoading: isSubmitting, isSuccess }] =
    useCreatePropertyMutation();
  const { data: authUser } = useGetAuthUserQuery();
  const router = useRouter();
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      description: '',
      pricePerMonth: 1000,
      securityDeposit: 500,
      applicationFee: 100,
      isPetsAllowed: true,
      isParkingIncluded: true,
      photoUrls: [],
      amenities: '',
      highlights: '',
      beds: 1,
      baths: 1,
      squareFeet: 1000,
      propertyType: PropertyTypeEnum.Apartment,
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
  });

  useEffect(() => {
    if (isSuccess) {
      router.push('/managers/properties');
    }
  }, [isSuccess, router]);

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) return;

    setIsSearching(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'Bolibro-Rentals (bolibro623@gmail.com)',
          },
        }
      );
      setAddressSuggestions(response.data);
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

  const onSubmit = async (data: PropertyFormData) => {
    if (!authUser?.cognitoInfo?.userId) {
      throw new Error('No manager ID found');
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'photoUrls') {
        const files = value as File[];
        files.forEach((file: File) => {
          formData.append('photos', file);
        });
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    formData.append('managerCognitoId', authUser.cognitoInfo.userId);

    await createProperty(formData);
  };

  return (
    <div className="dashboard-container">
      <Header
        title="Add New Property"
        subtitle="Create a new property listing with detailed information"
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
                  options={Object.keys(AmenityEnum).map((amenity) => ({
                    value: amenity,
                    label: amenity,
                  }))}
                />
                <CustomFormField
                  name="highlights"
                  label="Highlights"
                  type="select"
                  options={Object.keys(HighlightEnum).map((highlight) => ({
                    value: highlight,
                    label: highlight,
                  }))}
                />
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Photos */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Photos</h2>
              <CustomFormField
                name="photoUrls"
                label="Property Photos"
                type="file"
                accept="image/*"
              />
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Additional Information */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Property Location</h2>

              {/* Address Search with Suggestions */}
              <div className="relative mb-4">
                <label className="text-sm font-medium mb-1 block">
                  Search Address
                </label>
                <div className="relative">
                  <Input
                    value={addressSearch}
                    onChange={handleAddressInputChange}
                    placeholder="Type to search address"
                    className="w-full p-4 border border-gray-200"
                  />
                  {isSearching && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
                  )}
                </div>

                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => selectAddress(suggestion)}
                      >
                        {suggestion.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <CustomFormField name="address" label="Address" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CustomFormField name="city" label="City" />
                  <CustomFormField name="state" label="State" />
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
                  Creating Property...
                </>
              ) : (
                'Create Property'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default NewProperty;
