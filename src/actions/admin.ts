'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Inicializamos el cliente de administración con la Service Role Key 
// Esto nos permite evadir RLS y usar el auth.admin
const getSupabaseAdmin = () => {
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export async function getAllProfilesAction() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // 1. Obtener todos los perfiles base
    const { data: profilesData, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (profileErr) throw profileErr

    // 2. Obtener todas las líneas IPTV (evitando el strict JOIN constraint de la DB)
    const { data: externalData, error: extErr } = await supabaseAdmin
      .from('external_accounts')
      .select('user_id, username, password, portal_url')

    if (extErr) throw extErr

    // 3. Fusión de datos en el servidor
    const profiles = profilesData.map(prof => {
       const userExternals = externalData.filter(ext => ext.user_id === prof.id)
       return {
         ...prof,
         external_accounts: userExternals
       }
    })

    return { profiles }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function createUserAction(formData: FormData) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    
    // Novedades Fase 2: Línea IPTV Externa
    const iptvUsername = formData.get('iptvUsername') as string
    const iptvPassword = formData.get('iptvPassword') as string
    const iptvPortalUrl = formData.get('iptvPortalUrl') as string

    if (!username || !password || !iptvUsername || !iptvPassword || !iptvPortalUrl) {
      return { error: 'Todos los campos de Acceso Web y Línea IPTV son requeridos' }
    }

    const fakeEmail = `${username.trim().toLowerCase()}@rider.com`

    // 1. Crear el usuario en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password: password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error('Error creando user:', authError)
      return { error: authError?.message || 'Error al crear usuario en Supabase Auth' }
    }

    // 2. Insertar explícitamente en la tabla profiles
    const newUserId = authData.user.id
    const datePlus30Days = new Date()
    datePlus30Days.setDate(datePlus30Days.getDate() + 30)

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        username: username.trim(),
        role: 'user', // Asumiendo que existe una columna 'role'
        is_active: true,
        expires_at: datePlus30Days.toISOString()
      })

    // 6. Sistema de Rollback (CRÍTICO)
    if (profileError) {
      // Rechazar y Limpiar base de datos para evitar usuarios fantasma
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      
      const errMsg = `Database error creating new user: ${profileError.message || JSON.stringify(profileError)}`
      console.error(errMsg)
      return { error: errMsg }
    }

    // Paso C: Configurar Línea IPTV Externa
    const { error: iptvError } = await supabaseAdmin
      .from('external_accounts')
      .insert({
        user_id: newUserId,
        username: iptvUsername.trim(),
        password: iptvPassword,
        portal_url: iptvPortalUrl.trim(),
        status: 'active',
        expires_at: datePlus30Days.toISOString()
      })

    if (iptvError) {
       // Rollback Completo: Perfil y Auth
       await supabaseAdmin.from('profiles').delete().eq('id', newUserId)
       await supabaseAdmin.auth.admin.deleteUser(newUserId)
       
       const errMsg = `Database error creating IPTV line: ${iptvError.message || JSON.stringify(iptvError)}`
       console.error(errMsg)
       return { error: errMsg }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error interno' }
  }
}

export async function toggleUserAccessAction(userId: string, currentStatus: boolean) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', userId)

    if (error) throw error;

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error al modificar acceso' }
  }
}

export async function updateUserExpiryAction(userId: string, newExpiresAtIso: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ expires_at: newExpiresAtIso, is_active: true })
      .eq('id', userId)

    if (error) throw error;

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error al modificar la fecha' }
  }
}

export async function updateIPTVCredentialsAction(userId: string, usr: string, pass: string, portal: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('external_accounts')
      .update({ username: usr, password: pass, portal_url: portal })
      .eq('user_id', userId)
    
    if (error) throw error;
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error al actualizar línea IPTV' }
  }
}

export async function resetWebPasswordAction(userId: string, newPassword: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
    
    if (error) throw error;
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error al cambiar clave web' }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Auth Delete. Supabase triggers usually delete the profile as well depending on setup,
    // Pero para ser seguros podemos eliminar primero de profiles.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)
      
    if (profileError) {
      console.warn('Could not delete profile. Maybe it cascades, continuing...', profileError)
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error;

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error al eliminar usuario' }
  }
}
