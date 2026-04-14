/**
 * SEED COMPLETO: Crea usuarios admin y normal con IPTV real funcional
 * Credenciales IPTV probadas: FabianTorres04 / S86te7zg6v @ http://poraquivamosentrando.vip:8080
 * 
 * Uso: node scratch/seed_users.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─────────────────────────────────────────────
// CONFIGURACIÓN IPTV REAL
// ─────────────────────────────────────────────
const IPTV = {
  username: 'FabianTorres04',
  password: 'S86te7zg6v',
  portal_url: 'http://poraquivamosentrando.vip:8080',
  status: 'active',
  expires_at: '2099-12-31T23:59:59.000Z'
};

// ─────────────────────────────────────────────
// USUARIOS A CREAR
// ─────────────────────────────────────────────
const USERS = [
  {
    username: 'rider_ceo',
    email: 'rider_ceo@rider.com',
    password: 'Rider2026!',
    role: 'admin',
  },
  {
    username: 'usuario1',
    email: 'usuario1@rider.com',
    password: 'Usuario2026!',
    role: 'user',
  }
];

async function upsertUser(user) {
  console.log(`\n── Procesando: ${user.username} (${user.role}) ──`);

  // 1. Verificar si ya existe en Auth
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = listData?.users?.find(u => u.email === user.email);

  let userId;

  if (existing) {
    userId = existing.id;
    console.log(`  ✓ Auth ya existe: ${userId}`);

    // Actualizar contraseña por si cambió
    await supabase.auth.admin.updateUserById(userId, { password: user.password });
    console.log(`  ✓ Contraseña actualizada`);
  } else {
    // Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (authError || !authData?.user) {
      console.error(`  ✗ Error Auth:`, authError?.message);
      return;
    }
    userId = authData.user.id;
    console.log(`  ✓ Auth creado: ${userId}`);
  }

  // 2. Upsert perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      username: user.username,
      role: user.role,
      is_active: true,
      expires_at: '2099-12-31T23:59:59.000Z'
    }, { onConflict: 'id' });

  if (profileError) {
    console.error(`  ✗ Error perfil:`, profileError.message);
    return;
  }
  console.log(`  ✓ Perfil actualizado (role: ${user.role})`);

  // 3. Verificar si ya tiene cuenta IPTV
  const { data: existingIptv } = await supabase
    .from('external_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('username', IPTV.username)
    .single();

  if (existingIptv) {
    // Actualizar la existente
    await supabase
      .from('external_accounts')
      .update({
        password: IPTV.password,
        portal_url: IPTV.portal_url,
        status: IPTV.status,
        expires_at: IPTV.expires_at
      })
      .eq('id', existingIptv.id);
    console.log(`  ✓ Cuenta IPTV actualizada`);
  } else {
    // Insertar nueva
    const { error: iptvError } = await supabase
      .from('external_accounts')
      .insert({
        user_id: userId,
        username: IPTV.username,
        password: IPTV.password,
        portal_url: IPTV.portal_url,
        status: IPTV.status,
        expires_at: IPTV.expires_at
      });

    if (iptvError) {
      console.error(`  ✗ Error IPTV:`, iptvError.message);
      return;
    }
    console.log(`  ✓ Cuenta IPTV asignada`);
  }

  console.log(`  ✅ Listo: ${user.username} | ${user.password}`);
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('   RIDER IPTV - Configuración de Usuarios');
  console.log('═══════════════════════════════════════');

  for (const user of USERS) {
    await upsertUser(user);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('   CREDENCIALES DE ACCESO');
  console.log('═══════════════════════════════════════');
  for (const user of USERS) {
    console.log(`\n  ${user.role === 'admin' ? '👑' : '👤'} ${user.username}`);
    console.log(`     Email:    ${user.email}`);
    console.log(`     Password: ${user.password}`);
    console.log(`     Rol:      ${user.role}`);
  }
  console.log('\n  📺 IPTV Proveedor:');
  console.log(`     URL:      ${IPTV.portal_url}`);
  console.log(`     Usuario:  ${IPTV.username}`);
  console.log(`     Clave:    ${IPTV.password}`);
  console.log('\n  🌐 App: https://ridertv.vercel.app');
  console.log('═══════════════════════════════════════\n');
}

main().catch(console.error);
