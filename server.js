// This file is required by Railway to start the server
console.log('Starting Bolibro Realty Backend from root server.js');
console.log('Current working directory:', process.cwd());
console.log('Directory contents:');

const fs = require('fs');
const path = require('path');

// List directory contents
try {
  fs.readdirSync('.').forEach((file) => {
    console.log(' - ' + file);
  });
} catch (e) {
  console.error('Error listing directory:', e);
}

// Search paths for server.js or index.js
const searchPaths = [
  './server/server.js',
  './server/dist/index.js',
  './server/index.js',
  './server.js',
];

// Try to run the server from the server directory
let serverFound = false;
for (const serverPath of searchPaths) {
  try {
    if (fs.existsSync(serverPath)) {
      console.log(`Found ${serverPath}, loading...`);
      require(serverPath);
      serverFound = true;
      break;
    }
  } catch (error) {
    console.error(`Error loading ${serverPath}:`, error);
  }
}

// Fallback server
if (!serverFound) {
  console.log('Could not find server files, starting a basic Express server');

  const express = require('express');
  const app = express();
  const port = process.env.PORT || 3001;

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
      message: 'Bolibro Realty API (Fallback)',
      environment: process.env.NODE_ENV || 'development',
      time: new Date().toISOString(),
    });
  });

  // Health endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'Bolibro Realty API is operational (Fallback)',
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
      message: 'Properties endpoint (Fallback)',
      properties: [
        {
          id: 1,
          name: 'Ocean View Apartment',
          price: 2500,
          status: 'Available',
        },
        { id: 2, name: 'Downtown Condo', price: 1800, status: 'Available' },
        { id: 3, name: 'Suburban House', price: 3200, status: 'Available' },
      ],
    });
  });

  // Property details endpoint
  app.get('/properties/:id', (req, res) => {
    const propertyId = parseInt(req.params.id);
    res.json({
      id: propertyId,
      name: `Property ${propertyId}`,
      description: 'A beautiful property in a prime location',
      price: 2000 + propertyId * 100,
      beds: 2,
      baths: 2,
      sqft: 1200,
      status: 'Available',
    });
  });

  // Start server
  app.listen(port, '0.0.0.0', () => {
    console.log(`Bolibro Realty API running on port ${port} (Fallback)`);
  });
}
