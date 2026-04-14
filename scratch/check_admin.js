const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function check() {
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const existingUser = usersData?.users.find(u => u.email === "admin@rider.com");
  
  if (existingUser) {
      console.log("Found user ID:", existingUser.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', existingUser.id)
        .single();
      console.log("Profile data:", data);
      console.log("Error:", error);
  }
}
check();
