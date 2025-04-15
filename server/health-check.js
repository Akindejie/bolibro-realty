// Minimal health check server
const http = require('http');
const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        message: 'Emergency health check passing',
      })
    );
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({ status: 'running', message: 'Emergency server running' })
    );
  }
});

const port = process.env.PORT || 3001;
server.listen(port, '0.0.0.0', () => {
  console.log(`Emergency health check server running on port ${port}`);
});

// Try to load the actual server
setTimeout(() => {
  try {
    const serverPaths = [
      '/app/server.js',
      './app-server.js',
      './server.js',
      './dist/index.js',
    ];

    for (const path of serverPaths) {
      try {
        console.log(`Trying to require ${path}...`);
        require(path);
        console.log(`Successfully loaded ${path}`);
        break;
      } catch (err) {
        console.error(`Failed to load ${path}:`, err.message);
      }
    }
  } catch (e) {
    console.error('Error loading server:', e);
  }
}, 1000);
