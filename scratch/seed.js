const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supaAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function seed() {
  const username = 'FabianTorres04'
  const password = 'FabianTorres04' // Assume same
  const email = `${username.toLowerCase()}@rider.tv`

  console.log('Creando auth user:', email)
  const { data: auth, error: err } = await supaAdmin.auth.admin.createUser({
    email, password, email_confirm: true 
  })

  // Ignore 'already exists' errors 
  if (err && err.message.includes('already registered')) {
     console.log('El usuario ya existe en auth. Re-viculando cuenta IPTV...')
     const { data: users } = await supaAdmin.auth.admin.listUsers()
     const target = users.users.find(u => u.email === email)
     if (target) {
        await insertIptv(target.id)
     }
     return
  } else if (err) {
    console.error('Error Auth:', err)
    return
  }
  
  await insertIptv(auth.user.id)
}

async function insertIptv(userId) {
  console.log('Insertando external_account...')
  const { error } = await supaAdmin.from('external_accounts').insert({
    user_id: userId,
    service_name: 'Fabian Service',
    username: 'FabianTorres04',
    password: 'FabianTorres04',
    portal_url: 'http://poraquivamosentrando.vip:8080',
    status: 'active',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  })

  if(error && error.code === '23505') {
       console.log('La cuenta externa ya existe')
  } else if (error) {
       console.error('Error Insertando DB:', error)
  } else {
       console.log('Seed Completado. Usa username: FabianTorres04 y password: FabianTorres04 en Rider IPTV')
  }
}

seed()
