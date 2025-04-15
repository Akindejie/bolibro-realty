// This is a fallback start script for Railway
console.log('Starting server via fallback index.js...');

try {
  // First try to load the compiled TypeScript from the dist directory
  console.log('Attempting to load dist/index.js...');
  require('./dist/index.js');
} catch (error) {
  console.error('Failed to load dist/index.js:', error.message);

  // If that fails, create a simple Express server
  console.log('Starting minimal Express server...');
  const express = require('express');
  const app = express();
  const port = process.env.PORT || 3001;

  // Basic routes
  app.get('/', (req, res) => {
    res.json({
      status: 'running',
      message:
        'This is a fallback server. The main application could not be loaded.',
      error: 'dist/index.js could not be loaded',
      environment: process.env.NODE_ENV || 'development',
      time: new Date().toISOString(),
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
    });
  });

  // Start server
  app.listen(port, '0.0.0.0', () => {
    console.log(`Fallback server running on port ${port}`);
  });
}
 