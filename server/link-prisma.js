#!/usr/bin/env node

/**
 * This script ensures that the Prisma client is properly linked
 * It's meant to be run in the Docker container after the client is generated
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Logging
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Find Prisma client directory
function findPrismaClientDir() {
  const possibleDirs = [
    path.join(process.cwd(), 'node_modules', '.prisma', 'client'),
    path.join(
      process.cwd(),
      'prisma',
      'server',
      'generated',
      'prisma',
      'client'
    ),
  ];

  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      log(`Found Prisma client at ${dir}`);
      return dir;
    }
  }

  log('Prisma client directory not found');
  return null;
}

// Create prisma-client-js symlink in node_modules
function createSymlink(sourceDir) {
  try {
    // Directory where the symlink should be created
    const nodeModulesDir = path.join(process.cwd(), 'node_modules', '@prisma');

    // Ensure the directory exists
    if (!fs.existsSync(nodeModulesDir)) {
      log(`Creating directory ${nodeModulesDir}`);
      fs.mkdirSync(nodeModulesDir, { recursive: true });
    }

    const targetDir = path.join(nodeModulesDir, 'client');

    // Remove existing directory or symlink if it exists
    if (fs.existsSync(targetDir)) {
      log(`Removing existing ${targetDir}`);
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    // Create symlink
    log(`Creating symlink from ${sourceDir} to ${targetDir}`);
    fs.symlinkSync(sourceDir, targetDir, 'dir');
    log('Symlink created successfully');

    return true;
  } catch (error) {
    log(`Error creating symlink: ${error.message}`);
    log(error.stack);
    return false;
  }
}

// Main function
async function main() {
  log('Starting Prisma client linking...');

  // Find the Prisma client directory
  const clientDir = findPrismaClientDir();

  if (!clientDir) {
    log('Cannot proceed without finding the Prisma client directory');

    // Try to generate the client
    log('Attempting to generate Prisma client...');
    try {
      execSync('npx prisma generate --schema=./prisma/schema.prisma', {
        stdio: 'inherit',
      });
      log('Prisma client generated');

      // Try to find the client directory again
      const newClientDir = findPrismaClientDir();
      if (newClientDir) {
        log(`Found Prisma client after generation at ${newClientDir}`);
        createSymlink(newClientDir);
      } else {
        log('Could not find Prisma client even after generation');
      }
    } catch (error) {
      log(`Failed to generate Prisma client: ${error.message}`);
    }

    return;
  }

  // Create the symlink
  createSymlink(clientDir);

  log('Prisma client linking completed');
}

// Run the main function
main().catch((error) => {
  log(`Unhandled error: ${error.message}`);
  log(error.stack);
  process.exit(1);
});
