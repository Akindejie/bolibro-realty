// Diagnostic script for Railway deployment
const fs = require('fs');
const path = require('path');

console.log('=== RAILWAY DEPLOYMENT DIAGNOSTICS ===');
console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);
console.log(
  'Environment variables:',
  Object.keys(process.env)
    .filter((key) => !key.includes('SECRET'))
    .join(', ')
);

// List all directories recursively up to 2 levels
function listDir(dir, level = 0, maxLevel = 2) {
  if (level > maxLevel) return;

  try {
    const files = fs.readdirSync(dir);
    console.log(`${'-'.repeat(level * 2)}[${dir}]:`);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        listDir(filePath, level + 1, maxLevel);
      } else {
        console.log(
          `${'-'.repeat((level + 1) * 2)}${file} (${stats.size} bytes)`
        );
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
}

// List contents of important directories
console.log('\n=== DIRECTORY STRUCTURE ===');
listDir('.');
listDir('/app', 0, 1);

// Check for server files
console.log('\n=== SERVER FILES CHECK ===');
const serverPaths = [
  './server.js',
  './server/server.js',
  './server/dist/index.js',
  '/app/server.js',
  '/app/server/server.js',
  '/app/server/dist/index.js',
];

serverPaths.forEach((serverPath) => {
  try {
    if (fs.existsSync(serverPath)) {
      console.log(
        `✅ ${serverPath} exists (${fs.statSync(serverPath).size} bytes)`
      );
    } else {
      console.log(`❌ ${serverPath} does not exist`);
    }
  } catch (err) {
    console.error(`Error checking ${serverPath}:`, err.message);
  }
});

// Output the result - we don't actually need to run the server
console.log('\n=== DIAGNOSTICS COMPLETE ===');
