const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supaAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function updatePw() {
  const { error } = await supaAdmin.from('external_accounts')
    .update({ password: 'S86te7zg6v' })
    .eq('username', 'FabianTorres04')

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Password actualizado correctamente en Base de Datos de Supabase!')
  }
}

updatePw()
