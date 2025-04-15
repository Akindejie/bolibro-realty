// This file is meant to be placed at /app/server.js
console.log('Starting from /app/server.js');
console.log('Current working directory:', process.cwd());

const fs = require('fs');
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

// Log directory contents for debugging
try {
  console.log('Directory contents:');
  fs.readdirSync('.').forEach((file) => {
    console.log(' - ' + file);
  });
} catch (e) {
  console.error('Error listing directory:', e);
}

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic routes
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Bolibro Realty API',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// Health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bolibro Realty API is operational',
    timestamp: new Date().toISOString(),
    database: {
      configured: !!process.env.DATABASE_URL,
      connected: false,
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
    },
  });
});

// Simple properties endpoint
app.get('/properties', (req, res) => {
  res.json({
    message: 'Properties endpoint',
    properties: [
      { id: 1, name: 'Ocean View Apartment', price: 2500, status: 'Available' },
      { id: 2, name: 'Downtown Condo', price: 1800, status: 'Available' },
      { id: 3, name: 'Suburban House', price: 3200, status: 'Available' },
    ],
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

// Try to load additional functionality
try {
  console.log('Attempting to load actual server implementation...');
  const serverPaths = [
    './server.js',
    './server/server.js',
    './server/dist/index.js',
  ];

  for (const path of serverPaths) {
    if (fs.existsSync(path)) {
      console.log(`Found server at ${path}, attempting to load...`);
      try {
        // We're not actually using the required module directly
        // This is just to test if it loads without errors
        require(path);
        console.log(`Successfully loaded ${path}`);
        break;
      } catch (err) {
        console.error(`Error loading ${path}:`, err);
      }
    }
  }
} catch (e) {
  console.error('Error attempting to load additional functionality:', e);
}
