# Storage Migration: AWS S3 to Supabase Storage

## Overview

This document details the migration of all file storage from AWS S3 to Supabase Storage in the Bolibro Rental application. The migration was completed in June 2025.

## Changes Made

1. Removed all AWS S3 dependencies:

   - Removed `@aws-sdk/client-s3` and `@aws-sdk/lib-storage` packages
   - Removed AWS credentials from environment variables
   - Removed S3Client initialization and related code

2. Updated the file upload utility:

   - All file uploads now use Supabase Storage exclusively
   - File uploads use the `PROPERTY_IMAGES` bucket defined in Supabase

3. Migrated existing images:
   - Created a migration script (`server/src/scripts/migrateImagesToSupabase.ts`)
   - All existing property images were transferred from S3 to Supabase
   - Updated property records to use new Supabase URLs

## Running the Migration Script

If you need to run the migration script again:

```bash
npm run migrate-images
```

## Environment Variables

The following environment variables were updated:

1. Removed:

   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `S3_BUCKET_NAME`

2. Required:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

## Security Notes

1. All AWS credentials have been rotated and removed from the codebase
2. Supabase credentials should be treated as sensitive
3. The `.env` file is included in `.gitignore` to prevent accidentally committing credentials

## Advantages of Supabase Storage

1. Integration with Supabase database and authentication
2. Simplified development workflow
3. Built-in public URL generation
4. RLS (Row Level Security) support for fine-grained access control
5. Integrated file management through the Supabase dashboard

## Troubleshooting

If you encounter issues with image uploads or missing images:

1. Check Supabase Storage buckets in the dashboard
2. Verify that the `PROPERTY_IMAGES` bucket exists
3. Check environment variables for correct Supabase credentials
4. Review Supabase permissions for the storage bucket

For additional help, contact the development team.
