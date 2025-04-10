// Script to add a test image to a property
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAddImageToProperty() {
  try {
    // Get the property
    const propertyId = 21; // Property 2 ID
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true, images: true, photoUrls: true },
    });

    console.log('Current property images:', property);

    // Add a test image URL
    const testImageUrl =
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1000';

    const updatedImages = Array.isArray(property.images)
      ? [...property.images, testImageUrl]
      : [testImageUrl];

    const updatedPhotoUrls = Array.isArray(property.photoUrls)
      ? [...property.photoUrls, testImageUrl]
      : [testImageUrl];

    // Update the property with the new image
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        images: updatedImages,
        photoUrls: updatedPhotoUrls,
      },
      select: { id: true, name: true, images: true, photoUrls: true },
    });

    console.log('Property updated with test image:', updatedProperty);
  } catch (error) {
    console.error('Error updating property with test image:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAddImageToProperty();
