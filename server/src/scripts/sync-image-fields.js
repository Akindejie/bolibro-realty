// Script to synchronize images and photoUrls fields
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncImageFields() {
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

    console.log(`Found ${properties.length} properties to check`);

    // Sync image fields for each property
    for (const property of properties) {
      const images = Array.isArray(property.images) ? property.images : [];
      const photoUrls = Array.isArray(property.photoUrls)
        ? property.photoUrls
        : [];

      console.log(`\nProperty ID: ${property.id} - Name: ${property.name}`);
      console.log(
        `- Current images: ${images.length}, photoUrls: ${photoUrls.length}`
      );

      // Combine both arrays (unique values only)
      const allImages = [...new Set([...images, ...photoUrls])];

      if (
        allImages.length !== images.length ||
        allImages.length !== photoUrls.length
      ) {
        console.log(
          `- Updating property with ${allImages.length} total unique images`
        );

        // Update the property with synchronized fields
        await prisma.property.update({
          where: { id: property.id },
          data: {
            images: allImages,
            photoUrls: allImages,
          },
        });

        console.log('✅ Property updated successfully');
      } else {
        console.log('- No update needed, fields are in sync');
      }
    }

    console.log('\n🎉 Image synchronization completed');
  } catch (error) {
    console.error('❌ Error syncing image fields:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncImageFields();
