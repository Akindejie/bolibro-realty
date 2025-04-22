FROM node:18-alpine

# Working directory
WORKDIR /app

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Copy fallback server first
COPY fallback-server.js ./

# Copy source files
COPY . .

# Generate Prisma client explicitly
RUN npx prisma generate --schema=./prisma/schema.prisma

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

# Start with fallback mechanism
CMD ["npm", "start"]