// Script to add a sample image URL directly to Property 2
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addImageToProperty() {
  try {
    // Get Property 2
    const propertyId = 21; // Property 2 ID
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true, images: true, photoUrls: true },
    });

    console.log('Current property images:', property);

    // Add a sample image URL
    const sampleImageUrl =
      'https://fbcgcjkdtushporvcqsc.supabase.co/storage/v1/object/public/property-images/test-upload-1744239611932.txt';

    // Create new arrays with the sample image
    const updatedImages = Array.isArray(property.images)
      ? [...property.images, sampleImageUrl]
      : [sampleImageUrl];

    const updatedPhotoUrls = Array.isArray(property.photoUrls)
      ? [...property.photoUrls, sampleImageUrl]
      : [sampleImageUrl];

    // Update the property with the new image arrays
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        images: updatedImages,
        photoUrls: updatedPhotoUrls,
      },
      select: { id: true, name: true, images: true, photoUrls: true },
    });

    console.log('Property updated with sample image:', updatedProperty);
  } catch (error) {
    console.error('Error adding image to property:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addImageToProperty();
