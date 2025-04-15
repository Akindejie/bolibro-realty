// build-debug.js - Script to diagnose TypeScript build issues
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a debug log function that writes to both console and a file
function debugLog(message) {
  console.log(message);
  fs.appendFileSync('build-debug.log', message + '\n');
}

// Clear previous log file
try {
  fs.writeFileSync('build-debug.log', '');
} catch (e) {
  console.error('Failed to clear log file:', e);
}

debugLog('========== BUILD DEBUG INFORMATION ==========');
debugLog('Current working directory: ' + process.cwd());
debugLog('Node version: ' + process.version);
debugLog('Environment: ' + process.env.NODE_ENV);

// Check if tsconfig.json exists
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  debugLog('tsconfig.json exists');
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    debugLog('tsconfig.json content: ' + JSON.stringify(tsconfig, null, 2));
  } catch (error) {
    debugLog('Error reading tsconfig.json: ' + error);
  }
} else {
  debugLog('tsconfig.json NOT FOUND!');
}

// Check if src/index.ts exists
const srcIndexPath = path.join(process.cwd(), 'src', 'index.ts');
if (fs.existsSync(srcIndexPath)) {
  debugLog('src/index.ts exists');
  try {
    const fileStats = fs.statSync(srcIndexPath);
    debugLog('File size: ' + fileStats.size + ' bytes');
    debugLog('Last modified: ' + fileStats.mtime);
    // Read the first few lines of the file for debugging
    const content = fs
      .readFileSync(srcIndexPath, 'utf8')
      .split('\n')
      .slice(0, 10)
      .join('\n');
    debugLog('First 10 lines of src/index.ts:\n' + content);
  } catch (error) {
    debugLog('Error reading src/index.ts stats: ' + error);
  }
} else {
  debugLog('src/index.ts NOT FOUND!');
}

// Check for package.json to see if typescript is listed as a dependency
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  debugLog('package.json exists');
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const typescriptVersion =
      (packageJson.dependencies && packageJson.dependencies.typescript) ||
      (packageJson.devDependencies && packageJson.devDependencies.typescript) ||
      'Not found';
    debugLog('TypeScript version in package.json: ' + typescriptVersion);
  } catch (error) {
    debugLog('Error reading package.json: ' + error);
  }
} else {
  debugLog('package.json NOT FOUND!');
}

// List src directory
debugLog('\nContents of src directory:');
try {
  const srcPath = path.join(process.cwd(), 'src');
  if (fs.existsSync(srcPath)) {
    const srcFiles = fs.readdirSync(srcPath);
    srcFiles.forEach((file) => {
      const stats = fs.statSync(path.join(srcPath, file));
      debugLog(` - ${file} ${stats.isDirectory() ? '(directory)' : '(file)'}`);
    });
  } else {
    debugLog('src directory NOT FOUND!');
  }
} catch (error) {
  debugLog('Error listing src directory: ' + error);
}

// Check if TypeScript is installed
debugLog('\nChecking for TypeScript:');
try {
  const tscVersion = execSync('npx tsc --version').toString().trim();
  debugLog('TypeScript version: ' + tscVersion);
} catch (error) {
  debugLog('Error checking TypeScript version: ' + error.message);
}

