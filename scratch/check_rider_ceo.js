const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = envConfig.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function check() {
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const existingUser = usersData?.users.find(u => u.email === "rider_ceo@rider.com");
  
  if (existingUser) {
      console.log("Found user ID:", existingUser.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', existingUser.id)
        .single();
      
      if (error) {
          console.log("Profile NOT found for user ID:", existingUser.id);
          console.log("Error:", error.message);
      } else {
          console.log("Profile data exists:", profile);
      }
  } else {
      console.log("User rider_ceo@rider.com not found in auth.users");
      console.log("Matching emails:", usersData?.users.map(u => u.email).filter(e => e.includes('ceo')));
  }
}
check();
