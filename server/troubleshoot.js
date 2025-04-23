#!/usr/bin/env node

/**
 * Troubleshooting script for Prisma and server startup issues
 * This will be run automatically during bootstrap if there are issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Utility function for consistent logging
function log(message) {
  console.log(`[TROUBLESHOOT] ${message}`);
}

// Check if a directory or file exists
function exists(p) {
  try {
    return fs.existsSync(p);
  } catch (e) {
    return false;
  }
}

// List directory contents
function listDir(dir) {
  try {
    if (!exists(dir)) {
      return `Directory ${dir} does not exist`;
    }

    const files = fs.readdirSync(dir, { withFileTypes: true });
    return files
      .map((f) => `${f.isDirectory() ? '[DIR]' : '[FILE]'} ${f.name}`)
      .join('\n');
  } catch (e) {
    return `Error reading directory ${dir}: ${e.message}`;
  }
}

// Check module resolution
function checkModuleResolution(moduleName) {
  try {
    const resolvedPath = require.resolve(moduleName);
    log(`Module '${moduleName}' resolves to: ${resolvedPath}`);
    return true;
  } catch (e) {
    log(`Module '${moduleName}' resolution failed: ${e.message}`);
    return false;
  }
}

// Main troubleshooting function
async function troubleshoot() {
  log('Starting troubleshooting process...');

  // Check environment
  log('Environment variables:');
  log(`NODE_ENV: ${process.env.NODE_ENV}`);
  log(`PORT: ${process.env.PORT}`);
  log(`DATABASE_URL defined: ${!!process.env.DATABASE_URL}`);
  log(`DATABASE_DIRECT_URL defined: ${!!process.env.DATABASE_DIRECT_URL}`);

  // Check current directory
  log(`Current directory: ${process.cwd()}`);

  // Check for Prisma schema
  const prismaSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  log(`Prisma schema exists: ${exists(prismaSchemaPath)}`);

  if (exists(prismaSchemaPath)) {
    log('Prisma schema content:');
    log(
      fs
        .readFileSync(prismaSchemaPath, 'utf8')
        .split('\n')
        .slice(0, 10)
        .join('\n') + '...'
    );
  }

  // Check for Prisma client in various locations
  log('Checking for Prisma client locations:');
  const prismaLocations = [
    path.join(process.cwd(), 'node_modules', '.prisma', 'client'),
    path.join(process.cwd(), 'node_modules', '@prisma', 'client'),
    path.join(process.cwd(), 'prisma', 'client'),
  ];

  prismaLocations.forEach((loc) => {
    log(`Location ${loc}: ${exists(loc) ? 'EXISTS' : 'NOT FOUND'}`);
    if (exists(loc)) {
      log(`Contents of ${loc}:\n${listDir(loc)}`);
    }
  });

  // Check Prisma runtime
  const runtimeDir = path.join(
    process.cwd(),
    'node_modules',
    '@prisma',
    'client',
    'runtime'
  );
  log(`Prisma runtime directory exists: ${exists(runtimeDir)}`);

  if (exists(runtimeDir)) {
    log(`Contents of runtime directory:\n${listDir(runtimeDir)}`);

    const libraryPath = path.join(runtimeDir, 'library.js');
    log(`library.js exists: ${exists(libraryPath)}`);

    if (exists(libraryPath)) {
      log(`library.js size: ${fs.statSync(libraryPath).size} bytes`);
    }
  }

  // Check module resolution
  log('Testing module resolution:');
  checkModuleResolution('@prisma/client');
  checkModuleResolution('express');

  // Check filesystem permissions
  try {
    log('Checking filesystem permissions:');
    const testFile = path.join(process.cwd(), 'prisma', 'test-write.tmp');
    fs.writeFileSync(testFile, 'test');
    log(`Write test: SUCCESS`);
    fs.unlinkSync(testFile);
    log(`Delete test: SUCCESS`);
  } catch (e) {
    log(`Filesystem test failed: ${e.message}`);
  }

  // Try to generate Prisma client
  try {
    log('Attempting to generate Prisma client:');
    const output = execSync('npx prisma generate', { encoding: 'utf8' });
    log(`Generation output: ${output}`);
  } catch (e) {
    log(`Prisma generation failed: ${e.message}`);
  }

  log('Troubleshooting complete');
}

// Run the troubleshooting
troubleshoot().catch((err) => {
  log(`Troubleshooting error: ${err.message}`);
  log(err.stack);
});
