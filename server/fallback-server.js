// Fallback server implementation
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parsing
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'fallback',
    message: 'Fallback server is running',
    timestamp: new Date().toISOString(),
    buildInfo: {
      environment: process.env.NODE_ENV || 'unknown',
      directory: __dirname,
      files: fs.existsSync('./dist')
        ? fs.readdirSync('./dist').join(', ')
        : 'No dist directory',
    },
  });
});

// Root path response
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bolibro Realty API - Fallback Mode',
    status: 'degraded',
    info: 'The main server could not be started, running in fallback mode with limited functionality',
    healthEndpoint: '/health',
  });
});

// General request handler for other endpoints
app.use('*', (req, res) => {
  res.status(503).json({
    error: 'Service Unavailable',
    message:
      'The main server is currently unavailable. Running in fallback mode with limited functionality.',
    requestPath: req.originalUrl,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Fallback server running on port ${PORT}`);
  console.log('WARNING: Running in fallback mode with limited functionality');

  // Try to list available directories to aid debugging
  try {
    console.log('Current directory contents:');
    fs.readdirSync('.').forEach((file) => {
      console.log(
        ` - ${file} ${
          fs.statSync(file).isDirectory() ? '(directory)' : '(file)'
        }`
      );
    });

    if (fs.existsSync('./dist')) {
      console.log('dist directory contents:');
      fs.readdirSync('./dist').forEach((file) => {
        console.log(` - ${file}`);
      });
    } else {
      console.log('dist directory not found');
    }
  } catch (error) {
    console.error('Error listing directory contents:', error);
  }
});
