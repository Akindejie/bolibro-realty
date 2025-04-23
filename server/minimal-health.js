/**
 * Minimal health check server for Railway deployment
 * This server is used as a last resort when the main server and all fallbacks fail
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Get port from environment or default to 8080
const PORT = process.env.PORT || 8080;

// Simple health check server
const server = http.createServer((req, res) => {
  console.log(
    `[${new Date().toISOString()}] Request received: ${req.method} ${req.url}`
  );

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'minimal',
        timestamp: new Date().toISOString(),
        message: 'Minimal health check server is running',
        env: process.env.NODE_ENV || 'unknown',
        port: PORT,
      })
    );
    return;
  }

  // Root endpoint with system info
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });

    // Get system info
    const info = {
      status: 'minimal',
      timestamp: new Date().toISOString(),
      message: 'Only minimal health check server is running',
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL ? 'defined' : 'undefined',
        DATABASE_DIRECT_URL: process.env.DATABASE_DIRECT_URL
          ? 'defined'
          : 'undefined',
        SUPABASE_URL: process.env.SUPABASE_URL ? 'defined' : 'undefined',
        SUPABASE_KEY: process.env.SUPABASE_KEY ? 'defined' : 'undefined',
      },
      files: {},
    };

    // Check for important files
    const filesToCheck = [
      'dist/index.js',
      'prisma/schema.prisma',
      'node_modules/@prisma/client/index.js',
      'node_modules/.prisma/client/index.js',
    ];

    filesToCheck.forEach((file) => {
      info.files[file] = fs.existsSync(path.join(process.cwd(), file));
    });

    res.end(JSON.stringify(info, null, 2));
    return;
  }

  // Not found for any other route
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Start the server
server.listen(PORT, () => {
  console.log(
    `[${new Date().toISOString()}] Minimal health check server running on port ${PORT}`
  );
  console.log(
    `[${new Date().toISOString()}] Health check available at http://localhost:${PORT}/health`
  );
  console.log(
    `[${new Date().toISOString()}] System info available at http://localhost:${PORT}/`
  );
});

// Handle server errors
server.on('error', (error) => {
  console.error(`[${new Date().toISOString()}] Server error:`, error.message);
});

// Handle uncaught exceptions to prevent crashes
process.on('uncaughtException', (error) => {
  console.error(
    `[${new Date().toISOString()}] Uncaught exception:`,
    error.message
  );
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(
    `[${new Date().toISOString()}] Unhandled rejection at:`,
    promise,
    'reason:',
    reason
  );
});
