#!/usr/bin/env node

/**
 * This script is designed to be run as a standalone process using cron jobs or task schedulers
 * to ping the Supabase database and keep it active.
 *
 * Example cron job: Run every 10 minutes and log output to a file
 */

// Use the path module to ensure we have the right path to the .env file
const path = require('path');
const dotenvPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: dotenvPath });

// Import the ping function
const { pingDatabase } = require('./ping-supabase');

// Run the ping once and exit
pingDatabase()
  .then((success) => {
    if (success) {
      console.log('Database ping successful');
      process.exit(0);
    } else {
      console.error('Database ping failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Error during database ping:', error);
    process.exit(1);
  });
