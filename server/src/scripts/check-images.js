// Script to check property images
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPropertyImages() {
  try {
    // Get all properties
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        images: true,
        photoUrls: true,
      },
    });

    console.log('Found', properties.length, 'properties');

    // Display image info for each property
    properties.forEach((property) => {
      console.log('\nProperty ID:', property.id, '- Name:', property.name);
      console.log(
        'images field:',
        Array.isArray(property.images)
          ? `Array with ${property.images.length} items`
          : 'Not an array'
      );
      if (Array.isArray(property.images) && property.images.length > 0) {
        console.log('First image URL:', property.images[0]);
      }

      console.log(
        'photoUrls field:',
        Array.isArray(property.photoUrls)
          ? `Array with ${property.photoUrls.length} items`
          : 'Not an array'
      );
      if (Array.isArray(property.photoUrls) && property.photoUrls.length > 0) {
        console.log('First photoUrl:', property.photoUrls[0]);
      }
    });
  } catch (error) {
    console.error('Error checking property images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPropertyImages();

