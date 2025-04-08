import { PropertyFormData, propertySchema } from '@/lib/schemas';
import {
  useCreatePropertyMutation,
  useGetAuthUserQuery,
  useUploadPropertyImagesMutation,
} from '@/state/api';
import { Loader2 } from 'lucide-react';
import PropertyImageGallery from '@/components/PropertyImageGallery';

const CreateProperty = () => {
  const [uploadImages] = useUploadPropertyImagesMutation();
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [tempPropertyId, setTempPropertyId] = useState<string | null>(null);

  const handleFileUpload = async (files: FileList) => {
    if (!tempPropertyId) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setPropertyImages([...propertyImages, ...urls]);
      return urls;
    }

    try {
      const response = await uploadImages({
        propertyId: tempPropertyId,
        images: Array.from(files),
      }).unwrap();

      return response.imageUrls || [];
    } catch (error) {
      console.error('Failed to upload images:', error);
      throw error;
    }
  };

  const handleImagesChange = (images: string[]) => {
    setPropertyImages(images);
  };

  const onSubmit = async (data: PropertyFormData) => {
    try {
      const response = await createProperty({
        data: formData,
      }).unwrap();

      if (response.id) {
        setTempPropertyId(String(response.id));

        if (propertyImages.length > 0) {
          // In a real scenario, we would convert the temporary URLs back to files
          // For demo purposes, this is a placeholder
          // await uploadPropertyImages({
          //   propertyId: String(response.id),
          //   images: propertyImages as unknown as File[]
          // });
        }
      }

      router.push('/managers/properties');
    } catch (error) {
      console.error('Error creating property:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <Header
        title="Create Property"
        subtitle="Add a new property listing"
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
            {/* ... existing code ... */}

            <hr className="my-6 border-gray-200" />

            {/* Photos */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Property Images</h2>
              <PropertyImageGallery
                images={propertyImages}
                onImagesChange={handleImagesChange}
                onFileUpload={handleFileUpload}
              />
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Address section */}
            {/* ... existing code ... */}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateProperty;
