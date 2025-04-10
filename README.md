# Bolibro Realty Property Management System

## Migration to Supabase

This project is being migrated from AWS S3 to Supabase for database and storage needs. Follow the instructions below to complete the migration.

### Quick Start

```bash
# IMPORTANT: Always run commands from the correct directory!

# Install server dependencies
cd server
npm install
npm install @supabase/supabase-js node-fetch

# Install client dependencies
cd ../client
npm install
npm install @supabase/supabase-js
```

### Migration Steps

1. **Set up Supabase account and project**

   - Sign up at https://supabase.com
   - Create a new project
   - Note your project URL, anon key, and service key

2. **Configure environment variables**

   - Update `server/.env` with your Supabase credentials:
     ```
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_KEY=your-service-key
     ```
   - Update `client/.env` with your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Run SQL setup in Supabase**

   - Copy contents from `server/src/db/supabase-setup.sql`
   - Paste into SQL Editor in Supabase and run

4. **Run the migration script**

   ```bash
   # Make sure you're in the server directory
   cd server

   # Run the migration script
   node scripts/migrate-to-supabase.js
   ```

For complete details and troubleshooting, see the [Migration Guide](./migration-scripts/README.md).

## Development

```bash
# Start the server
cd server
npm run dev

# In a separate terminal, start the client
cd client
npm run dev
```

## Project Structure

- `client/` - Next.js frontend
- `server/` - Express backend with Prisma ORM
- `server/scripts/` - Server scripts including migration utilities

## Features

- Property listing and management
- Tenant application processing
- Lease management
- Image upload and management
- User authentication and authorization
