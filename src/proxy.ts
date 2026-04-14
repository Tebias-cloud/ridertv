import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * PROXY (Formerly: Middleware)
 * 
 * Responsabilidad única: Controlar el acceso mediante sesión de Supabase.
 * 
 * - Si no hay sesión y se intenta acceder a una ruta protegida → redirige al Login.
 * - Si ya hay sesión y se intenta acceder al Login → redirige al Catálogo.
 * 
 * Las verificaciones de ROL (admin) y EXPIRACIÓN se hacen dentro de cada
 * página Server Component, ya que esas operaciones requieren acceso a la BD
 * y no son compatibles con el Edge Runtime de Vercel.
 */
export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtener usuario de la sesión actual (compatible con Edge Runtime)
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas que requieren sesión activa
  const isProtectedRoute =
    pathname.startsWith('/catalog') ||
    pathname.startsWith('/player') ||
    pathname.startsWith('/live') ||
    pathname.startsWith('/series') ||
    pathname.startsWith('/admin')

  // Sin sesión → manda al login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Con sesión en el login → manda al catálogo
  if (user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/catalog'
    return NextResponse.redirect(url)
  }

  // En cualquier otro caso, dejar pasar la petición
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Aplicar el proxy a todas las rutas excepto:
     * - Archivos estáticos de Next.js (_next/static, _next/image)
     * - favicon e imágenes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
