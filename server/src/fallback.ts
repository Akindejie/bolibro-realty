// Fallback implementation for when TypeScript compilation fails
// This file should be simpler than index.ts but still get compiled properly

// Load environment variables
require('dotenv').config();

// Use require syntax instead of import for compatibility
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Try to load ping-supabase script
let pingSupabase = null;
try {
  // Try multiple possible locations for the ping-supabase script
  const possiblePaths = [
    './dist/scripts/ping-supabase.js',
    './src/scripts/ping-supabase.js',
    './scripts/ping-supabase.js',
  ];

  for (const scriptPath of possiblePaths) {
    if (fs.existsSync(scriptPath)) {
      console.log(`Found ping-supabase script at ${scriptPath}`);
      pingSupabase = require(scriptPath);
      break;
    }
  }

  if (pingSupabase && typeof pingSupabase.startPingSchedule === 'function') {
    console.log('Starting ping schedule...');
    pingSupabase.startPingSchedule(10); // Ping every 10 minutes
  } else {
    console.error('startPingSchedule function not found in ping-supabase.js');
  }
} catch (e) {
  console.error('Failed to load ping-supabase script:', e);
}

// Enable JSON body parsing
app.use(express.json());

// Add basic CORS support
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
    message: 'TypeScript fallback server is running',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bolibro Realty API TypeScript Fallback Server',
    mode: 'fallback',
  });
});

// Simple mocked API endpoints
const mockEndpoints = [
  '/properties',
  '/tenants',
  '/managers',
  '/leases',
  '/applications',
];

mockEndpoints.forEach((endpoint) => {
  app.get(endpoint, (req, res) => {
    const resource = endpoint.split('/').pop();
    res.status(200).json({
      status: 'fallback',
      message: `${resource} endpoint in fallback mode`,
      data: [],
    });
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Fallback server: Endpoint not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TypeScript fallback server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
