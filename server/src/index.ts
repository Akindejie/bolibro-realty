// Load environment variables at the very top before any imports
require('dotenv').config();

import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authMiddleware } from './middleware/authMiddleware';
import applicationRoutes from './routes/applicationRoutes';
import { errorHandler } from './middleware/errorMiddleware';
import { ensureBucketsExist } from './config/supabase';

/* ROUTE IMPORT */
import tenantRoutes from './routes/tenantRoutes';
import managerRoutes from './routes/managerRoutes';
import propertyRoutes from './routes/propertyRoutes';
import leaseRoutes from './routes/leaseRoutes';

// Import the database ping scheduler with skip-db flag
const { startPingSchedule } = require('./scripts/ping-supabase');

/* CONFIGURATIONS */
console.log('Environment variables loaded:');
console.log('- PORT:', process.env.PORT);
console.log('- DATABASE_URL defined:', !!process.env.DATABASE_URL);
console.log('- SUPABASE_URL defined:', !!process.env.SUPABASE_URL);
console.log(
  '- SUPABASE_SERVICE_KEY defined:',
  !!process.env.SUPABASE_SERVICE_KEY
);

const app: Express = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

/* ROUTES */
app.get('/', (req, res) => {
  res.send('This is home route');
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    auth: !!process.env.JWT_SECRET,
    database: !!process.env.DATABASE_URL,
    storage: !!process.env.SUPABASE_URL,
  });
});

app.use('/properties', propertyRoutes);
app.use('/tenants', authMiddleware(['tenant']), tenantRoutes);
app.use('/managers', authMiddleware(['manager']), managerRoutes);
app.use('/leases', leaseRoutes);
app.use('/applications', applicationRoutes);

/* ERROR HANDLER */
app.use(errorHandler);

/* SERVER */
const port = Number(process.env.PORT) || 3002;

// Ensure Supabase buckets exist
ensureBucketsExist()
  .then(() => {
    console.log('Supabase buckets checked/created');
  })
  .catch((err) => {
    console.error('Error setting up Supabase buckets:', err);
  });

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);

  // Start pinging Supabase to keep the connection alive
  // Skip database ping since it's failing, but keep storage active
  startPingSchedule(10, true); // 10 minutes interval, skip database ping
});
