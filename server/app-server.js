// Self-contained Express server for Railway deployment
console.log('Starting Bolibro Realty Backend');
console.log('Current working directory:', process.cwd());

const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

// Bootstrap: copy this file to /app/server.js if needed
(function bootstrap() {
  try {
    if (!fs.existsSync('/app/server.js')) {
      console.log('Bootstrapping: Copying this file to /app/server.js');

      // Create /app directory if it doesn't exist
      if (!fs.existsSync('/app')) {
        console.log('Creating /app directory');
        fs.mkdirSync('/app', { recursive: true });
      }

      // Copy this file to /app/server.js
      fs.copyFileSync(__filename, '/app/server.js');
      console.log('Successfully copied to /app/server.js');
    }
  } catch (e) {
    console.error('Failed to bootstrap /app/server.js:', e.message);
  }
})();

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
    directory: process.cwd(),
  });
});

// Health endpoint - respond immediately with OK
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
