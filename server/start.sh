#!/bin/bash

# Print environment for debugging
echo "Starting application..."
echo "Directory contents:"
ls -la

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL is not set, database operations will fail!"
else
  echo "DATABASE_URL is set, checking database connection..."
  
  # Check if schema exists
  if [ -f prisma/schema.prisma ]; then
    echo "Running database migrations"
    npx prisma migrate deploy --schema=./prisma/schema.prisma || echo "Migration failed, but continuing..."
  else
    echo "WARNING: Prisma schema not found, skipping migrations"
  fi
fi

# Start the application
echo "Starting Node.js application..."
node dist/index.js 