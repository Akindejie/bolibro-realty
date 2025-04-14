// Load environment variables at the very top before any imports
require('dotenv').config();

import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import applicationRoutes from './routes/applicationRoutes';
import { errorHandler } from './middleware/errorMiddleware';
import { ensureBucketsExist } from './config/supabase';
import { checkDatabaseConnection } from './utils/database';
import path from 'path';

/* ROUTE IMPORT */
import tenantRoutes from './routes/tenantRoutes';
import managerRoutes from './routes/managerRoutes';
import propertyRoutes from './routes/propertyRoutes';
import leaseRoutes from './routes/leaseRoutes';
import helmet from 'helmet';

/* CONFIGURATIONS */
const app: Express = express();
app.use(express.json());

// Use helmet for security
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

/* ROUTES */
app.get('/', (req, res) => {
  res.send('This is home route');
});

// Add a health check endpoint
app.get('/health', async (req, res) => {
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
});

app.use('/properties', propertyRoutes);
app.use('/tenants', tenantRoutes);
app.use('/managers', managerRoutes);
app.use('/leases', leaseRoutes);
app.use('/applications', applicationRoutes);

/* ERROR HANDLER */
app.use(errorHandler);

// Initialize Supabase buckets
(async () => {
  try {
    await ensureBucketsExist();
    console.log('Supabase buckets checked/created');
  } catch (err) {
    console.error('Error setting up Supabase buckets:', err);
  }
})();

// Export the Express app for Vercel
export default app;
