// Fallback implementation for when TypeScript compilation fails
// This file should be simpler than index.ts but still get compiled properly

// Load environment variables
require('dotenv').config();

import express from 'express';
import cors from 'cors';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'TypeScript fallback server is running',
    timestamp: new Date().toISOString(),
    version: 'fallback',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bolibro Realty API - TypeScript Fallback Mode',
    status: 'limited',
    info: 'Running in fallback mode with limited functionality',
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
  console.log(`TypeScript fallback server running on port ${PORT}`);
  console.log('WARNING: Running in fallback mode with limited functionality');
});
