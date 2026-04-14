import { NextRequest, NextResponse } from 'next/server'

/**
 * API Proxy Universal para Xtream Codes
 * Todas las llamadas al proveedor IPTV pasan por aquí para evitar Mixed Content (HTTP→HTTPS)
 * Soporta cualquier `action` de la player_api de Xtream Codes.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const password = searchParams.get('password')
  const portal_url = searchParams.get('portal_url')
  const action = searchParams.get('action')

  if (!username || !password || !portal_url || !action) {
    // Si faltan parámetros (por ejemplo, usuario admin sin línea IPTV), devolvemos éxito vacío
    // para no ensuciar la consola con errores 400.
    return NextResponse.json([], { status: 200 })
  }

  try {
    const cleanPortalUrl = portal_url.endsWith('/') ? portal_url.slice(0, -1) : portal_url

    // Construir la URL con todos los parámetros extra (category_id, vod_id, series_id, etc.)
    const extraParams = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (!['username', 'password', 'portal_url', 'action'].includes(key)) {
        extraParams.set(key, value)
      }
    })

    const extraStr = extraParams.toString() ? `&${extraParams.toString()}` : ''
    const proxyUrl = `${cleanPortalUrl}/player_api.php?username=${username}&password=${password}&action=${action}${extraStr}`

    const host = new URL(cleanPortalUrl).origin

    const response = await fetch(proxyUrl, { 
      headers: { 
        'User-Agent': 'IPTVSmartersPlayer/3.0.0 (iPad; iOS 15.1; Scale/2.00)',
        'Accept': '*/*',
        'Referer': `${host}/`,
        'Origin': host,
        'Connection': 'keep-alive',
      },
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No body')
      console.error(`Upstream error ${response.status} for ${proxyUrl}:`, errorText)
      return NextResponse.json({ error: `Upstream error: ${response.status}`, details: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('IPTV Proxy Error:', error.message)
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 500 })
  }
}
