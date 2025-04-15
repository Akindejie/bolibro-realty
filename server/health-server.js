// Ultra-minimal health check server
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

console.log('Starting health check server on port', PORT);

// Health check endpoint - just return OK
app.get('/health', (req, res) => {
  console.log('Health check requested at', new Date().toISOString());
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server running on port ${PORT}`);
});
