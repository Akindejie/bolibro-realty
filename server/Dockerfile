FROM node:18-alpine

# Working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma files
COPY prisma ./prisma/

# 🛠️ Generate Prisma client
RUN npx prisma generate

# Copy build debug script
COPY src/scripts/build-debug.js ./src/scripts/
COPY src/scripts/ping-supabase.js ./src/scripts/

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Check if Prisma client is loaded successfully
RUN node -e "require('@prisma/client'); console.log('✅ Prisma client loaded successfully')"

# Create backup copies of key files
RUN mkdir -p /app/scripts && \
    cp -f /app/src/scripts/ping-supabase.js /app/scripts/ || echo "Could not copy ping-supabase.js (but will continue)" && \
    cp -f /app/fallback-server.js /app/dist/ || echo "Could not copy fallback-server.js to dist (but will continue)"

# Start with fallback mechanism
CMD ["node", "-e", "try { require('./dist/index.js') } catch(e) { console.error('Error loading main app:', e); try { require('./dist/fallback.js') } catch(e2) { console.error('Error loading TypeScript fallback:', e2); require('./fallback-server.js') } }"]