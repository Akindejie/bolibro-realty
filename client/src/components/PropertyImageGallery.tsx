import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import {
  PlusCircle,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PropertyImageGalleryProps {
  images: string[];
  onImagesChange?: (images: string[]) => void;
  onImageUpload?: (files: FileList | null) => Promise<void>;
}

const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  images = [],
  onImagesChange,
  onImageUpload,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isEditable = Boolean(onImagesChange && onImageUpload);

  // Track displayed images locally
  const [displayedImages, setDisplayedImages] = useState<string[]>(images);

  // Update displayed images when prop changes
  useEffect(() => {
    console.log('PropertyImageGallery - Images received:', images);
    console.log(
      'PropertyImageGallery - Images is array:',
      Array.isArray(images)
    );
    console.log('PropertyImageGallery - Images length:', images.length);
    if (images.length > 0) {
      console.log('PropertyImageGallery - First image URL:', images[0]);
      console.log('PropertyImageGallery - All images:', JSON.stringify(images));
    }
    setDisplayedImages(images);
  }, [images]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onImageUpload) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      console.log(`Uploading ${files.length} files...`);
      await onImageUpload(files);
      // Note: We don't need to update displayedImages here because
      // the parent component will pass the updated images as props
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadError('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    if (!onImagesChange) return;

    setIsOrdering(true);
    try {
      // Make a copy of images and remove the image at the specified index
      const newImages = [...displayedImages];
      newImages.splice(index, 1);
      console.log('Removing image at index', index, 'new array:', newImages);

      // Update the images through the provided callback
      onImagesChange(newImages);

      // Also update local state for immediate UI feedback
      setDisplayedImages(newImages);
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if (!onImagesChange) return;

    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === displayedImages.length - 1)
    ) {
      return;
    }

    setIsOrdering(true);
    try {
      // Make a copy of images and update locally first
      const newImages = [...displayedImages];
      const newIndex = direction === 'up' ? index - 1 : index + 1;

      // Swap images
      [newImages[index], newImages[newIndex]] = [
        newImages[newIndex],
        newImages[index],
      ];
      console.log('Reordering images:', newImages);

      // Update the images through the provided callback
      onImagesChange(newImages);

      // Also update local state for immediate UI feedback
      setDisplayedImages(newImages);
    } catch (error) {
      console.error('Error reordering images:', error);
      toast.error('Failed to reorder images. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Property Images</h3>
        {isEditable && (
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
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          {uploadError}
        </div>
      )}

      {!navigator.onLine && isEditable && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          You&apos;re offline. Changes will be saved locally and synced when
          you&apos;re back online.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayedImages.map((src, index) => {
          console.log(`Rendering image ${index}:`, src);
          return (
            <div
              key={`image-${index}-${
                typeof src === 'string' ? src.substring(0, 20) : index
              }`}
              className="relative group rounded-md overflow-hidden"
            >
              <div className="aspect-square relative">
                <Image
                  src={src}
                  alt={`Property image ${index + 1}`}
                  fill
                  priority={index === 0}
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  onError={() =>
                    console.error(`Failed to load image ${index}:`, src)
                  }
                />
              </div>
              {isEditable && (
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
                    {index < displayedImages.length - 1 && (
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
              )}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                {index === 0 ? 'Main' : `#${index + 1}`}
              </div>
            </div>
          );
        })}
      </div>

      {displayedImages.length === 0 && (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
          <p className="text-gray-500">No images added yet</p>
          <p className="text-sm text-gray-400 mt-1">
            {isEditable
              ? 'Add images to showcase your property'
              : 'This property doesn&apos;t have any images yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertyImageGallery;
