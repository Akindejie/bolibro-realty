// Script to clear test images from property
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearTestImages() {
  try {
    // Get Property 2
    const propertyId = 21; // Property 2 ID
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true, images: true, photoUrls: true },
    });

    console.log('Current property images:', property);

    // Identify and filter out test images from Unsplash
    const testImagePattern = /unsplash\.com/;

    const filteredImages = Array.isArray(property.images)
      ? property.images.filter((url) => !testImagePattern.test(url))
      : [];

    const filteredPhotoUrls = Array.isArray(property.photoUrls)
      ? property.photoUrls.filter((url) => !testImagePattern.test(url))
      : [];

    console.log(
      `Removing ${property.images.length - filteredImages.length} test images`
    );

    // Update the property with filtered images
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        images: filteredImages,
        photoUrls: filteredPhotoUrls,
      },
      select: { id: true, name: true, images: true, photoUrls: true },
    });

    console.log('Property updated - removed test images:', updatedProperty);
  } catch (error) {
    console.error('Error clearing test images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestImages();
