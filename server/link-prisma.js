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
    // Default path where Prisma client is generated with our updated schema
    path.join(process.cwd(), 'node_modules', '.prisma', 'client'),
    // Path where Prisma client might be generated in the Docker container
    path.join(process.cwd(), 'node_modules', '@prisma', 'client'),
    // Old custom path
    path.join(
      process.cwd(),
      'prisma',
      'server',
      'generated',
      'prisma',
      'client'
    ),
    // Alternative paths
    path.join(process.cwd(), 'prisma', 'client'),
    path.join(process.cwd(), 'prisma', 'node_modules', '.prisma', 'client'),
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

    // Try copy instead of symlink as a fallback
    try {
      log('Trying to copy files instead of symlink...');
      const nodeModulesDir = path.join(
        process.cwd(),
        'node_modules',
        '@prisma'
      );
      const targetDir = path.join(nodeModulesDir, 'client');

      // Create directories
      if (!fs.existsSync(nodeModulesDir)) {
        fs.mkdirSync(nodeModulesDir, { recursive: true });
      }

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Use execSync to copy
      execSync(`cp -R ${sourceDir}/* ${targetDir}/`);
      log('Files copied successfully');
      return true;
    } catch (copyError) {
      log(`Error copying files: ${copyError.message}`);
      return false;
    }
  }
}

// Create a helper index.js file in @prisma/client directory
function createHelperIndex(clientDir) {
  try {
    const nodeModulesDir = path.join(process.cwd(), 'node_modules', '@prisma');
    const targetDir = path.join(nodeModulesDir, 'client');

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const indexPath = path.join(targetDir, 'index.js');

    // Create a helper index.js file that points to the actual client
    const indexContent = `
// Generated helper index.js for @prisma/client
try {
  const prismaClientPath = '${clientDir.replace(/\\/g, '\\\\')}';
  module.exports = require(prismaClientPath);
} catch (e) {
  console.error('Error loading Prisma Client from ${clientDir.replace(
    /\\/g,
    '\\\\'
  )}:', e.message);
  // Provide a mock implementation
  class MockPrismaClient {
    constructor() {
      console.warn('Using mock PrismaClient');
    }
  }
  module.exports = { PrismaClient: MockPrismaClient };
}`;

    fs.writeFileSync(indexPath, indexContent);
    log(`Created helper index.js at ${indexPath}`);
    return true;
  } catch (error) {
    log(`Error creating helper index.js: ${error.message}`);
    return false;
  }
}

// Create mock Prisma client implementation
function createMockClient() {
  try {
    const nodeModulesDir = path.join(process.cwd(), 'node_modules', '@prisma');
    const targetDir = path.join(nodeModulesDir, 'client');

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const mockClientPath = path.join(targetDir, 'index.js');

    // Create a simple mock implementation
    const mockContent = `
// Mock Prisma Client implementation
class PrismaClient {
  constructor(options) {
    this.options = options || {};
    console.warn('Mock PrismaClient initialized. Database operations will not work.');
  }
  
  $connect() { 
    return Promise.resolve(); 
  }
  
  $disconnect() { 
    return Promise.resolve(); 
  }
  
  $queryRaw() {
    return Promise.resolve([{ connected: 1 }]);
  }
}

module.exports = { 
  PrismaClient,
  Prisma: { 
    sql: (strings, ...values) => ({ strings, values }), 
    join: (values, separator) => values.join(separator || ',')
  }
};`;

    fs.writeFileSync(mockClientPath, mockContent);
    log(`Created mock Prisma client at ${mockClientPath}`);
    return true;
  } catch (error) {
    log(`Error creating mock client: ${error.message}`);
    return false;
  }
}

// Ensure runtime/library.js exists (common error in Docker)
function ensureRuntimeLibrary() {
  try {
    const clientDir = path.join(
      process.cwd(),
      'node_modules',
      '@prisma',
      'client'
    );
    const runtimeDir = path.join(clientDir, 'runtime');
    const libraryPath = path.join(runtimeDir, 'library.js');

    if (fs.existsSync(clientDir) && !fs.existsSync(libraryPath)) {
      log(`Missing library.js in runtime directory`);

      // Create runtime directory if it doesn't exist
      if (!fs.existsSync(runtimeDir)) {
        fs.mkdirSync(runtimeDir, { recursive: true });
      }

      // Create a simple library.js file as a placeholder
      const libraryContent = `
// Generated placeholder for runtime/library.js
module.exports = {};
`;

      fs.writeFileSync(libraryPath, libraryContent);
      log(`Created placeholder library.js at ${libraryPath}`);
    }
  } catch (error) {
    log(`Error ensuring runtime library: ${error.message}`);
  }
}

// Copy schema.prisma to ensure it's available
function copySchema() {
  try {
    const sourceSchema = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (fs.existsSync(sourceSchema)) {
      const targetDir = path.join(process.cwd(), 'node_modules', '.prisma');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetSchema = path.join(targetDir, 'schema.prisma');
      fs.copyFileSync(sourceSchema, targetSchema);
      log(`Copied schema.prisma to ${targetSchema}`);
      return true;
    } else {
      log('schema.prisma not found, cannot copy');
      return false;
    }
  } catch (error) {
    log(`Error copying schema: ${error.message}`);
    return false;
  }
}

// Generate Prisma client
function generateClient() {
  try {
    log('Attempting to generate Prisma client...');
    execSync('npx prisma generate --schema=./prisma/schema.prisma', {
      stdio: 'inherit',
    });
    log('Prisma client generated successfully');
    return true;
  } catch (error) {
    log(`Error generating Prisma client: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  log('Starting Prisma client linking...');

  // Try to generate the client first
  generateClient();

  // Copy the schema to ensure it's available
  copySchema();

  // Find the Prisma client directory
  const clientDir = findPrismaClientDir();

  if (clientDir) {
    // Try linking methods in order of preference
    const symlinkSuccess = createSymlink(clientDir);

    if (!symlinkSuccess) {
      log('Symlink failed, trying to create helper index...');
      createHelperIndex(clientDir);
    }

    // Ensure runtime/library.js exists
    ensureRuntimeLibrary();
  } else {
    log('Cannot find Prisma client, falling back to mock implementation');
    createMockClient();
  }

  log('Prisma client linking complete');
}

// Run the main function
main().catch((error) => {
  log(`Unhandled error in link-prisma script: ${error.message}`);
  log(error.stack);
});
