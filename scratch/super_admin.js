const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const adminUsername = 'rider_ceo';
  const adminPassword = 'RiderMaster2026!';
  
  // 1. Detele old admin 
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const oldAdmin = usersData?.users.find(u => u.email === "admin@rider.com");
  if (oldAdmin) {
    console.log("Eliminando viejo admin:", oldAdmin.id);
    await supabase.from('profiles').delete().eq('id', oldAdmin.id);
    await supabase.auth.admin.deleteUser(oldAdmin.id);
  }

  // 2. Create new PRO admin
  const email = `${adminUsername}@rider.com`;
  console.log("Creando admin:", adminUsername);
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: adminPassword,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error("Error creating auth:", authError);
    return;
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    username: adminUsername,
    role: 'admin',
    is_active: true,
    expires_at: '2099-12-31T23:59:59.000Z'
  });

  if (profileError) {
     console.error("Error inserting profile:", profileError);
  } else {
     console.log(`\n=== ADMIN PRO CREADO ===\nUsuario: ${adminUsername}\nClave: ${adminPassword}\n`);
  }
}
run();
