// Test script for lease document upload
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create a very simple mock PDF content (this is just minimal valid PDF structure)
const mockPdfContent = `%PDF-1.3
1 0 obj
<< /Type /Catalog
   /Pages 2 0 R
>>
endobj
2 0 obj
<< /Type /Pages
   /Kids [3 0 R]
   /Count 1
>>
endobj
3 0 obj
<< /Type /Page
   /Parent 2 0 R
   /Resources << >>
   /MediaBox [0 0 612 792]
   /Contents 4 0 R
>>
endobj
4 0 obj
<< /Length 23 >>
stream
BT /F1 12 Tf 100 700 Td (Test Lease Document) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000063 00000 n
0000000126 00000 n
0000000230 00000 n
trailer
<< /Size 5
   /Root 1 0 R
>>
startxref
304
%%EOF`;

// Create a test file
const testFileName = `test-lease-doc-${Date.now()}.pdf`;
const testFilePath = path.join(__dirname, testFileName);
fs.writeFileSync(testFilePath, mockPdfContent);

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Bucket names to try
const bucketNamesToTry = [
  'lease-agreements-and-documents',
  'Lease Agreements and Documents',
  'lease-agreements',
  'documents',
];

async function testUpload() {
  try {
    console.log('Testing lease document upload to Supabase...');

    // List buckets to confirm they exist
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();

    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      return;
    }

    console.log(
      'Available buckets:',
      buckets.map((b) => `"${b.name}"`).join(', ')
    );

    // Read test file
    const fileBuffer = fs.readFileSync(testFilePath);

    // Try each bucket
    for (const bucketName of bucketNamesToTry) {
      try {
        console.log(`\nAttempting upload to bucket: "${bucketName}"`);

        // Upload file
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(`test-upload/${testFileName}`, fileBuffer, {
            contentType: 'application/pdf',
            upsert: false,
          });

        if (error) {
          console.log(`Upload to "${bucketName}" failed:`, error.message);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`test-upload/${testFileName}`);

        console.log(`✅ Successfully uploaded to bucket "${bucketName}"`);
        console.log(`Public URL: ${urlData.publicUrl}`);
      } catch (err) {
        console.error(`Error trying bucket "${bucketName}":`, err);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up test file
    try {
      fs.unlinkSync(testFilePath);
      console.log(`\nCleaned up test file: ${testFileName}`);
    } catch (err) {
      console.error('Error cleaning up test file:', err);
    }
  }
}

testUpload();
