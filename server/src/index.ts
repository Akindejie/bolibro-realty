// Load environment variables at the very top before any imports
require('dotenv').config();

import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
// Will use dynamic import for helmet
import morgan from 'morgan';
import applicationRoutes from './routes/applicationRoutes';
import { errorHandler } from './middleware/errorMiddleware';
import prisma, {
  checkDatabaseConnection,
  disconnectPrisma,
} from './utils/database';
import path from 'path';

/* ROUTE IMPORT */
import tenantRoutes from './routes/tenantRoutes';
import managerRoutes from './routes/managerRoutes';
import propertyRoutes from './routes/propertyRoutes';
import leaseRoutes from './routes/leaseRoutes';

// Import the database ping scheduler with skip-db flag - use require for JS files
const pingSupabase = require('./scripts/ping-supabase.js');
const { startPingSchedule } = pingSupabase;

/* CONFIGURATIONS */
const app: Express = express();
app.use(express.json());

// Use dynamic import for helmet
(async () => {
  const helmet = await import('helmet');
  app.use(helmet.default());
  app.use(helmet.default.crossOriginResourcePolicy({ policy: 'cross-origin' }));
})();

app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Configure CORS to allow requests from Vercel frontend
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://bolibro-realty.vercel.app',
      /\.vercel\.app$/, // Allow all subdomains of vercel.app
      'https://www.bolibrorealty.com',
      'https://bolibrorealty.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.static(path.join(__dirname, 'public')));

/* ROUTES */
app.get('/', (req, res) => {
  res.send('This is home route');
});

// Add a health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    const dbConnected = await checkDatabaseConnection();

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      auth: !!process.env.JWT_SECRET,
      database: {
        configured: !!process.env.DATABASE_URL,
        connected: dbConnected,
      },
      storage: !!process.env.SUPABASE_URL,
      services: {
        database: dbConnected ? 'online' : 'offline',
        storage: !!process.env.SUPABASE_URL ? 'configured' : 'not configured',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
    });
  }
});

app.use('/properties', propertyRoutes);
app.use('/tenants', tenantRoutes);
app.use('/managers', managerRoutes);
app.use('/leases', leaseRoutes);
app.use('/applications', applicationRoutes);

/* ERROR HANDLER */
app.use(errorHandler);

/* SERVER */
const port = Number(process.env.PORT) || 3002;

// Startup sequence
async function startServer() {
  try {
    // Log Supabase configuration status (without exposing secrets)
    console.log('Supabase configuration:');
    console.log('- URL defined:', !!process.env.SUPABASE_URL);
    console.log(
      '- URL value:',
      process.env.SUPABASE_URL
        ? `${process.env.SUPABASE_URL.slice(0, 5)}...`
        : 'undefined'
    );
    console.log('- Service key defined:', !!process.env.SUPABASE_SERVICE_KEY);
    console.log(
      '- Service key length:',
      process.env.SUPABASE_SERVICE_KEY?.length || 0
    );

    // Add a delay before database operations to give more time between nodemon restarts
    const delayTime = 2000;
    console.log(`Delaying database initialization for ${delayTime}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delayTime));

    // Initialize the server first, then check database after
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });

    // Now check database connectivity (after server is already running)
    console.log('Now checking database connectivity...');
    const dbConnected = await checkDatabaseConnection();

    if (!dbConnected) {
      console.warn('Database connection failed, but server is already running');
    } else {
      console.log('Database connection confirmed after server startup');
    }

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
      await disconnectPrisma();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
      await disconnectPrisma();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
