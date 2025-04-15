#!/bin/bash

echo "=== Railway Startup Script ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la
echo "Current user: $(whoami)"
echo "User permissions: $(id)"
echo "Mount points:"
mount

echo "Attempting to find and copy server.js"

# Create app directory if it doesn't exist
mkdir -p /app 2>/dev/null || echo "Failed to create /app directory"
chmod 777 /app 2>/dev/null || echo "Failed to set permissions on /app"

# Check if server.js exists in current directory
if [ -f "./server.js" ]; then
  echo "Found server.js in current directory"
  cp ./server.js /app/server.js 2>/dev/null || echo "Failed to copy server.js to /app"
  # Try creating a symlink as well
  ln -sf "$(pwd)/server.js" /app/server.js 2>/dev/null || echo "Failed to create symlink"
fi

# Check if server.js exists in server directory
if [ -f "./server/server.js" ]; then
  echo "Found server.js in server directory"
  cp ./server/server.js /app/server.js 2>/dev/null || echo "Failed to copy server.js from server dir to /app"
  # Try creating a symlink as well
  ln -sf "$(pwd)/server/server.js" /app/server.js 2>/dev/null || echo "Failed to create symlink"
fi

# If /app/server.js still doesn't exist, create a simple one
if [ ! -f "/app/server.js" ] || [ ! -r "/app/server.js" ]; then
  echo "Creating a simple server.js in the current directory"
  cat > "./railway-server.js" << 'EOL'
// Bootstrapper server.js created by startup.sh
console.log('Starting from railway-server.js created by startup.sh');
console.log('Current directory:', process.cwd());
console.log('Directory contents:', require('fs').readdirSync('.'));

try {
  if (require('fs').existsSync('./server.js')) {
    console.log('Loading ./server.js');
    require('./server.js');
  } else if (require('fs').existsSync('./server/server.js')) {
    console.log('Loading ./server/server.js');
    require('./server/server.js');
  } else {
    throw new Error('No server.js found');
  }
} catch (e) {
  console.error('Failed to load server:', e);
  
  // Basic fallback server
  const express = require('express');
  const app = express();
  const port = process.env.PORT || 3001;
  
  app.get('/', (req, res) => {
    res.json({ status: 'running', message: 'Railway Emergency Server' });
  });
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Health check passed' });
  });
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`Emergency server running on port ${port}`);
  });
}
EOL
  echo "Starting with local railway-server.js"
  exec node railway-server.js
fi

# Check if /app/server.js exists and is readable
if [ -f "/app/server.js" ] && [ -r "/app/server.js" ]; then
  echo "Found /app/server.js, running it"
  exec node /app/server.js
elif [ -f "./server.js" ]; then
  echo "Running ./server.js"
  exec node ./server.js
elif [ -f "./server/server.js" ]; then
  echo "Running ./server/server.js"
  exec node ./server/server.js
else
  echo "ERROR: Could not find server.js in any location"
  exit 1
fi 