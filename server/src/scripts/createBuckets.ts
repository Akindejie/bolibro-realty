import 'dotenv/config';
import { supabase, SUPABASE_BUCKETS } from '../config/supabase';

/**
 * Script to create necessary Supabase storage buckets
 */
async function createBuckets() {
  try {
    console.log('Creating Supabase buckets...');
    
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      throw new Error(`Error listing buckets: ${listError.message}`);
    }
    
    console.log('Existing buckets:', buckets.map(b => b.name).join(', '));
    
    // Create or update property images bucket
    const propertyImagesName = 'property-images';
    const propertyImagesBucket = buckets.find(b => b.name === propertyImagesName);
    
    if (!propertyImagesBucket) {
      console.log(`Creating "${propertyImagesName}" bucket...`);
      const { error } = await supabase.storage.createBucket(propertyImagesName, {
        public: true, // Make sure it's public for image URLs to work
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        console.error(`Error creating bucket "${propertyImagesName}":`, error);
      } else {
        console.log(`Successfully created "${propertyImagesName}" bucket`);
        
        // Update public access
        const { error: updateError } = await supabase.storage.from(propertyImagesName).updateBucket({
          public: true
        });
        
        if (updateError) {
          console.error(`Error making bucket public:`, updateError);
        } else {
          console.log(`Made "${propertyImagesName}" bucket public`);
        }
      }
    } else {
      console.log(`Bucket "${propertyImagesName}" already exists`);
      
      // Make sure it's public
      const { error: updateError } = await supabase.storage.from(propertyImagesName).updateBucket({
        public: true
      });
      
      if (updateError) {
        console.error(`Error updating bucket:`, updateError);
      } else {
        console.log(`Updated "${propertyImagesName}" bucket settings`);
      }
    }
    
    // Create or update documents bucket
    const documentsName = 'lease-agreements-and-documents';
    const documentsBucket = buckets.find(b => b.name === documentsName);
    
    if (!documentsBucket) {
      console.log(`Creating "${documentsName}" bucket...`);
      const { error } = await supabase.storage.createBucket(documentsName, {
        public: false,
        allowedMimeTypes: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 20971520, // 20MB
      });
      
      if (error) {
        console.error(`Error creating bucket "${documentsName}":`, error);
      } else {
        console.log(`Successfully created "${documentsName}" bucket`);
      }
    } else {
      console.log(`Bucket "${documentsName}" already exists`);
    }
    
    console.log('All buckets created/verified successfully!');
  } catch (error) {
    console.error('Error creating buckets:', error);
    process.exit(1);
  }
}

// Execute the function
createBuckets().catch(console.error);

// For direct execution: node -r ts-node/register src/scripts/createBuckets.ts 