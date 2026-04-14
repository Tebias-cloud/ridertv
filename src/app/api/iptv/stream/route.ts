import { NextRequest, NextResponse } from 'next/server'

/**
 * HLS Streaming Proxy
 * 
 * Convierte URLs HTTP del proveedor IPTV en rutas HTTPS seguras.
 * Soporta:
 *   - Playlists M3U8 (master y media) → reescribe URLs internas
 *   - Segmentos TS → los proxea directamente como stream
 *
 * Uso: /api/iptv/stream?url=http%3A%2F%2Fproveedor.vip%3A8080%2Flive%2F...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  // Seguridad: solo permitir URLs que vengan de proveedores de iptv (evitar SSRF arbitrario)
  // Permitimos cualquier host para compatibilidad, pero solo HTTP/HTTPS
  let parsedUrl: URL
  try {
    parsedUrl = new URL(targetUrl)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return new NextResponse('Invalid protocol', { status: 400 })
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'IPTVSmartersPlayer/3.0.0 (iPad; iOS 15.1; Scale/2.00)',
        'Accept': '*/*',
        'Connection': 'keep-alive',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!upstreamRes.ok) {
      return new NextResponse(`Upstream error: ${upstreamRes.status}`, { status: upstreamRes.status })
    }

    const contentType = upstreamRes.headers.get('content-type') || ''
    const isM3u8 = contentType.includes('mpegurl') || 
                   contentType.includes('x-mpegurl') || 
                   targetUrl.includes('.m3u8') ||
                   targetUrl.includes('type=m3u_plus')

    // Headers CORS permisivos para el player
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }

    if (isM3u8) {
      // Reescribir el playlist para que todos los segmentos/sub-playlists
      // también vayan por este mismo proxy
      const text = await upstreamRes.text()
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`
      const basePath = parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/') + 1)

      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim()
        // Ignorar comentarios y líneas vacías
        if (!trimmed || trimmed.startsWith('#')) return line

        // Convertir la línea en una URL absoluta del proveedor
        let absoluteUrl: string
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          absoluteUrl = trimmed
        } else if (trimmed.startsWith('/')) {
          absoluteUrl = `${baseUrl}${trimmed}`
        } else {
          absoluteUrl = `${baseUrl}${basePath}${trimmed}`
        }

        // Proxear a través de este mismo endpoint
        return `/api/iptv/stream?url=${encodeURIComponent(absoluteUrl)}`
      }).join('\n')

      return new NextResponse(rewritten, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache, no-store',
        },
      })
    } else {
      // Para segments .ts y otros binarios: stream directo
      const body = upstreamRes.body
      if (!body) {
        return new NextResponse('No body from upstream', { status: 502 })
      }

      return new NextResponse(body, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType || 'video/mp2t',
          'Cache-Control': 'no-cache',
        },
      })
    }
  } catch (err: any) {
    console.error('[HLS Proxy] Error:', err.message)
    return new NextResponse(`Stream proxy error: ${err.message}`, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  })
}