// Try to run a manual TypeScript build with verbose output
debugLog('\nAttempting manual TypeScript build:');
try {
  execSync('mkdir -p dist', { stdio: 'inherit' });

  // Run TSC with verbose output
  debugLog('Running tsc --listFiles to see which files are being included:');
  try {
    const listFiles = execSync(
      'npx tsc --listFiles -p tsconfig.json'
    ).toString();
    debugLog('Files included in compilation:\n' + listFiles);
  } catch (e) {
    debugLog('Error listing files: ' + e.message);
  }

  // Run the actual build with verbose diagnostics
  debugLog('Running tsc build with diagnostics:');
  try {
    execSync('npx tsc --traceResolution -p tsconfig.json', {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const traceOutput = 'Trace output would be too large to display';
    debugLog(traceOutput);

    // Save the full trace to a separate file
    fs.writeFileSync(
      'tsc-trace.log',
      execSync('npx tsc --traceResolution -p tsconfig.json').toString()
    );
    debugLog('Full trace output saved to tsc-trace.log');
  } catch (e) {
    debugLog('TypeScript build failed: ' + e.message);

    if (e.stdout) {
      fs.writeFileSync('tsc-error.log', e.stdout.toString());
      debugLog('Error output saved to tsc-error.log');
    }
  }

  // Try with explicitly specified files
  debugLog('Trying build with explicit source file:');
  try {
    execSync('npx tsc --outDir ./dist src/index.ts', {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    debugLog('Manual build with explicit file completed');
  } catch (e) {
    debugLog('Explicit file build failed: ' + e.message);
    if (e.stdout) {
      fs.writeFileSync('tsc-explicit-error.log', e.stdout.toString());
    }
  }

  // Check if dist/index.js was created
  const distIndexPath = path.join(process.cwd(), 'dist', 'index.js');
  if (fs.existsSync(distIndexPath)) {
    debugLog('dist/index.js was successfully created');
    const fileStats = fs.statSync(distIndexPath);
    debugLog('File size: ' + fileStats.size + ' bytes');
    debugLog('Last modified: ' + fileStats.mtime);

    // Check the content of the file
    const content =
      fs.readFileSync(distIndexPath, 'utf8').slice(0, 200) + '...';
    debugLog('First 200 characters of dist/index.js:\n' + content);
  } else {
    debugLog('dist/index.js NOT CREATED by manual build!');
  }

  // List dist directory
  debugLog('\nContents of dist directory after manual build:');
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    const distFiles = fs.readdirSync(distPath);
    debugLog(`Found ${distFiles.length} files/directories in dist/`);
    distFiles.forEach((file) => {
      const stats = fs.statSync(path.join(distPath, file));
      debugLog(` - ${file} ${stats.isDirectory() ? '(directory)' : '(file)'}`);

      // If it's a directory, check its contents too
      if (stats.isDirectory()) {
        try {
          const subFiles = fs.readdirSync(path.join(distPath, file));
          debugLog(`   Contains ${subFiles.length} files/directories`);
          subFiles.slice(0, 5).forEach((subFile) => {
            debugLog(`   - ${subFile}`);
          });
          if (subFiles.length > 5) {
            debugLog(`   ... and ${subFiles.length - 5} more`);
          }
        } catch (e) {
          debugLog(`   Error listing contents: ${e.message}`);
        }
      }
    });
  } else {
    debugLog('dist directory NOT FOUND after manual build!');
  }
} catch (error) {
  debugLog('Manual TypeScript build FAILED: ' + error.message);
}

debugLog('========== END DEBUG INFORMATION ==========');

// Try some fixes
debugLog('Attempting to fix the TypeScript build:');

// Fix 1: Create a minimal tsconfig.json with corrected settings
debugLog('Fix attempt 1: Creating a simpler tsconfig.json');
try {
  const simpleConfig = {
    compilerOptions: {
      target: 'es2016',
      module: 'commonjs',
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      strict: true,
      skipLibCheck: true,
      outDir: './dist',
    },
    include: ['src/**/*'],
  };

  fs.writeFileSync(
    'tsconfig.simple.json',
    JSON.stringify(simpleConfig, null, 2)
  );
  debugLog('Created tsconfig.simple.json');

  // Try building with the simple config
  debugLog('Building with simple config:');
  try {
    execSync('npx tsc -p tsconfig.simple.json', { stdio: 'inherit' });
    debugLog('Build with simple config succeeded');
  } catch (e) {
    debugLog('Build with simple config failed: ' + e.message);
  }
} catch (error) {
  debugLog('Failed to create simple tsconfig: ' + error.message);
}

// Check if dist/index.js was created after fix attempts
const fixedDistIndexPath = path.join(process.cwd(), 'dist', 'index.js');
if (fs.existsSync(fixedDistIndexPath)) {
  debugLog('FIXED: dist/index.js was successfully created after fix attempts');
} else {
  debugLog('STILL FAILING: dist/index.js not created after fix attempts');
}

debugLog('Build debug completed. Check build-debug.log for details.');
