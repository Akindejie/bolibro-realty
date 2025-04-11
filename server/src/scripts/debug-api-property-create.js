require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

// Since we can't easily bypass authentication, let's test the key parts directly
async function debugPropertyCreation() {
  try {
    console.log('Debugging property creation directly...');

    // 1. Create location first using our fixed approach
    console.log('Creating test location...');
    const locationResult = await prisma.$queryRaw`
      INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
      VALUES (
        'Debug Address',
        'Debug City',
        'Debug State',
        'USA',
        '12345',
        ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)
      )
      RETURNING id
    `;

    console.log('Location creation result:', locationResult);

    if (
      !locationResult ||
      !Array.isArray(locationResult) ||
      locationResult.length === 0
    ) {
      throw new Error('Failed to create location: Invalid query result');
    }

    // Get the inserted location ID
    const locationId = locationResult[0].id;
    console.log(`Created location with ID: ${locationId}`);

    // 2. Create property with basic information
    console.log('Creating test property...');

    // Create the property in the database
    const property = await prisma.property.create({
      data: {
        name: 'Debug Test Property',
        description: 'This is a test property created by the debug script',
        propertyType: 'Apartment',
        beds: 2,
        baths: 2,
        squareFeet: 1200,
        pricePerMonth: 2000,
        securityDeposit: 2000,
        applicationFee: 50,
        photoUrls: [
          'https://fbcgcjkdtushporvcqsc.supabase.co/storage/v1/object/public/property-images/temp/1744320413179-Screenshot_2025-04-10_at_4.24.37___PM.png',
        ],
        images: [
          'https://fbcgcjkdtushporvcqsc.supabase.co/storage/v1/object/public/property-images/temp/1744320413179-Screenshot_2025-04-10_at_4.24.37___PM.png',
        ],
        amenities: ['WiFi', 'Parking'],
        highlights: ['HighSpeedInternetAccess', 'QuietNeighborhood'],
        isPetsAllowed: true,
        isParkingIncluded: true,
        location: {
          connect: {
            id: locationId,
          },
        },
        manager: {
          connect: {
            cognitoId: '44a85478-2061-703a-d2db-badee16544bf', // Make sure this exists in your database
          },
        },
      },
    });

    console.log('Property created successfully:', {
      id: property.id,
      name: property.name,
      locationId: property.locationId,
      managerCognitoId: property.managerCognitoId,
    });

    // 3. Verify the property was created
    const createdProperty = await prisma.property.findUnique({
      where: {
        id: property.id,
      },
      include: {
        location: true,
        manager: true,
      },
    });

    console.log('Property details:', {
      id: createdProperty.id,
      name: createdProperty.name,
      imageCount: createdProperty.images.length,
      location: {
        address: createdProperty.location.address,
        city: createdProperty.location.city,
      },
      manager: {
        name: createdProperty.manager.name,
      },
    });

    return property;
  } catch (error) {
    console.error('Error in debug script:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug function
debugPropertyCreation()
  .then((property) => {
    console.log('Debug complete. Property created with ID:', property.id);
    process.exit(0);
  })
  .catch((error) => {
    console.log('Debug failed:', error.message);
    process.exit(1);
  });
