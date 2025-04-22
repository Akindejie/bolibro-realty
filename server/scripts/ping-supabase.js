/**
 * Simple ping-supabase script for the fallback server
 * This script pings Supabase at regular intervals to keep the connection alive
 */

// Load environment variables
try {
  require('dotenv').config();
} catch (e) {
  console.log('Error loading dotenv, proceeding without it:', e.message);
}

// Check for essential environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Log configuration status
console.log('Ping service configuration:');
console.log('- SUPABASE_URL defined:', !!SUPABASE_URL);
console.log('- SUPABASE_KEY defined:', !!SUPABASE_KEY);

// Ping Supabase
async function pingSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('Missing Supabase configuration, skipping ping');
    return false;
  }

  try {
    console.log(`[${new Date().toISOString()}] Pinging Supabase...`);

    // Simple HTTP request to Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    console.log(
      `[${new Date().toISOString()}] Ping response status:`,
      response.status
    );
    return response.status >= 200 && response.status < 500;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Ping error:`, error.message);
    return false;
  }
}

// Start ping schedule
function startPingSchedule(intervalMinutes = 10, skipDb = false) {
  console.log(`Starting ping service with ${intervalMinutes} minute interval`);
  console.log(`Database ping ${skipDb ? 'disabled' : 'enabled'}`);

  // Initial ping
  setTimeout(() => {
    pingSupabase();
  }, 5000); // Start after 5 seconds

  // Set up regular interval
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(() => {
    pingSupabase();
  }, intervalMs);

  console.log('Ping schedule started');
}

module.exports = {
  pingSupabase,
  startPingSchedule,
};
