#!/usr/bin/env node

/**
 * This script helps identify files that need updating after renaming database fields
 * from cognitoId to supabaseId, tenantCognitoId to tenantId, and managerCognitoId to managerId
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define the replacements we need to make
const replacements = [
  { from: 'cognitoId', to: 'supabaseId' },
  { from: 'managerCognitoId', to: 'managerId' },
  { from: 'tenantCognitoId', to: 'tenantId' },
];

// Find all files that contain the old field names
function findFiles() {
  console.log('Searching for files containing old field names...');

  const files = new Set();

  replacements.forEach(({ from }) => {
    try {
      const result = execSync(
        `grep -l "${from}" --include="*.ts" --include="*.js" -r server/src`
      ).toString();
      result
        .split('\n')
        .filter(Boolean)
        .forEach((file) => files.add(file));
    } catch (error) {
      // grep returns non-zero exit code if no matches found
      if (error.status !== 1) {
        console.error(`Error searching for ${from}:`, error);
      }
    }
  });

  return Array.from(files);
}

// Generate a report of changes needed
function generateReport(files) {
  console.log('\nFiles requiring changes:');

  files.forEach((file) => {
    console.log(`\n${file}:`);
    let content = fs.readFileSync(file, 'utf8');

    replacements.forEach(({ from, to }) => {
      const regex = new RegExp(from, 'g');
      const matches = content.match(regex);
      if (matches) {
        console.log(
          `  - Replace ${matches.length} occurrences of '${from}' with '${to}'`
        );
      }
    });
  });
}

// Apply changes to files
function applyChanges(files) {
  console.log('\nApplying changes to files...');

  let totalReplacements = 0;

  files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    replacements.forEach(({ from, to }) => {
      const regex = new RegExp(from, 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, to);
        totalReplacements += matches.length;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`  ✓ Updated ${file}`);
    }
  });

  console.log(`\nTotal replacements made: ${totalReplacements}`);
}

// Main execution
function main() {
  const files = findFiles();

  if (files.length === 0) {
    console.log('No files found containing old field names.');
    return;
  }

  console.log(`Found ${files.length} files containing old field names.`);

  generateReport(files);

  const shouldApply = process.argv.includes('--apply');

  if (shouldApply) {
    applyChanges(files);
    console.log('\nAll changes applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Run Prisma migrations to update the database schema');
    console.log('2. Regenerate the Prisma client');
    console.log('3. Test the application thoroughly');
  } else {
    console.log('\nTo apply these changes, run again with the --apply flag:');
    console.log('node scripts/update-field-references.js --apply');
  }
}

main();
