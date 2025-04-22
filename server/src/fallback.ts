// Fallback implementation for when TypeScript compilation fails
// This file should be simpler than index.ts but still get compiled properly

// Load environment variables
require('dotenv').config();

import express from 'express';
import cors from 'cors';
import * as fs from 'fs'; // Use namespace import
import * as path from 'path'; // Use namespace import
import { Prisma } from '@prisma/client';

// Create Express app
const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Try to load ping-supabase script
let pingSupabase: any = null;
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

// Basic middleware
app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Fallback server is running',
    timestamp: new Date().toISOString(),
    version: 'fallback',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bolibro Realty API Fallback Server',
    mode: 'fallback',
    ping_service: pingSupabase ? 'enabled' : 'disabled',
  });
});

// Fallback routes for main API endpoints
app.get('/properties', (req, res) => {
  res.status(200).json({
    message: 'Properties API - Fallback Mode',
    properties: [],
  });
});

app.get('/tenants', (req, res) => {
  res.status(200).json({
    message: 'Tenants API - Fallback Mode',
    tenants: [],
  });
});

app.get('/managers', (req, res) => {
  res.status(200).json({
    message: 'Managers API - Fallback Mode',
    managers: [],
  });
});

app.get('/leases', (req, res) => {
  res.status(200).json({
    message: 'Leases API - Fallback Mode',
    leases: [],
  });
});

// Generic catch-all for other endpoints
app.use('*', (req, res) => {
  res.status(503).json({
    error: 'Service Degraded',
    message: 'Running in TypeScript fallback mode with limited functionality',
    requestPath: req.originalUrl,
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fallback server running on port ${PORT}`);
  console.log('WARNING: Running in fallback mode with limited functionality');
});
