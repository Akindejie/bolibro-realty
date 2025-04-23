#!/bin/bash

# Fix for "prepared statement already exists" error in Prisma with Supabase

echo "🛠️ Running fix for prepared statement error..."

# Navigate to the server directory
cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  echo "Please create a .env file with your database connection settings first."
  exit 1
fi

# Check if DATABASE_URL is correctly formatted
if ! grep -q "DATABASE_URL=postgresql://" .env && ! grep -q "DATABASE_URL=postgres://" .env; then
  echo "⚠️ Warning: DATABASE_URL in .env file does not start with postgresql:// or postgres://"
  echo "Attempting to fix DATABASE_URL format..."
  
  # Get the current DATABASE_URL
  DB_URL=$(grep "DATABASE_URL=" .env | sed 's/DATABASE_URL=//')
  
  # Create a backup of the .env file
  cp .env .env.backup
  echo "✅ Created backup of .env file as .env.backup"
  
  # Ask user to input a valid DATABASE_URL if current one is invalid
  echo "Enter a valid Supabase DATABASE_URL (should start with postgresql://username:password@hostname:port/database):"
  read -p "> " NEW_DB_URL
  
  # Update the DATABASE_URL in the .env file
  sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=$NEW_DB_URL|" .env
  echo "✅ Updated DATABASE_URL in .env file"
fi

# Run the environment update script
echo "1️⃣ Updating database connection parameters..."
node update-env.js

# Clean up any stale Prisma state
echo "2️⃣ Cleaning up Prisma state..."
rm -rf node_modules/.prisma/client/libquery_engine-*

# Regenerate Prisma client
echo "3️⃣ Regenerating Prisma client..."
npx prisma generate

# Verify database connection
echo "4️⃣ Testing database connection..."
node src/scripts/check-db-connection.js

echo "5️⃣ Fix complete! 🎉"
echo "Restart your server with: npm run dev" 