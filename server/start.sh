#!/bin/sh

# Print environment for debugging
echo "Starting application..."
echo "Directory contents:"
ls -la

# Check if dist/index.js exists
if [ ! -f dist/index.js ]; then
  echo "WARNING: dist/index.js not found, using fallback server"
  
  # Check if fallback exists
  if [ -f index.js ]; then
    echo "Starting fallback server..."
    exec node index.js
  else
    echo "ERROR: No server found to start!"
    exit 1
  fi
fi

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
exec node dist/index.js 