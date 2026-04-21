import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const username = (formData.get('username') as string)?.trim()?.toLowerCase()
    const password = (formData.get('password') as string)?.trim()

    if (!username || !password) {
      return NextResponse.redirect(new URL('/?error=empty', request.url), { status: 303 })
    }

    const supabase = await createClient()
    const fakeEmail = `${username}@rider.com`

    const { data, error } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: password,
    })

    if (error) {
      console.error('Login Error:', error.message)
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, request.url), { status: 303 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    const role = user?.user_metadata?.role

    if (role !== 'admin') {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url), { status: 303 })
    }

    // Success redirect
    return NextResponse.redirect(new URL('/admin', request.url), { status: 303 })

  } catch (err: any) {
    console.error('Fatal API Error:', err.message)
    return NextResponse.redirect(new URL(`/?error=fatal&msg=${encodeURIComponent(err.message)}`, request.url), { status: 303 })
  }
}
