require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function testPropertyCreation() {
  try {
    console.log('Testing property creation...');
    console.log('1. Database connection check...');

    // Test database connection first
    const testQuery = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('Database connection successful:', testQuery);

    console.log('2. Testing location creation with raw SQL...');

    // Test creating a location with raw SQL (similar to our fix)
    const locationResult = await prisma.$queryRaw`
      INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
      VALUES (
        'Test Address',
        'Test City',
        'Test State',
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

    // Get the inserted location ID with type assertion
    const locationId = locationResult[0].id;
    console.log(`Created location with ID: ${locationId}`);

    console.log('3. Testing property creation with Prisma client...');

    // Test creating a property with Prisma client
    const newProperty = await prisma.property.create({
      data: {
        name: 'Test Property',
        description: 'Test Description',
        propertyType: 'Apartment',
        beds: 2,
        baths: 2,
        squareFeet: 1000,
        pricePerMonth: 2000,
        securityDeposit: 2000,
        applicationFee: 50,
        photoUrls: [],
        images: [],
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
      include: {
        location: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('Property created successfully:', {
      id: newProperty.id,
      name: newProperty.name,
      locationId: newProperty.locationId,
      managerCognitoId: newProperty.managerCognitoId,
    });

    return newProperty;
  } catch (error) {
    console.error('Error in test:', error);
    if (error.meta) {
      console.error('Prisma error metadata:', error.meta);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPropertyCreation()
  .then((property) => {
    console.log('Success! Created property with ID:', property.id);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
