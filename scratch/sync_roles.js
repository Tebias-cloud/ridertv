/**
 * Script for sync roles from profiles to Supabase Auth metadata
 * Run: node scratch/sync_roles.js
 */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

async function sync() {
  const env = dotenv.parse(fs.readFileSync('.env.local'));
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

  console.log('--- Resyncing roles to Auth Metadata ---');

  // 1. Get all profiles with roles
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, role, username');

  if (pError) {
    console.error('Error fetching profiles:', pError);
    return;
  }

  console.log(`Found ${profiles.length} profiles.`);

  for (const profile of profiles) {
    console.log(`Processing ${profile.username} (${profile.role})...`);
    
    // 2. Update Auth metadata
    const { error: aError } = await supabase.auth.admin.updateUserById(profile.id, {
      user_metadata: { role: profile.role }
    });

    if (aError) {
      console.error(`  ✗ Error updating auth for ${profile.username}:`, aError.message);
    } else {
      console.log(`  ✓ Auth metadata synced.`);
    }
  }

  console.log('--- Done ---');
}

sync().catch(console.error);
