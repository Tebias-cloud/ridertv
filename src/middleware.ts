import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/catalog') || request.nextUrl.pathname.startsWith('/player') || request.nextUrl.pathname.startsWith('/live')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  
  if (!user && (isProtectedRoute || isAdminRoute)) {
    // Redirige al login principal
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname === '/') {
    // Redirige al catálogo si ya está logueado
    const url = request.nextUrl.clone()
    url.pathname = '/catalog'
    return NextResponse.redirect(url)
  }

  if (user && (isProtectedRoute || isAdminRoute)) {
    const { createClient } = require('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_active, expires_at, role')
      .eq('id', user.id)
      .single()

    if (profile) {
      // 1. Admin Role Guard
      if (isAdminRoute && profile.role !== 'admin') {
         const url = request.nextUrl.clone()
         url.pathname = '/catalog'
         return NextResponse.redirect(url)
      }

      // 2. Expiration and Active Status Guard for app usage (Catalog, Player, Admin)
      const isActive = profile.is_active;
      const expiresAt = new Date(profile.expires_at)
      const now = new Date()

      if (!isActive || now > expiresAt) {
        // Expulsado del ecosistema (Interruptor Maestro)
        await supabase.auth.signOut();
        const url = request.nextUrl.clone()
        url.pathname = '/'
        url.searchParams.set('error', 'suspended')
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
