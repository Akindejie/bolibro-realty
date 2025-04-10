-- SQL setup file for Supabase storage permissions
-- Copy and paste this into the Supabase SQL Editor

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Configure storage permissions
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public access to view property images
CREATE POLICY "Property images are viewable by everyone" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-images');

-- Allow authenticated users to upload property images
CREATE POLICY "Allow authenticated users to upload property images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-images' AND
  auth.role() IN ('authenticated', 'service_role')
);

-- Allow users to update their own uploads
CREATE POLICY "Allow users to update their own property images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = owner
);

-- Allow users to delete their own uploads
CREATE POLICY "Allow users to delete their own property images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = owner
);

-- Create a function to get the Postgres timestamp of now
CREATE OR REPLACE FUNCTION supabase_storage.get_now()
RETURNS timestamptz
LANGUAGE sql STABLE
AS $$
  SELECT now();
$$;

-- Log a message to verify the script ran successfully
DO $$
BEGIN
  RAISE NOTICE 'Supabase storage permission setup completed successfully.';
END $$; 