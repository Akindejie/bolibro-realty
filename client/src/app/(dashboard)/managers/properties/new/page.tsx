import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const NewPropertyPage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [formData_, setFormData_] = useState({
    name: '',
    description: '',
    type: 'APARTMENT',
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    price: 0,
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
  });
  const [amenitiesSelect, setAmenitiesSelect] = useState<string[]>([]);
  const [highlightsSelect, setHighlightsSelect] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Upload images first if there are any new ones
      let allImages = [...propertyImages];

      // First upload any new local images
      if (newImages.length > 0) {
        console.log(`Uploading ${newImages.length} new images`);
        const uploadResults = await uploadPropertyImages(newImages);

        if (uploadResults.success && uploadResults.urls) {
          console.log('Successfully uploaded images:', uploadResults.urls);
          allImages = [...allImages, ...uploadResults.urls];
        } else {
          console.error('Failed to upload images:', uploadResults.error);
          setFormError(`Failed to upload images: ${uploadResults.error}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare form data
      const formData = new FormData();

      // Basic property info
      formData.append('name', formData_.name);
      formData.append('description', formData_.description || '');
      formData.append('type', formData_.type || 'APARTMENT');
      formData.append('bedrooms', String(formData_.bedrooms || 1));
      formData.append('bathrooms', String(formData_.bathrooms || 1));
      formData.append('area', String(formData_.area || 0));
      formData.append('price', String(formData_.price || 0));

      // Address information
      formData.append('address', formData_.address || '');
      formData.append('city', formData_.city || '');
      formData.append('state', formData_.state || '');
      formData.append('postalCode', formData_.postalCode || '');
      formData.append('country', formData_.country || 'USA');

      // Manager information
      formData.append('managerId', String(userInfo?.id || ''));

      // Arrays and complex data
      formData.append('amenities', JSON.stringify(amenitiesSelect));
      formData.append('highlights', JSON.stringify(highlightsSelect));

      // Add all images (both previously uploaded and new ones)
      if (allImages.length > 0) {
        formData.append('images', JSON.stringify(allImages));
      }

      console.log('Submitting property with data:', {
        name: formData_.name,
        type: formData_.type,
        imageCount: allImages.length,
        amenities: amenitiesSelect.length,
        highlights: highlightsSelect.length,
      });

      const response = await fetch('/api/properties', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create property');
      }

      // Show success toast
      toast({
        title: 'Property Created',
        description: 'The property has been successfully created.',
        variant: 'success',
      });

      // Redirect to property page or properties list
      router.push(`/managers/properties/${data.property.id}`);
    } catch (error: any) {
      console.error('Error creating property:', error);
      setFormError(error.message || 'Failed to create property');
      toast({
        title: 'Error',
        description: error.message || 'Failed to create property',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div>{/* Render your form here */}</div>;
};

export default NewPropertyPage;
