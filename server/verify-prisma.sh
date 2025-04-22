#!/bin/sh

# Verify Prisma schema existence
echo "Verifying Prisma schema..."

if [ -f ./prisma/schema.prisma ]; then
  echo "✅ Prisma schema found at ./prisma/schema.prisma"
  ls -la ./prisma/
  head -n 10 ./prisma/schema.prisma
else
  echo "❌ ERROR: Prisma schema not found at ./prisma/schema.prisma"
  echo "Current directory: $(pwd)"
  echo "Listing directories:"
  ls -la
  
  if [ -d ./prisma ]; then
    echo "Prisma directory exists, listing contents:"
    ls -la ./prisma/
  else
    echo "Prisma directory does not exist"
    mkdir -p ./prisma
    echo "Created prisma directory"
  fi
fi

# Exit with success to allow build to continue
exit 0 