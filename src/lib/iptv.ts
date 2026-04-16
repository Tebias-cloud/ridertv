import { Capacitor } from '@capacitor/core'

/**
 * Smart fetch for IPTV data
 * - On Native (Android TV/Mobile): Fetches directly from the provider (no CORS/Mixed Content issues)
 * - On Web (Vercel): Fetches through the local /api/proxy to bypass browser restrictions
 */
export async function fetchIptv(url: string, options: RequestInit = {}) {
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
    }
  })

  if (!response.ok) {
    throw new Error(`IPTV request failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Normalizes IPTV URLs (handles trailing slashes)
 */
export function getBaseUrl(portalUrl: string) {
  return portalUrl.endsWith('/') ? portalUrl.slice(0, -1) : portalUrl
}
