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
COPY pure-fallback.js ./
COPY bootstrap.js ./
COPY link-prisma.js ./
COPY tsconfig*.json ./

# Make scripts executable
RUN chmod +x ./verify-prisma.sh
RUN chmod +x ./bootstrap.js
RUN chmod +x ./pure-fallback.js
RUN chmod +x ./link-prisma.js

# Run verification script
RUN ./verify-prisma.sh

# Temporarily disable postinstall script to avoid premature Prisma generation
RUN npm pkg set scripts.postinstall="echo Skipping automatic postinstall"

# Install dependencies
RUN npm ci

# Create scripts directory structure and copy ping script to multiple locations
RUN mkdir -p /app/scripts \
    && mkdir -p /app/dist/scripts \
    && mkdir -p /app/src/scripts

# Copy the simplified ping-supabase.js script from the scripts directory
COPY scripts/ping-supabase.js /app/scripts/
COPY scripts/ping-supabase.js /app/dist/scripts/
COPY scripts/ping-supabase.js /app/src/scripts/

# Copy remaining source files
COPY . .

# Generate Prisma client explicitly with full path
RUN npx prisma generate --schema=./prisma/schema.prisma || echo "Failed to generate Prisma client, but continuing build"

# Run the link-prisma script to ensure Prisma client is properly linked
RUN node link-prisma.js

# Build the fallback server first to ensure we have a working minimal version
RUN npm run build:fallback || echo "Failed to build fallback, continuing with main build"

# Re-enable postinstall script for future use
RUN npm pkg set scripts.postinstall="node -e \"const fs=require('fs'); if(fs.existsSync('./prisma/schema.prisma')) { console.log('Prisma schema found, generating client...'); require('child_process').execSync('prisma generate --schema=./prisma/schema.prisma', {stdio: 'inherit'}); } else { console.log('WARNING: Prisma schema not found'); }\""

# Build the application, but continue even if it fails
RUN npm run build || echo "Main build failed, will use fallback"

# Make sure latest ping-supabase.js is copied everywhere it might be needed
RUN cp -f /app/scripts/ping-supabase.js /app/dist/scripts/ \
    && cp -f /app/scripts/ping-supabase.js /app/src/scripts/ \
    && cp -f /app/fallback-server.js /app/dist/ \
    && cp -f /app/pure-fallback.js /app/dist/

# Create a healthcheck to see if we're still running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:$PORT/health || exit 1

# Set environment variable for Node
ENV NODE_ENV=production

# Expose the port that the app uses
EXPOSE $PORT

# Start with bootstrap script
CMD ["node", "bootstrap.js"]