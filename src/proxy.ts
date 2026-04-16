import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // EXPORT_MODE Protection: Bypass middleware for Capacitor/Static builds
  if (process.env.EXPORT_MODE === 'true') {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Protected paths
  const isAppPath = 
    pathname.startsWith('/catalog') ||
    pathname.startsWith('/live') ||
    pathname.startsWith('/series') ||
    pathname.startsWith('/player') ||
    pathname.startsWith('/admin')

  // Not logged in -> Redirect to login
  if (!user && isAppPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Already logged in at root -> Redirect to catalog (users) or admin (admins)
  if (user && pathname === '/') {
    const role = user.user_metadata?.role
    return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/catalog', request.url))
  }

  // Admin route level protection
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    const role = user.user_metadata?.role
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/catalog', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
