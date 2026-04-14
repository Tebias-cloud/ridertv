const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function simulate() {
  console.log("Logging in as admin@rider.com...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@rider.com',
    password: 'adminpassword123'
  });
  
  if (authError) {
      console.error("Login failed:", authError);
      return;
  }
  
  console.log("Logged in. User ID:", authData.user.id);
  
  // Try to select profile
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();
    
  console.log("Profile Select Result:", data);
  console.log("Profile Select Error:", error);
}

simulate();
