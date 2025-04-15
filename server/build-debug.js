// build-debug.js - Script to diagnose TypeScript build issues
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========== BUILD DEBUG INFORMATION ==========');
console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);

// Check if tsconfig.json exists
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  console.log('tsconfig.json exists');
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    console.log('tsconfig.json content:', JSON.stringify(tsconfig, null, 2));
  } catch (error) {
    console.error('Error reading tsconfig.json:', error);
  }
} else {
  console.error('tsconfig.json NOT FOUND!');
}

// Check if src/index.ts exists
const srcIndexPath = path.join(process.cwd(), 'src', 'index.ts');
if (fs.existsSync(srcIndexPath)) {
  console.log('src/index.ts exists');
  try {
    const fileStats = fs.statSync(srcIndexPath);
    console.log('File size:', fileStats.size, 'bytes');
    console.log('Last modified:', fileStats.mtime);
  } catch (error) {
    console.error('Error reading src/index.ts stats:', error);
  }
} else {
  console.error('src/index.ts NOT FOUND!');
}

// List src directory
console.log('\nContents of src directory:');
try {
  const srcPath = path.join(process.cwd(), 'src');
  if (fs.existsSync(srcPath)) {
    const srcFiles = fs.readdirSync(srcPath);
    srcFiles.forEach((file) => {
      const stats = fs.statSync(path.join(srcPath, file));
      console.log(
        `- ${file} ${stats.isDirectory() ? '(directory)' : '(file)'}`
      );
    });
  } else {
    console.error('src directory NOT FOUND!');
  }
} catch (error) {
  console.error('Error listing src directory:', error);
}

// Check if TypeScript is installed
console.log('\nChecking for TypeScript:');
try {
  const tscVersion = execSync('npx tsc --version').toString().trim();
  console.log('TypeScript version:', tscVersion);
} catch (error) {
  console.error('Error checking TypeScript version:', error.message);
}

// Try to run a manual TypeScript build
console.log('\nAttempting manual TypeScript build:');
try {
  execSync('mkdir -p dist', { stdio: 'inherit' });
  execSync('npx tsc --project tsconfig.json', { stdio: 'inherit' });
  console.log('Manual TypeScript build completed');

  // Check if dist/index.js was created
  const distIndexPath = path.join(process.cwd(), 'dist', 'index.js');
  if (fs.existsSync(distIndexPath)) {
    console.log('dist/index.js was successfully created');
    const fileStats = fs.statSync(distIndexPath);
    console.log('File size:', fileStats.size, 'bytes');
    console.log('Last modified:', fileStats.mtime);
  } else {
    console.error('dist/index.js NOT CREATED by manual build!');
  }

  // List dist directory
  console.log('\nContents of dist directory after manual build:');
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    const distFiles = fs.readdirSync(distPath);
    distFiles.forEach((file) => {
      const stats = fs.statSync(path.join(distPath, file));
      console.log(
        `- ${file} ${stats.isDirectory() ? '(directory)' : '(file)'}`
      );
    });
  } else {
    console.error('dist directory NOT FOUND after manual build!');
  }
} catch (error) {
  console.error('Manual TypeScript build FAILED:', error.message);
}

console.log('========== END DEBUG INFORMATION ==========');
