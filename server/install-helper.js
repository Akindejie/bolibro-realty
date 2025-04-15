#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Running Railway installation helper script');
console.log('Current working directory:', process.cwd());

// Make sure /app directory exists
try {
  if (!fs.existsSync('/app')) {
    console.log('Creating /app directory');
    fs.mkdirSync('/app', { recursive: true });
  }
} catch (e) {
  console.error('Error creating /app directory:', e);
}

// Copy our app-server.js to /app/server.js
try {
  const sourcePath = path.join(process.cwd(), 'app-server.js');
  if (fs.existsSync(sourcePath)) {
    console.log(`Copying ${sourcePath} to /app/server.js`);
    fs.copyFileSync(sourcePath, '/app/server.js');
    console.log('File copied successfully');
  } else {
    console.error(`Source file not found: ${sourcePath}`);
  }

  // Also try to copy the server.js file
  const serverPath = path.join(process.cwd(), 'server.js');
  if (fs.existsSync(serverPath)) {
    console.log(`Also copying ${serverPath} to /app/server.js as fallback`);
    fs.copyFileSync(serverPath, '/app/server.js');
  }
} catch (e) {
  console.error('Error copying file:', e);
}

// List the contents of /app to verify
try {
  console.log('Contents of /app:');
  fs.readdirSync('/app').forEach((file) => {
    console.log(` - ${file}`);
  });
} catch (e) {
  console.error('Error listing /app directory:', e);
}
