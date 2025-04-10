/**
 * Script to create a test property in the database
 * This is useful for testing after clearing the database
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestProperty() {
  try {
    console.log('Creating test manager...');

    // First, create a test manager
    const manager = await prisma.manager.create({
      data: {
        cognitoId: 'test-manager-id',
        name: 'Test Manager',
        email: 'testmanager@example.com',
        phoneNumber: '555-123-4567',
      },
    });

    console.log('Created test manager:', manager);

    // Create a location for the property
    console.log('Creating test location...');
    const location = await prisma.location.create({
      data: {
        address: '123 Test Street',
        city: 'Test City',
        state: 'CA',
        country: 'USA',
        postalCode: '90210',
        coordinates: {
          create: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749],
            srid: 4326,
          },
        },
      },
    });

    console.log('Created test location:', location);

    // Create the test property
    console.log('Creating test property...');
    const property = await prisma.property.create({
      data: {
        name: 'Test Property',
        description: 'A beautiful test property with great features',
        pricePerMonth: 2500,
        securityDeposit: 2500,
        applicationFee: 50,
        photoUrls: [],
        images: [],
        amenities: ['WiFi', 'AirConditioning', 'Dishwasher'],
        highlights: ['HighSpeedInternetAccess', 'AirConditioning', 'GreatView'],
        isPetsAllowed: true,
        isParkingIncluded: true,
        beds: 2,
        baths: 2,
        squareFeet: 1200,
        propertyType: 'Apartment',
        status: 'Available',
        locationId: location.id,
        managerCognitoId: manager.cognitoId,
      },
    });

    console.log('Successfully created test property:', property);

    return property;
  } catch (error) {
    console.error('Error creating test property:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestProperty()
  .then((property) => {
    console.log('Test property ID:', property.id);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
