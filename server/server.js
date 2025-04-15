#!/usr/bin/env node

// Diagnostic startup information
console.log('Starting Bolibro Realty Backend Server');
console.log('Current working directory:', process.cwd());

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Simple Express server for fallback and health checks
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

// Enable JSON parsing
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  // Check for dist directory
  const distExists = fs.existsSync('./dist');
  const distIndexExists = fs.existsSync('./dist/index.js');

  // Try to get TypeScript version
  let tsVersion = 'unknown';
  try {
    tsVersion = execSync('npx tsc --version').toString().trim();
  } catch (e) {
    tsVersion = `Error: ${e.message}`;
  }

  // Collect environment info
  const env = {
    NODE_ENV: process.env.NODE_ENV || 'unknown',
    PORT: process.env.PORT || 'unknown',
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
    SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'not set',
    SUPABASE_KEY: process.env.SUPABASE_KEY ? 'set' : 'not set',
  };

  // Get directory listing
  let dirContents = [];
  try {
    dirContents = fs.readdirSync('.');
  } catch (e) {
    dirContents = [`Error: ${e.message}`];
  }

  // Get dist directory listing if it exists
  let distContents = [];
  if (distExists) {
    try {
      distContents = fs.readdirSync('./dist');
    } catch (e) {
      distContents = [`Error: ${e.message}`];
    }
  }

  // Check if TypeScript can compile
  let canCompile = false;
  let compileError = '';
  try {
    // Create a simple TS file
    fs.writeFileSync('test.ts', 'console.log("Hello");');
    execSync('npx tsc test.ts', { stdio: 'pipe' });
    canCompile = fs.existsSync('test.js');

    // Clean up
    try {
      fs.unlinkSync('test.ts');
      if (canCompile) fs.unlinkSync('test.js');
    } catch (e) {
      // Ignore cleanup errors
    }
  } catch (e) {
    compileError = e.message;
  }

  res.status(200).json({
    status: 'ok',
    message: 'Express server running',
    timestamp: new Date().toISOString(),
    typeScript: {
      version: tsVersion,
      canCompile,
      compileError: compileError || undefined,
    },
    directories: {
      distExists,
      distIndexExists,
      currentDirectory: dirContents,
      distDirectory: distContents,
    },
    environment: env,
  });
});

// Root path response
app.get('/', (req, res) => {
  // Try to load the TypeScript server
  try {
    const distIndex = require('./dist/index.js');
    res.status(200).json({
      message: 'Bolibro Realty API',
      status: 'loading_main',
      info: 'Attempting to load main server',
    });
    return;
  } catch (e) {
    res.status(200).json({
      message: 'Bolibro Realty API - Fallback Mode',
      status: 'fallback',
      error: `Failed to load main server: ${e.message}`,
      healthEndpoint: '/health',
    });
  }
});

// General request handler for other endpoints
app.use('*', (req, res) => {
  res.status(503).json({
    error: 'Service Unavailable',
    message:
      'The main server is currently unavailable. Running in fallback mode.',
    requestPath: req.originalUrl,
    healthEndpoint: '/health',
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server running on port ${PORT}`);

  // Try to load the main server
  try {
    console.log('Attempting to load TypeScript server...');
    require('./dist/index.js');
    console.log('Successfully loaded TypeScript server');
  } catch (e) {
    console.error('Failed to load TypeScript server:', e.message);
    console.log('Running in fallback mode');
  }
});
