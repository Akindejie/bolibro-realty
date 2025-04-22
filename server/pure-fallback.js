#!/usr/bin/env node

/**
 * Pure JavaScript fallback server that doesn't rely on TypeScript or Prisma
 * This is the last resort if everything else fails
 */

// Load environment variables
try {
  require('dotenv').config();
} catch (e) {
  console.error('Failed to load dotenv, proceeding without it:', e.message);
}

// Create Express app if available
let express;
try {
  express = require('express');
} catch (e) {
  console.error('Express not found, cannot create server:', e.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Pure JavaScript fallback server is running',
    timestamp: new Date().toISOString(),
    mode: 'pure-fallback',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bolibro Realty API - Pure JavaScript Fallback Server',
    mode: 'pure-fallback',
  });
});

// Simple mocked API endpoints
const endpoints = [
  '/properties',
  '/tenants',
  '/managers',
  '/leases',
  '/applications',
];

endpoints.forEach((endpoint) => {
  app.get(endpoint, (req, res) => {
    const resource = endpoint.slice(1);
    res.status(200).json({
      status: 'fallback',
      message: `${resource} endpoint in pure fallback mode`,
      data: [],
    });
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pure JavaScript fallback server running on port ${PORT}`);
});
