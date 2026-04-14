'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  
  if (!username || !password) {
    return { error: 'Usuario y Contraseña son requeridos' }
  }

  const fakeEmail = `${username.trim().toLowerCase()}@rider.com`
  
  console.log("Intentando login con:", fakeEmail)

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: fakeEmail,
    password,
  })

  if (error) {
    console.error("Login Error:", error.message)
    return { error: 'Credenciales inválidas. Comprueba tu usuario y contraseña.' }
  }

  // Si login es exitoso
  return redirect('/catalog')
}
