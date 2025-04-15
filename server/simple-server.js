// Super simple health check server
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

console.log('Starting simple health check server...');

// Log environment variables
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Health check endpoint - just return OK
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({
    status: 'ok',
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint requested');
  res.status(200).json({
    message: 'Bolibro Realty API - Minimal Mode',
    status: 'ok',
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on port ${PORT}`);
});
