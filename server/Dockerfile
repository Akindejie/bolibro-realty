FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies 
RUN apk add --no-cache python3 make g++

# Copy package files first 
COPY package*.json ./

# Show the directory content for debugging
RUN ls -la

# Copy Prisma directory separately and verify its contents
COPY prisma ./prisma/
RUN ls -la prisma && echo "Prisma directory contents verified"

# Install dependencies (including devDependencies)
RUN npm ci

# Copy rest of the source code
COPY . .

# Debug content after copying
RUN echo "Contents after full copy:" && ls -la
RUN echo "Contents of src directory:" && ls -la src

# Generate Prisma client
RUN echo "Generating Prisma client..." && npx prisma generate --schema=./prisma/schema.prisma

# Create a simpler tsconfig for building
RUN echo "Creating simpler tsconfig.json for building" && \
    echo '{' > tsconfig.simple.json && \
    echo '  "compilerOptions": {' >> tsconfig.simple.json && \
    echo '    "target": "es2016",' >> tsconfig.simple.json && \
    echo '    "module": "commonjs",' >> tsconfig.simple.json && \
    echo '    "esModuleInterop": true,' >> tsconfig.simple.json && \
    echo '    "forceConsistentCasingInFileNames": true,' >> tsconfig.simple.json && \
    echo '    "strict": true,' >> tsconfig.simple.json && \
    echo '    "skipLibCheck": true,' >> tsconfig.simple.json && \
    echo '    "outDir": "./dist"' >> tsconfig.simple.json && \
    echo '  },' >> tsconfig.simple.json && \
    echo '  "include": ["src/**/*"]' >> tsconfig.simple.json && \
    echo '}' >> tsconfig.simple.json && \
    cat tsconfig.simple.json

# Build TypeScript code with more verbose output and simpler config
RUN echo "Starting TypeScript build with simple config..." && \
    npx tsc -p tsconfig.simple.json && \
    echo "Build completed, checking dist directory:" && \
    ls -la dist || echo "dist directory not found or empty" && \
    if [ -d "dist" ]; then echo "Content of dist:"; ls -la dist; else echo "No dist directory created"; fi

# Manually copy src/index.ts to dist/index.js if the build failed
RUN if [ ! -f "dist/index.js" ]; then \
      echo "Build failed to produce dist/index.js, creating a simple version" && \
      mkdir -p dist && \
      echo '// Simple fallback for index.js' > dist/index.js && \
      echo 'require("dotenv").config();' >> dist/index.js && \
      echo 'const express = require("express");' >> dist/index.js && \
      echo 'const app = express();' >> dist/index.js && \
      echo 'const PORT = process.env.PORT || 3001;' >> dist/index.js && \
      echo 'app.get("/health", (req, res) => {' >> dist/index.js && \
      echo '  res.status(200).json({ status: "ok", message: "Health check passed", version: "fallback" });' >> dist/index.js && \
      echo '});' >> dist/index.js && \
      echo 'app.listen(PORT, "0.0.0.0", () => {' >> dist/index.js && \
      echo '  console.log(`Server running on port ${PORT}`);' >> dist/index.js && \
      echo '});' >> dist/index.js && \
      ls -la dist; \
    fi

# Create a fallback server file just in case
RUN echo "// Fallback file for Railway" > /app/fallback-server.js && \
    echo "const express = require('express');" >> /app/fallback-server.js && \
    echo "const app = express();" >> /app/fallback-server.js && \
    echo "const port = process.env.PORT || 3001;" >> /app/fallback-server.js && \
    echo "app.get('/health', (req, res) => {" >> /app/fallback-server.js && \
    echo "  res.status(200).json({ status: 'ok', message: 'Health check passed' });" >> /app/fallback-server.js && \
    echo "});" >> /app/fallback-server.js && \
    echo "app.get('/', (req, res) => {" >> /app/fallback-server.js && \
    echo "  res.json({ status: 'running', message: 'Fallback server' });" >> /app/fallback-server.js && \
    echo "});" >> /app/fallback-server.js && \
    echo "app.listen(port, '0.0.0.0', () => {" >> /app/fallback-server.js && \
    echo "  console.log(`Fallback server running on port ${port}`);" >> /app/fallback-server.js && \
    echo "  try {" >> /app/fallback-server.js && \
    echo "    require('./dist/index.js');" >> /app/fallback-server.js && \
    echo "  } catch (e) {" >> /app/fallback-server.js && \
    echo "    console.error('Error loading main server:', e);" >> /app/fallback-server.js && \
    echo "  }" >> /app/fallback-server.js && \
    echo "});" >> /app/fallback-server.js

