// Simple script to check properties and their images
const axios = require('axios');

async function checkProperty(propertyId) {
  try {
    // Get property details from your API
    const response = await axios.get(
      `http://localhost:3001/properties/${propertyId}`
    );

    console.log(`\nProperty ${propertyId} details:`);
    console.log('- Name:', response.data.name);
    console.log('- Images:', response.data.images?.length || 0);
    console.log('- PhotoUrls:', response.data.photoUrls?.length || 0);

    if (response.data.images && response.data.images.length > 0) {
      console.log('\nImage URLs:');
      response.data.images.forEach((url, i) => {
        console.log(`${i + 1}. ${url}`);
      });
    } else {
      console.log('\nNo images found for this property');
    }

    return response.data;
  } catch (error) {
    console.error(`Error getting property ${propertyId}:`, error.message);
    return null;
  }
}

// Let's check properties 1, 20, 21, 22, and 23 to see what's going on
async function checkAllProperties() {
  const ids = [1, 20, 21, 22, 23];

  // Check each property in sequence
  for (const id of ids) {
    console.log(`\n------ Checking Property ID: ${id} ------`);
    await checkProperty(id);
  }
}

// Run the check
checkAllProperties()
  .then(() => {
    console.log('\nCheck complete');
  })
  .catch((err) => {
    console.error('Error during check:', err);
  });
