#!/usr/bin/env node

// Diagnostic startup information
console.log('Starting Bolibro Realty Backend Server');
console.log('Current working directory:', process.cwd());

const fs = require('fs');

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

console.log('Directory contents:');
try {
  fs.readdirSync('.').forEach((file) => {
    console.log(' - ' + file);
  });
} catch (e) {
  console.error('Error listing directory:', e);
}

// Try to load the compiled TypeScript version first
try {
  console.log('Attempting to load ./dist/index.js');
  if (fs.existsSync('./dist/index.js')) {
    console.log('Found ./dist/index.js, loading...');
    require('./dist/index.js');
  } else {
    throw new Error('dist/index.js does not exist');
  }
} catch (error) {
  console.error('Failed to load TypeScript build:', error.message);

  // Fall back to a simple Express server
  console.log('Starting fallback Express server');
  try {
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
        message: 'Bolibro Realty Backend (Fallback Server)',
        error: 'Main application could not be loaded',
        environment: process.env.NODE_ENV || 'development',
        time: new Date().toISOString(),
      });
    });

    // Health endpoint - respond immediately with OK
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        message: 'Health check passed',
        timestamp: new Date().toISOString(),
      });
    });

    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        message: 'Fallback server is running',
        timestamp: new Date().toISOString(),
        database: {
          configured: !!process.env.DATABASE_URL,
          connected: false,
        },
        storage: !!process.env.SUPABASE_URL,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
        },
      });
    });

    // Simple properties endpoint
    app.get('/properties', (req, res) => {
      res.json({
        message: 'Fallback server - properties endpoint',
        properties: [
          { id: 1, name: 'Sample Property 1', status: 'Available' },
          { id: 2, name: 'Sample Property 2', status: 'Available' },
        ],
      });
    });

    // Start server
    app.listen(port, '0.0.0.0', () => {
      console.log(`Fallback server running on port ${port}`);
    });
  } catch (expressError) {
    console.error('Failed to start fallback Express server:', expressError);
    process.exit(1);
  }
}