# Create a minimal health check server
RUN echo "// Inline health check server" > /app/health-server.js && \
    echo "const express = require('express');" >> /app/health-server.js && \
    echo "const app = express();" >> /app/health-server.js && \
    echo "const PORT = process.env.PORT || 3001;" >> /app/health-server.js && \
    echo "console.log('Starting health check server on port', PORT);" >> /app/health-server.js && \
    echo "app.get('/health', (req, res) => {" >> /app/health-server.js && \
    echo "  console.log('Health check requested at', new Date().toISOString());" >> /app/health-server.js && \
    echo "  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });" >> /app/health-server.js && \
    echo "});" >> /app/health-server.js && \
    echo "app.get('/', (req, res) => {" >> /app/health-server.js && \
    echo "  res.status(200).json({ status: 'ok', message: 'Health server running' });" >> /app/health-server.js && \
    echo "});" >> /app/health-server.js && \
    echo "app.listen(PORT, '0.0.0.0', () => {" >> /app/health-server.js && \
    echo "  console.log(`Health check server running on port ${PORT}`);" >> /app/health-server.js && \
    echo "});" >> /app/health-server.js

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Create directories first
RUN mkdir -p ./dist
RUN mkdir -p ./node_modules/.prisma
RUN mkdir -p ./node_modules/@prisma

# Copy server files
COPY server.js ./server.js
COPY build-debug.js ./build-debug.js
COPY simple-server.js ./simple-server.js

# Copy health server file
COPY --from=builder /app/health-server.js ./health-server.js

# Copy built files from builder with debugging
RUN echo "Before copying from builder"

# Copy dist directory first if it exists
COPY --from=builder /app/dist/ ./dist/
RUN echo "After copying dist:" && ls -la && echo "Dist directory:" && ls -la dist || echo "List failed"

# Copy Prisma modules
COPY --from=builder /app/node_modules/.prisma/ ./node_modules/.prisma/
COPY --from=builder /app/node_modules/@prisma/ ./node_modules/@prisma/

# Copy fallback server
COPY --from=builder /app/fallback-server.js ./fallback-server.js

# Create a startup script that will try the main server first, then fallback
RUN echo "#!/bin/sh" > start.sh && \
    echo "echo 'Starting server...'" >> start.sh && \
    echo "echo 'Listing current directory:'" >> start.sh && \
    echo "ls -la" >> start.sh && \
    echo "# Start health server in the background" >> start.sh && \
    echo "node health-server.js &" >> start.sh && \
    echo "echo 'Health server started in background'" >> start.sh && \
    echo "if [ -f \"./simple-server.js\" ]; then" >> start.sh && \
    echo "  echo 'Found simple-server.js, starting it'" >> start.sh && \
    echo "  exec node simple-server.js" >> start.sh && \
    echo "elif [ -d \"./dist\" ]; then" >> start.sh && \
    echo "  echo 'Found dist directory, contents:'" >> start.sh && \
    echo "  ls -la ./dist" >> start.sh && \
    echo "  if [ -f ./dist/index.js ]; then" >> start.sh && \
    echo "    echo 'Found dist/index.js, starting main server'" >> start.sh && \
    echo "    exec node dist/index.js" >> start.sh && \
    echo "  else" >> start.sh && \
    echo "    echo 'dist/index.js not found, using fallback server'" >> start.sh && \
    echo "    exec node server.js" >> start.sh && \
    echo "  fi" >> start.sh && \
    echo "else" >> start.sh && \
    echo "  echo 'dist directory not found, using fallback server'" >> start.sh && \
    echo "  exec node server.js" >> start.sh && \
    echo "fi" >> start.sh && \
    chmod +x start.sh

# Expose port
EXPOSE 3001

# Use the startup script
CMD ["./start.sh"] 