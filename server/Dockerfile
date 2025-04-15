FROM node:18-alpine

# Working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma files
COPY prisma ./prisma/

# Copy build debug script
COPY build-debug.js ./

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Create proper fallback server that includes ping-supabase functionality
RUN echo '// Fallback server for when the main server fails to build or start\n\
const express = require("express");\n\
const fs = require("fs");\n\
const path = require("path");\n\
\n\
const app = express();\n\
const PORT = process.env.PORT || 3000;\n\
\n\
// Try to load ping-supabase script\n\
let pingSupabase = null;\n\
try {\n\
  // Try multiple possible locations for the ping-supabase script\n\
  const possiblePaths = [\n\
    "./dist/scripts/ping-supabase.js",\n\
    "./src/scripts/ping-supabase.js",\n\
    "./scripts/ping-supabase.js"\n\
  ];\n\
  \n\
  for (const scriptPath of possiblePaths) {\n\
    if (fs.existsSync(scriptPath)) {\n\
      console.log(`Found ping-supabase script at ${scriptPath}`);\n\
      pingSupabase = require(scriptPath);\n\
      break;\n\
    }\n\
  }\n\
  \n\
  if (pingSupabase && typeof pingSupabase.startPingSchedule === "function") {\n\
    console.log("Starting ping schedule...");\n\
    pingSupabase.startPingSchedule(10); // Ping every 10 minutes\n\
  } else {\n\
    console.error("startPingSchedule function not found in ping-supabase.js");\n\
  }\n\
} catch (e) {\n\
  console.error("Failed to load ping-supabase script:", e);\n\
}\n\
\n\
// Health check endpoint\n\
app.get("/health", (req, res) => {\n\
  res.status(200).json({ status: "ok", message: "Fallback server is running" });\n\
});\n\
\n\
// Root endpoint\n\
app.get("/", (req, res) => {\n\
  res.status(200).json({\n\
    status: "ok",\n\
    message: "Bolibro Realty API Fallback Server",\n\
    mode: "fallback",\n\
    ping_service: pingSupabase ? "enabled" : "disabled"\n\
  });\n\
});\n\
\n\
// Start server\n\
app.listen(PORT, () => {\n\
  console.log(`Fallback server running on port ${PORT}`);\n\
});\n\
' > /app/fallback-server.js

# Create startup script that tries main server first, falls back to fallback server
RUN echo '#!/bin/sh\n\
\n\
# First, check if main server exists\n\
if [ -f /app/dist/index.js ]; then\n\
  echo "Starting main server..."\n\
  node /app/dist/index.js\n\
elif [ -f /app/server.js ]; then\n\
  echo "Starting server.js..."\n\
  node /app/server.js\n\
else\n\
  echo "Main server not found. Starting fallback server..."\n\
  node /app/fallback-server.js\n\
fi\n\
' > /app/start.sh

# Make startup script executable
RUN chmod +x /app/start.sh

# Copy ping-supabase.js to another location as backup
RUN mkdir -p /app/scripts && cp -f /app/src/scripts/ping-supabase.js /app/scripts/ || echo "Could not copy ping-supabase.js (but will continue)"

# Command to run the application
CMD ["/app/start.sh"] 