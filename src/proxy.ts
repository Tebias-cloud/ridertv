import { NextResponse, type NextRequest } from 'next/server'

// Proxy simplificado - sin llamadas a Supabase en Edge Runtime
// La autenticación se maneja en cada Server Component page
export default async function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
