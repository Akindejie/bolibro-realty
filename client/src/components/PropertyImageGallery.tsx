import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { PlusCircle, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PropertyImageGalleryProps {
  images: string[];
  onImagesChange: (images: string[]) => void | Promise<void> | Promise<boolean>;
  onFileUpload: (files: FileList) => Promise<string[]>;
}

const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  images,
  onImagesChange,
  onFileUpload,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Add debugging
  React.useEffect(() => {
    console.log('PropertyImageGallery - Images received:', images);
  }, [images]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      console.log(`Uploading ${files.length} files...`);

      // Try the upload operation with retry logic
      let retries = 0;
      let uploadSuccessful = false;
      let newImageUrls: string[] = [];

      while (retries < 3 && !uploadSuccessful) {
        try {
          newImageUrls = await onFileUpload(files);
          uploadSuccessful = true;
          console.log('Upload completed, new URLs:', newImageUrls);
        } catch (uploadError) {
          retries++;
          console.error(`Upload attempt ${retries}/3 failed:`, uploadError);

          if (retries < 3) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before retrying
          } else {
            throw uploadError; // Re-throw after all retries
          }
        }
      }

      // If upload was successful, update the images array
      if (uploadSuccessful) {
        onImagesChange([...images, ...newImageUrls]);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadError('Failed to upload images. Please try again.');
      toast.error('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setIsOrdering(true);

    try {
      // Make a copy of images and update locally first
      const newImages = [...images];
      newImages.splice(index, 1);

      // Start optimistic update
      const result = onImagesChange(newImages);

      // Handle the result - either a Promise or immediate value
      if (result instanceof Promise) {
        result
          .then(() => {
            // Successfully processed
            console.log('Image removal completed');
          })
          .catch(() => {
            // Error already handled by PropertyDetails
            console.error('Error in promise from image removal');
          })
          .finally(() => {
            setIsOrdering(false);
          });
      } else {
        // Finished immediately
        setIsOrdering(false);
      }
    } catch (error) {
      console.error('Error preparing to remove image:', error);
      toast.error('Failed to remove image. Please try again.');
      setIsOrdering(false);
    }
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    setIsOrdering(true);

    try {
      // Make a copy of images and update locally first
      const newImages = [...images];
      const newIndex = direction === 'up' ? index - 1 : index + 1;

      // Swap images
      [newImages[index], newImages[newIndex]] = [
        newImages[newIndex],
        newImages[index],
      ];

      // Start optimistic update
      const result = onImagesChange(newImages);

      // Handle the result - either a Promise or immediate value
      if (result instanceof Promise) {
        result
          .then(() => {
            // Successfully processed
            console.log('Image reordering completed');
          })
          .catch(() => {
            // Error already handled by PropertyDetails
            console.error('Error in promise from image reordering');
          })
          .finally(() => {
            setIsOrdering(false);
          });
      } else {
        // Finished immediately
        setIsOrdering(false);
      }
    } catch (error) {
      console.error('Error preparing to reorder images:', error);
      toast.error('Failed to reorder images. Please try again.');
      setIsOrdering(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Property Images</h3>
        <div className="relative">
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
            disabled={isUploading || isOrdering}
          />
          <Label
            htmlFor="image-upload"
            className={cn(
              'flex items-center gap-2 cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90',
              (isUploading || isOrdering) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                Add Images
              </>
            )}
          </Label>
        </div>
      </div>

      {uploadError && (
        <div className="text-sm text-destructive">{uploadError}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((src, index) => (
          <div
            key={`image-${index}-${src.substring(0, 20)}`}
            className="relative group rounded-md overflow-hidden"
          >
            <div className="aspect-square relative">
              <Image
                src={src}
                alt={`Property image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <div className="flex flex-col gap-2">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveImage(index)}
                  className="h-8 w-8"
                  disabled={isOrdering || isUploading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {index > 0 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleMoveImage(index, 'up')}
                    className="h-8 w-8"
                    disabled={isOrdering || isUploading}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                )}
                {index < images.length - 1 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleMoveImage(index, 'down')}
                    className="h-8 w-8"
                    disabled={isOrdering || isUploading}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              {index === 0 ? 'Main' : `#${index + 1}`}
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
          <p className="text-gray-500">No images added yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Add images to showcase your property
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertyImageGallery;
