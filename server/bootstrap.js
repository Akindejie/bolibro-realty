#!/usr/bin/env node

/**
 * Bootstrap script for Bolibro server
 * This script provides multiple fallbacks if the main server fails to start
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Logging with timestamps
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Check if Prisma schema exists
function checkPrismaSchema() {
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  return fs.existsSync(schemaPath);
}

// Check if dist directory exists
function checkDistDirectory() {
  const distPath = path.join(__dirname, 'dist');
  return fs.existsSync(distPath);
}

// Check if dist/index.js exists
function checkDistIndex() {
  const indexPath = path.join(__dirname, 'dist', 'index.js');
  return fs.existsSync(indexPath);
}

// Check if dist/fallback.js exists
function checkFallbackIndex() {
  const fallbackPath = path.join(__dirname, 'dist', 'fallback.js');
  return fs.existsSync(fallbackPath);
}

// Check if pure-fallback.js exists
function checkPureFallback() {
  const pureFallbackPath = path.join(__dirname, 'pure-fallback.js');
  return fs.existsSync(pureFallbackPath);
}

// Try to fix Prisma
function tryFixPrisma() {
  try {
    // Check if we have access to Prisma CLI
    log('Attempting to fix Prisma...');

    if (checkPrismaSchema()) {
      log('Prisma schema found, attempting to generate client...');
      try {
        execSync('npx prisma generate --schema=./prisma/schema.prisma', {
          stdio: 'inherit',
        });
        log('Prisma client generated successfully');
        return true;
      } catch (error) {
        log(`Failed to generate Prisma client: ${error.message}`);
      }
    } else {
      log('Prisma schema not found, cannot fix');
    }

    return false;
  } catch (error) {
    log(`Error trying to fix Prisma: ${error.message}`);
    return false;
  }
}

// Main bootstrap function
async function bootstrap() {
  log('Starting server bootstrap...');
  log(`Node version: ${process.version}`);
  log(`Current directory: ${__dirname}`);

  // List key directories and files
  log('Checking environment...');
  log(`Prisma schema exists: ${checkPrismaSchema()}`);
  log(`Dist directory exists: ${checkDistDirectory()}`);
  log(`Main index.js exists: ${checkDistIndex()}`);
  log(`Fallback index exists: ${checkFallbackIndex()}`);
  log(`Pure fallback exists: ${checkPureFallback()}`);

  // Try to start the main server
  try {
    log('Attempting to start main server...');
    if (checkDistIndex()) {
      log('Loading dist/index.js...');
      require('./dist/index.js');
      return; // Successfully started
    } else {
      log('dist/index.js not found');
    }
  } catch (error) {
    log(`Failed to start main server: ${error.message}`);

    // Try to fix Prisma if it seems to be a Prisma issue
    if (error.message.includes('Prisma') || error.message.includes('prisma')) {
      const fixed = tryFixPrisma();
      if (fixed) {
        log('Prisma fixed, trying main server again...');
        try {
          require('./dist/index.js');
          return; // Successfully started after fix
        } catch (secondError) {
          log(`Still failed after Prisma fix: ${secondError.message}`);
        }
      }
    }
  }

  // Try TypeScript fallback
  try {
    log('Attempting to start TS fallback server...');
    if (checkFallbackIndex()) {
      log('Loading dist/fallback.js...');
      require('./dist/fallback.js');
      return; // Successfully started fallback
    } else {
      log('dist/fallback.js not found');
    }
  } catch (fallbackError) {
    log(`Failed to start TS fallback server: ${fallbackError.message}`);
  }

  // Try pure JavaScript fallback
  try {
    log('Attempting to start pure JavaScript fallback server...');
    if (checkPureFallback()) {
      log('Loading pure-fallback.js...');
      require('./pure-fallback.js');
      return; // Successfully started pure fallback
    } else {
      log('pure-fallback.js not found');
    }
  } catch (pureFallbackError) {
    log(
      `Failed to start pure JavaScript fallback server: ${pureFallbackError.message}`
    );
  }

  // Last resort: fallback server
  try {
    log('Attempting to start minimal fallback server...');
    require('./fallback-server.js');
  } catch (minimalError) {
    log(`Failed to start minimal fallback server: ${minimalError.message}`);
    log('All startup attempts failed. Exiting.');
    process.exit(1);
  }
}

// Start the bootstrap process
bootstrap().catch((err) => {
  log(`Fatal bootstrap error: ${err.message}`);
  log(err.stack);
  process.exit(1);
});
