#!/bin/bash

# Create a directory listing to debug what's been built
echo "Directory contents:"
ls -la
echo "prisma directory contents:"
ls -la prisma || echo "prisma directory not found"

# Check if the schema exists
if [ ! -f prisma/schema.prisma ]; then
  echo "ERROR: Prisma schema file not found!"
  
  # Look for it elsewhere
  echo "Searching for schema.prisma file:"
  find . -name "schema.prisma" -type f
fi

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

# Make sure Prisma client is generated if schema exists
if [ -f prisma/schema.prisma ]; then
  echo "Generating Prisma client"
  npx prisma generate --schema=./prisma/schema.prisma
else
  echo "WARNING: Skipping Prisma generation, schema not found"
fi

# Make sure TypeScript is compiled
if [ ! -d dist ] || [ ! -f dist/index.js ]; then
  echo "Building TypeScript"
  npm run build
fi

echo "Setup complete!" 