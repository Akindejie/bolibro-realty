FROM node:18-alpine

# Working directory
WORKDIR /app

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

# Copy package files first
COPY package*.json ./

# Copy the verification script and Prisma schema directory
COPY verify-prisma.sh ./
COPY prisma ./prisma/
COPY fallback-server.js ./
COPY bootstrap.js ./

# Make scripts executable
RUN chmod +x ./verify-prisma.sh
RUN chmod +x ./bootstrap.js

# Run verification script
RUN ./verify-prisma.sh

# Temporarily disable postinstall script to avoid premature Prisma generation
RUN npm pkg set scripts.postinstall="echo Skipping automatic postinstall"

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma client explicitly with full path
RUN npx prisma generate --schema=./prisma/schema.prisma || echo "Failed to generate Prisma client, but continuing build"

# Re-enable postinstall script for future use
RUN npm pkg set scripts.postinstall="node -e \"const fs=require('fs'); if(fs.existsSync('./prisma/schema.prisma')) { console.log('Prisma schema found, generating client...'); require('child_process').execSync('prisma generate --schema=./prisma/schema.prisma', {stdio: 'inherit'}); } else { console.log('WARNING: Prisma schema not found'); }\""

# Build the application
RUN npm run build

# Create backup copies of key files
RUN mkdir -p /app/scripts && \
    cp -f /app/src/scripts/ping-supabase.js /app/scripts/ || echo "Could not copy ping-supabase.js (but will continue)" && \
    cp -f /app/fallback-server.js /app/dist/ || echo "Could not copy fallback-server.js to dist (but will continue)"

# Create a healthcheck to see if we're still running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:$PORT/health || exit 1

# Set environment variable for Node
ENV NODE_ENV=production

# Expose the port that the app uses
EXPOSE $PORT

# Start with bootstrap script
CMD ["node", "bootstrap.js"]