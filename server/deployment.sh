#!/bin/bash

# Print environment for debugging
echo "PWD: $(pwd)"
echo "NODE_ENV: $NODE_ENV"
echo "Directory contents:"
ls -la

# Make sure prisma directory exists
if [ ! -d prisma ]; then
  echo "Creating prisma directory"
  mkdir -p prisma
fi

# Check if schema exists
if [ ! -f prisma/schema.prisma ]; then
  echo "WARNING: Prisma schema file not found, deployment may fail!"
  echo "Searching for schema.prisma file:"
  find . -name "schema.prisma" -type f
  
  # If found elsewhere, copy it
  SCHEMA_PATH=$(find . -name "schema.prisma" -type f | head -n 1)
  if [ -n "$SCHEMA_PATH" ]; then
    echo "Found schema at $SCHEMA_PATH, copying to prisma/schema.prisma"
    mkdir -p prisma
    cp "$SCHEMA_PATH" prisma/schema.prisma
  fi
fi

# Install dependencies
echo "Installing dependencies"
npm ci

# Generate Prisma client if schema exists
if [ -f prisma/schema.prisma ]; then
  echo "Generating Prisma client"
  npx prisma generate --schema=./prisma/schema.prisma
  
  # Run migrations if necessary
  if [ "$NODE_ENV" = "production" ]; then
    echo "Running database migrations"
    npx prisma migrate deploy --schema=./prisma/schema.prisma
  fi
else
  echo "WARNING: Skipping Prisma generation, schema not found"
fi

# Build TypeScript
echo "Building TypeScript"
npm run build

echo "Deployment setup complete!" 