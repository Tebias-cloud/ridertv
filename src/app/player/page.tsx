"use client"

import { useEffect, useState, useMemo } from 'react'
import { VideoPlayer } from '@/components/ui/VideoPlayer'
import { Logo } from '@/components/ui/Logo'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Interfaces esperadas
interface Stream {
  num: number
  name: string
  stream_type?: string
  stream_id: number
  stream_icon: string
  epg_channel_id?: string
  added: string
  category_id: string
  custom_sid?: string
  tv_archive?: number
  direct_source?: string
  tv_archive_duration?: number
  container_extension?: string
}

interface Category {
  category_id: string
  category_name: string
  parent_id: number
}

export default function PlayerPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'live' | 'vod'>('live')
  
  const [channels, setChannels] = useState<Stream[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  const [currentChannel, setCurrentChannel] = useState<Stream | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all')
  
  const [loading, setLoading] = useState(true)

  const [account, setAccount] = useState<{username: string, password: string, portal_url: string} | null>(null)

  useEffect(() => {
    const username = sessionStorage.getItem('iptv_username')
    const password = sessionStorage.getItem('iptv_password')
    const portal_url = sessionStorage.getItem('iptv_portal_url')

    if (!username || !password || !portal_url) {
      router.push('/catalog')
      return
    }

    setAccount({ username, password, portal_url })
  }, [router])

  useEffect(() => {
    if (!account) return

    async function fetchData() {
      setLoading(true)
      try {
        const baseIpTvUrl = (account!.portal_url.endsWith('/') ? account!.portal_url.slice(0, -1) : account!.portal_url)
        const actionStreams = viewMode === 'live' ? 'get_live_streams' : 'get_vod_streams'
        const actionCategories = viewMode === 'live' ? 'get_live_categories' : 'get_vod_categories'

        const authQuery = `username=${account!.username}&password=${account!.password}`

        // Fetch paralelo de Categorias y Canales
        const [channelsRes, categoriesRes] = await Promise.all([
          fetch(`${baseIpTvUrl}/player_api.php?${authQuery}&action=${actionStreams}`),
          fetch(`${baseIpTvUrl}/player_api.php?${authQuery}&action=${actionCategories}`)
        ])

        if (!channelsRes.ok || !categoriesRes.ok) {
          throw new Error('Error al cargar datos del upstream IPTV')
        }
        
        const channelsData = await channelsRes.json()
        const categoriesData = await categoriesRes.json()
        
        let loadedChannels: Stream[] = []

        if (Array.isArray(channelsData)) {
          // Deduplicación estricta de Canales
          loadedChannels = Array.from(new Map(channelsData.map(item => [item.stream_id, item])).values()) as Stream[]
        } else {
           console.warn('API de canales retornó formato no esperado.')
        }

        if (Array.isArray(categoriesData)) {
          // Deduplicación estricta de Categorías
          const uniqueCats = Array.from(new Map(categoriesData.map(item => [item.category_id, item])).values()) as Category[]
          setCategories(uniqueCats)
        } else {
           console.warn('API de categorías retornó formato no esperado.')
        }

        if (loadedChannels.length > 0) {
          setChannels(loadedChannels)
          // Activar la primera categoría presente (o dejar en 'all' manual)
          setActiveCategoryId('all')
          setCurrentChannel(loadedChannels[0])
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    setChannels([])
    setCategories([])
    setCurrentChannel(null)
    setActiveCategoryId('all')
    fetchData()
  }, [account, viewMode])

  // Lógica de Filtrado Local (Extremadamente rápida vs pedir de nuevo a la red)
  const filteredChannels = useMemo(() => {
    if (activeCategoryId === 'all') return channels
    return channels.filter(c => c.category_id === activeCategoryId)
  }, [channels, activeCategoryId])

  const cleanPortalUrl = account?.portal_url.endsWith('/') 
      ? account.portal_url.slice(0, -1) 
      : account?.portal_url || ''

  const currentStreamUrl = currentChannel && account
    ? (viewMode === 'live'
        ? `${cleanPortalUrl}/live/${account.username}/${account.password}/${currentChannel.stream_id}.m3u8`
        : `${cleanPortalUrl}/movie/${account.username}/${account.password}/${currentChannel.stream_id}.${currentChannel.container_extension || 'mp4'}`)
    : ''

  return (
    <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
      
      {/* Sidebar Izquierda (25%) */}
      <aside className="w-[30%] max-w-sm flex flex-col bg-zinc-900 border-r border-zinc-800 h-full drop-shadow-xl z-10 shrink-0">
        
        {/* Header estricto */}
        <div className="h-16 flex items-center shrink-0 px-4 border-b border-zinc-800 bg-zinc-900 z-20 shadow-sm shadow-zinc-950/20">
          <button onClick={() => router.push('/catalog')} className="text-zinc-400 hover:text-white mr-3 transition-colors" title="Volver al Catálogo">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Logo className="scale-75 origin-left" />
        </div>

        {/* Selector de Modo */}
        <div className="shrink-0 p-3 bg-zinc-950/80 border-b border-zinc-800/80">
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800/60">
            <button
              onClick={() => setViewMode('live')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === 'live' 
                  ? 'bg-[var(--color-rider-blue)] text-white shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              TV en Vivo
            </button>
            <button
              onClick={() => setViewMode('vod')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === 'vod' 
                  ? 'bg-[var(--color-rider-blue)] text-white shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              Películas
            </button>
          </div>
        </div>

        {/* Categorías (Pills con scroll horizontal) */}
        {!loading && categories.length > 0 && (
          <div className="shrink-0 border-b border-zinc-800/80 bg-zinc-950/50">
            <div className="flex overflow-x-auto custom-scrollbar px-3 py-3 gap-2 hide-scrollbar">
              <button 
                onClick={() => setActiveCategoryId('all')}
                className={`flex-none px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border
                ${activeCategoryId === 'all' 
                  ? 'bg-[var(--color-rider-blue)] text-white border-transparent' 
                  : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
              >
                Todos
              </button>
              {categories.map((cat, idx) => (
                <button 
                  key={`${cat.category_id}-${idx}`}
                  onClick={() => setActiveCategoryId(cat.category_id)}
                  className={`flex-none px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border
                  ${activeCategoryId === cat.category_id 
                    ? 'bg-[var(--color-rider-blue)] text-white border-transparent' 
                    : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                >
                  {cat.category_name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-3 bg-zinc-950/20 text-xs font-semibold uppercase tracking-widest text-zinc-500 shrink-0 shadow-inner">
          {viewMode === 'live' ? 'Lista de Canales' : 'Catálogo de Películas'}
        </div>

        {/* Listado de Canales (Scroll Variable) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-zinc-900/40">
          {loading ? (
            // Skeleton Loader State
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center opacity-50">
                  <div className="w-2 h-10 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-10 flex-1 bg-zinc-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-sm">
              {viewMode === 'live' ? 'No hay canales en esta categoría.' : 'No hay películas en esta categoría.'}
            </div>
          ) : (
            <ul className="flex flex-col pb-4">
              {filteredChannels.map((chan, idx) => {
                const isActive = currentChannel?.stream_id === chan.stream_id
                
                return (
                  <li key={`${chan.stream_id}-${idx}`}>
                    <button
                      onClick={() => setCurrentChannel(chan)}
                      className={`w-full text-left px-5 py-3.5 text-sm transition-colors border-b border-zinc-800/40 flex items-center gap-3
                        ${isActive 
                          ? 'bg-[var(--color-rider-blue)]/10 text-white font-bold border-l-4 border-l-[var(--color-rider-blue)]' 
                          : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200 border-l-4 border-l-transparent'
                        }`}
                    >
                      {isActive && (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-rider-blue)] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-rider-blue)]"></span>
                        </span>
                      )}
                      <span className="truncate">{chan.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Main Container (75%) */}
      <main className="flex-1 bg-black flex flex-col items-center justify-center h-full relative">
        <VideoPlayer key={currentStreamUrl} streamUrl={currentStreamUrl} />
      </main>

    </div>
  )
}
