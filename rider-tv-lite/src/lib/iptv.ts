import { Capacitor } from '@capacitor/core'

/**
 * Global Memory Store & Locks
 * Esto vive fuera del ciclo de vida de React, sobreviviendo a re-montajes.
 */
const URL_CACHE = new Map<string, { data: any, timestamp: number }>()
const PENDING_REQUESTS = new Map<string, Promise<any>>()
const LOADING_CATEGORIES = new Set<string>() 
const GLOBAL_STORE = new Map<string, any[]>()
const CALL_LOCK = new Map<string, number>() // 🔥 Bloqueo anti-metralleta por tiempo

const CACHE_TTL = 1000 * 60 * 10 // 10 minutos

/**
 * Sync status checks for UI Components
 */
export const iptvGlobals = {
  isCategoryLoading: (catId: string) => LOADING_CATEGORIES.has(catId),
  getCategoryData: (catId: string) => GLOBAL_STORE.get(catId) || null,
  setCategoryLoading: (catId: string, value: boolean) => {
    if (value) LOADING_CATEGORIES.add(catId)
    else LOADING_CATEGORIES.delete(catId)
  },
  setCategoryData: (catId: string, data: any[]) => {
    GLOBAL_STORE.set(catId, data)
  }
}

/**
 * Smart fetch for IPTV data with Global Concurrency Control and Artificial Delay for Stability
 */
export async function fetchIptv(url: string, options: RequestInit = {}, retries = 2): Promise<any> {
  const isGet = !options.method || options.method === 'GET'

  // 1. Throttle anti-metralleta (Evita que el mismo componente llame 100 veces por segundo)
  const now = Date.now()
  if (isGet && CALL_LOCK.has(url)) {
    const lastCall = CALL_LOCK.get(url)!
    if (now - lastCall < 100) { // Si se llamó hace menos de 100ms, ignorar
       return PENDING_REQUESTS.get(url) || (URL_CACHE.get(url)?.data);
    }
  }
  if (isGet) CALL_LOCK.set(url, now);

  // 2. Check Cache
  if (isGet && URL_CACHE.has(url)) {
    const cached = URL_CACHE.get(url)!
    if (now - cached.timestamp < CACHE_TTL) {
       console.log(`⚡ [Cache] IPTV Data: ${url.split('action=')[1] || url}`);
       return cached.data
    }
  }

  // 3. Global Request Locking (Deduplicación de red)
  if (isGet && PENDING_REQUESTS.has(url)) {
    return PENDING_REQUESTS.get(url)
  }

  const requestPromise = (async () => {
    const isNative = Capacitor.isNativePlatform()
    let finalUrl = url
    if (!isNative) {
      const adminUrl = import.meta.env.VITE_ADMIN_URL || import.meta.env.NEXT_PUBLIC_ADMIN_URL || '';
      finalUrl = adminUrl ? `${adminUrl}/api/proxy?url=${encodeURIComponent(url)}` : `/api/proxy?url=${encodeURIComponent(url)}`
    }

    let lastError: any;
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(finalUrl, {
          ...options,
          headers: {
            ...options.headers,
            'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
          }
        })

        if (!response.ok) {
           const text = await response.text();
           console.error(`🔴 [IPTV] Provider returned ${response.status}:`, text.slice(0, 100));
           throw new Error(`IPTV request failed: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
           const text = await response.text();
           console.warn('⚠️ [IPTV] Expected JSON but got HTML. Likely Invalid Credentials or 404.');
           console.warn('Preview:', text.slice(0, 50));
           throw new Error('PROVIDER_RETURNED_HTML');
        }

        const data = await response.json()
        
        if (isGet) {
          URL_CACHE.set(url, { data, timestamp: Date.now() })
        }
        return data
      } catch (err) {
        lastError = err;
        if (i < retries) await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw lastError
  })()

  // Registrar la promesa globalmente
  if (isGet) {
    PENDING_REQUESTS.set(url, requestPromise)
    try {
      return await requestPromise
    } finally {
      PENDING_REQUESTS.delete(url)
    }
  }

  return requestPromise
}

export function getBaseUrl(portalUrl: string) {
  if (!portalUrl) return ""
  let url = portalUrl.trim()
  if (url.endsWith('/')) url = url.slice(0, -1)
  if (!url.startsWith('http')) url = `http://${url}`
  return url
}
