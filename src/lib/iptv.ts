import { Capacitor } from '@capacitor/core'

/**
 * Smart fetch for IPTV data
 * - On Native (Android TV/Mobile): Fetches directly from the provider (no CORS/Mixed Content issues)
 * - On Web (Vercel): Fetches through the local /api/proxy to bypass browser restrictions
 */
const URL_CACHE = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 10 // 10 minutos de cache para máxima fluidez

/**
 * Smart fetch for IPTV data
 * - On Native (Android TV/Mobile): Fetches directly from the provider (no CORS/Mixed Content issues)
 * - On Web (Vercel): Fetches through the local /api/proxy to bypass browser restrictions
 */
export async function fetchIptv(url: string, options: RequestInit = {}) {
  // Check Cache (Solo para GET)
  const isGet = !options.method || options.method === 'GET'
  if (isGet && URL_CACHE.has(url)) {
    const cached = URL_CACHE.get(url)!
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("⚡ [Cache] IPTV Data:", url.substring(0, 50) + "...")
      return cached.data
    }
  }

  const isNative = Capacitor.isNativePlatform()
  
  let finalUrl = url
  if (!isNative) {
    // On web, use the local proxy
    finalUrl = `/api/proxy?url=${encodeURIComponent(url)}`
  }

  const response = await fetch(finalUrl, {
    ...options,
    headers: {
      ...options.headers,
      'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18', // Identidad unificada para evitar bloqueos
    }
  })

  if (!response.ok) {
    throw new Error(`IPTV request failed: ${response.status}`)
  }

  const data = await response.json()
  
  // Guardar en cache si es exitoso
  if (isGet) {
    URL_CACHE.set(url, { data, timestamp: Date.now() })
  }

  return data
}

/**
 * Normalizes IPTV URLs (handles trailing slashes)
 */
export function getBaseUrl(portalUrl: string) {
  return portalUrl.endsWith('/') ? portalUrl.slice(0, -1) : portalUrl
}
