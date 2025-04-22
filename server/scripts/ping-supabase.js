/**
 * Simple script to periodically ping Supabase to keep the connection alive
 * This helps prevent database connections from timing out during periods of inactivity
 */

const https = require('https');

/**
 * Ping the Supabase project to keep connections alive
 */
function pingSupabaseProject() {
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    console.warn('SUPABASE_URL environment variable not set, skipping ping');
    return;
  }

  // Extract the host from the URL
  let host;
  try {
    const url = new URL(supabaseUrl);
    host = url.host;
  } catch (e) {
    console.error('Invalid SUPABASE_URL:', e.message);
    return;
  }

  const options = {
    hostname: host,
    port: 443,
    path: '/rest/v1/',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_ANON_KEY || '',
    },
  };

  const req = https.request(options, (res) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Supabase ping: Status Code ${res.statusCode}`);

    // Consume response data to free up memory
    res.resume();
  });

  req.on('error', (e) => {
    console.error(`Supabase ping error: ${e.message}`);
  });

  req.end();
}

/**
 * Start a schedule to ping Supabase at regular intervals
 * @param {number} intervalMinutes - Interval in minutes between pings
 */
function startPingSchedule(intervalMinutes = 5) {
  // First ping immediately
  pingSupabaseProject();

  // Then set up the interval
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(pingSupabaseProject, intervalMs);

  console.log(`Ping schedule started (every ${intervalMinutes} minutes)`);
}

// Export functions for use in other modules
module.exports = {
  pingSupabaseProject,
  startPingSchedule,
};
