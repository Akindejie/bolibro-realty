/**
 * Script to update DATABASE_URL in .env file to include connection pooling
 * This helps solve the "prepared statement already exists" error
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '.env');

async function updateEnvFile() {
  console.log('Checking .env file...');

  // First check if .env exists
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found at', envPath);
    console.log(
      'Please create a .env file with your database connection settings first.'
    );
    return;
  }

  // Read the current .env content
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  let modified = false;

  // Create a new array with the updated lines
  const newLines = lines.map((line) => {
    // Check if this is the DATABASE_URL line
    if (line.startsWith('DATABASE_URL=')) {
      const value = line.substring('DATABASE_URL='.length).trim();

      // Make sure it starts with postgresql:// or postgres://
      if (
        !value.startsWith('postgresql://') &&
        !value.startsWith('postgres://')
      ) {
        console.error(
          'ERROR: DATABASE_URL must start with postgresql:// or postgres://'
        );
        return line;
      }

      // Skip if already has connection parameters
      if (
        value.includes('?pool_timeout=') ||
        value.includes('&connection_limit=')
      ) {
        console.log('Database URL already has connection pooling parameters.');
        return line;
      }

      // Parse the URL to add parameters
      let newUrl = value;
      if (value.includes('?')) {
        // Already has parameters, add to them
        newUrl = `${value}&pool_timeout=20&connection_limit=5&statement_cache_size=0`;
      } else {
        // No parameters yet, add them fresh
        newUrl = `${value}?pool_timeout=20&connection_limit=5&statement_cache_size=0`;
      }

      modified = true;
      console.log(
        'Updating DATABASE_URL with connection pooling parameters...'
      );
      console.log(`Old URL prefix: ${value.substring(0, 15)}...`);
      console.log(`New URL prefix: ${newUrl.substring(0, 15)}...`);
      return `DATABASE_URL=${newUrl}`;
    }
    return line;
  });

  if (modified) {
    // Write the modified content back to the file
    fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
    console.log('✅ .env file updated successfully!');
    console.log('Please restart your server for changes to take effect.');
  } else {
    console.log('No changes were needed to the .env file.');
  }
}

// Run the function
updateEnvFile().catch((error) => {
  console.error('Error updating .env file:', error);
});
