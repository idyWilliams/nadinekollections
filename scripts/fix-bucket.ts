import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBucket() {
  console.log('🚀 Starting bucket fix...');

  const BUCKET_NAME = 'NadineKollections';

  // 1. Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }

  const bucket = buckets.find(b => b.name === BUCKET_NAME);

  if (!bucket) {
    console.log(`Bucket ${BUCKET_NAME} not found. Creating it...`);
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true
    });
    if (error) {
      console.error('Error creating bucket:', error);
    } else {
      console.log('✅ Bucket created and set to public.');
    }
  } else {
    console.log(`Bucket ${BUCKET_NAME} found. Public: ${bucket.public}`);
    if (!bucket.public) {
      console.log('Updating bucket to be public...');
      const { data, error } = await supabase.storage.updateBucket(BUCKET_NAME, {
        public: true
      });
      if (error) {
        console.error('Error updating bucket:', error);
      } else {
        console.log('✅ Bucket updated to public.');
      }
    } else {
      console.log('✅ Bucket is already public.');
    }
  }
}

fixBucket().catch(console.error);
