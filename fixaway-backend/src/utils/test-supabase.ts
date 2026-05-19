import dotenv from 'dotenv';
import path from 'path';

// Load .env from the backend root folder explicitly
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';

async function main() {
  console.log('=== TESTING SUPABASE & DATABASE CONNECTIONS ===');
  
  // 1. Check Env variables
  console.log('\nChecking environment variables...');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? `Loaded (value: ${process.env.SUPABASE_URL})` : 'MISSING');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? `Loaded (length: ${process.env.SUPABASE_SERVICE_ROLE_KEY.length})` : 'MISSING');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'MISSING');
  console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Loaded' : 'MISSING');

  // 2. Test Prisma DB Connection
  console.log('\n1. Testing Prisma DB connection...');
  try {
    const userCount = await prisma.user.count();
    console.log('  Success: Connected to Prisma database.');
    console.log(`  User Count: ${userCount}`);
  } catch (error: any) {
    console.error('  Error: Failed to connect to DB via Prisma:', error.message || error);
  }

  // 3. Test Supabase Client DB Query (Postgrest API)
  console.log('\n2. Testing Supabase JS Client DB query (via Postgrest API)...');
  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    console.log('  Success: Connected to Supabase DB via JS client.');
    console.log(`  User Count (Postgrest): ${count}`);
  } catch (error: any) {
    console.error('  Error: Failed to query via Supabase JS client:', error.message || error);
  }

  // 4. Test Supabase Storage Bucket Access
  console.log('\n3. Testing Supabase Storage Bucket access...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      throw error;
    }
    console.log('  Success: Retrieved storage buckets list.');
    console.log('  Available Buckets:', buckets.map(b => `${b.name} (${b.public ? 'public' : 'private'})`));
    
    const mediaBucketExists = buckets.find(b => b.name === 'fixaway-media');
    if (mediaBucketExists) {
      console.log('  Success: "fixaway-media" bucket exists.');
    } else {
      console.warn('  Warning: "fixaway-media" bucket does not exist! Please create a public bucket named "fixaway-media" in your Supabase dashboard.');
    }
  } catch (error: any) {
    console.error('  Error: Failed to list/access Supabase Storage buckets:', error.message || error);
  }

  console.log('\n=============================================');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Unhandled script error:', e);
  await prisma.$disconnect();
});
