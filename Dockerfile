FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY app-server.js ./server.js

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Ensure the server.js file is in the correct location
RUN mkdir -p /app && cp app-server.js /app/server.js 2>/dev/null || echo "Failed to copy app-server.js"

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "/app/server.js"] 