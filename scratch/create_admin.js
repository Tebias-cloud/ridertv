const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

// Create a local env map from .env.local because dotenv might look in different cwd.
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
  const username = "admin";
  const password = "adminpassword123";
  const fakeEmail = `${username}@rider.com`;
  
  console.log("Creating user in Auth...");
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: fakeEmail,
    password: password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    if (authError && authError.message.includes('already registered')) {
        console.log("User already exists, let's try to update role.");
        // Try to fetch user by email
        const { data: usersData, error: ListError } = await supabase.auth.admin.listUsers();
        const existingUser = usersData?.users.find(u => u.email === fakeEmail);
        if (existingUser) {
            console.log("Found existing user, setting profile to admin...");
            await supabase.from('profiles').update({ role: 'admin', is_active: true }).eq('id', existingUser.id);
            console.log("User 'admin' / 'adminpassword123' updated successfully.");
        } else {
             console.log("Could not find the user to update.", ListError);
        }
        return;
    }
    console.error('Error creating user:', authError);
    return;
  }

  const newUserId = authData.user.id;
  const datePlus30Years = new Date();
  datePlus30Years.setFullYear(datePlus30Years.getFullYear() + 30);

  console.log("Creating profile for User ID:", newUserId);
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: newUserId,
      username: username,
      role: 'admin',
      is_active: true,
      expires_at: datePlus30Years.toISOString()
    });

  if (profileError) {
    console.error("Profile error:", profileError);
    return;
  }

  console.log("Creating external account...");
  const { error: iptvError } = await supabase
    .from('external_accounts')
    .insert({
      user_id: newUserId,
      username: "admin_iptv_test",
      password: "admin_iptv_password!",
      portal_url: "http://iptv-provider.com:8080",
      status: 'active',
      expires_at: datePlus30Years.toISOString()
    });

  if (iptvError) {
    console.error("IPTV error:", iptvError);
    return;
  }

  console.log("Success! Admin user created.");
  console.log("Login with username: admin | password: adminpassword123");
}

createAdmin();
