const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixAdmin() {
  const username = "admin";
  const fakeEmail = `${username}@rider.com`;
  
  console.log("Fetching user...");
  const { data: usersData, error: ListError } = await supabase.auth.admin.listUsers();
  const existingUser = usersData?.users.find(u => u.email === fakeEmail);
  
  if (existingUser) {
      console.log(`Found existing user (ID: ${existingUser.id}), making them an admin...`);
      // Update profile
      const { data, error } = await supabase.from('profiles').upsert({
          id: existingUser.id,
          username: username,
          role: 'admin',
          is_active: true,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 30).toISOString() // 30 Years
      });
      
      if (error) {
          console.error("Failed to update profile:", error);
      } else {
          console.log("User role updated to 'admin' in profiles table.");
      }
      
      // Ensure they have IPTV external account so they are fully populated although not strictly needed for admin access but helps avoid UI crashes if any UI expects it
      const { error: iptvError } = await supabase.from('external_accounts').upsert({
          user_id: existingUser.id,
          username: "admin_iptv",
          password: "admin_iptv_password!",
          portal_url: "http://iptv-provider.com:8080",
          status: 'active',
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 30).toISOString()
      }, { onConflict: 'user_id' }); // Supposing user_id is unique or we just let it insert
      
  } else {
       console.log("Could not find the user admin@rider.com.", ListError);
  }
}

fixAdmin();
