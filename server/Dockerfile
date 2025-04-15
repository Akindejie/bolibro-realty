FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies 
RUN apk add --no-cache python3 make g++

# Copy package files first 
COPY package*.json ./

# Show the directory content for debugging
RUN ls -la

# Copy Prisma directory separately
COPY prisma ./prisma/
RUN ls -la && echo "Checking prisma directory:" && ls -la prisma && cat prisma/schema.prisma

# Install dependencies (including devDependencies)
RUN npm ci

# Copy rest of the source code
COPY . .

# Debug content after copying
RUN echo "Contents after full copy:" && ls -la && ls -la prisma

# Generate Prisma client
RUN echo "Generating Prisma client..." && npx prisma generate --schema=./prisma/schema.prisma

# Build TypeScript code
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy server files
COPY app-server.js ./
COPY server.js ./
COPY health-check.js ./

# Make server.js executable
RUN chmod +x server.js

# Create /app/server.js as expected by Railway
RUN mkdir -p /app && cp app-server.js /app/server.js

# Expose port
EXPOSE 3001

# Start with health-check.js which will handle health checks immediately
# This should allow the health check to pass while the main server is starting
CMD ["node", "health-check.js"] 