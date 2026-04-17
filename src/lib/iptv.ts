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
export async function fetchIptv(url: string, options: RequestInit = {}, retries = 2) {
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
    finalUrl = `/api/proxy?url=${encodeURIComponent(url)}`
  }

  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      if (i > 0) console.log(`🔄 [Retry ${i}/${retries}] IPTV Fetch:`, url.substring(0, 50) + "...")
      
      const response = await fetch(finalUrl, {
        ...options,
        headers: {
          ...options.headers,
          'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        }
      })

      if (!response.ok) {
        throw new Error(`IPTV request failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (isGet) {
        URL_CACHE.set(url, { data, timestamp: Date.now() })
      }

      return data
    } catch (err) {
      lastError = err;
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Exponential delay
      }
    }
  }

  console.error("❌ [IPTV Fetch Failed] Final:", url, lastError)
  throw lastError
}

/**
 * Normalizes IPTV URLs (handles trailing slashes)
 */
export function getBaseUrl(portalUrl: string) {
  if (!portalUrl) return ""
  let url = portalUrl.trim()
  if (url.endsWith('/')) url = url.slice(0, -1)
  // Asegurar protocolo para evitar que Capacitor crea que es una ruta local
  if (!url.startsWith('http')) url = `http://${url}`
  return url
}
