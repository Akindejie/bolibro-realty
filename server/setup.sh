#!/bin/bash

# Create a directory listing to debug what's been built
echo "Directory contents:"
ls -la
echo "dist directory contents:"
ls -la dist || echo "dist directory not found"

# Copy the Procfile if it's not there
if [ ! -f Procfile ]; then
  echo "Creating Procfile"
  echo "web: npm start" > Procfile
fi

# Make sure we have a node_modules folder
if [ ! -d node_modules ]; then
  echo "Installing dependencies"
  npm ci
fi

# Make sure Prisma client is generated
echo "Generating Prisma client"
npx prisma generate

# Make sure TypeScript is compiled
if [ ! -d dist ] || [ ! -f dist/index.js ]; then
  echo "Building TypeScript"
  npm run build
fi

echo "Setup complete!" 