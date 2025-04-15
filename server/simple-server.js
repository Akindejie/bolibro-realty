// Minimal Express server for health checks
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3001;

console.log('Starting minimal server...');
console.log('Current directory:', __dirname);
console.log('Directory contents:');
try {
  fs.readdirSync('.').forEach((file) => {
    console.log(`- ${file}`);
  });
} catch (e) {
  console.error('Error listing directory:', e);
}

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Simple server is running',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Bolibro Realty API - Simple Mode',
    status: 'minimal',
    healthEndpoint: '/health',
  });
});

// Catch-all route
app.use('*', (req, res) => {
  res.status(503).json({
    error: 'Service Unavailable',
    message: 'The server is running in minimal mode',
    requestPath: req.originalUrl,
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on port ${PORT}`);
});
