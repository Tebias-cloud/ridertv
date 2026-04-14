"use client"

import { useState, useMemo, useEffect, useRef } from 'react'
import { MonitorPlay, Tv, ArrowLeft, X, Heart } from 'lucide-react'
import { VideoPlayer } from '@/components/ui/VideoPlayer'
import { useFavorites } from '@/hooks/useFavorites'
import { VirtualRow } from '@/components/ui/VirtualRow'

// ==========================
// COMPONENTE: LIVE CATEGORY ROW (Lazy Loading)
// ==========================
function LiveCategoryRow({ category, account, renderChannelCard, onChannelsLoaded }: { 
  category: any, 
  account: any, 
  renderChannelCard: (chan: any) => React.ReactNode,
  onChannelsLoaded: (catId: string, channels: any[]) => void
}) {
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.1, rootMargin: '400px' })

    if (rowRef.current) observer.observe(rowRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || channels.length > 0 || loading) return

    async function fetchChannels() {
      setLoading(true)
      setError(false)
      try {
        const proxyUrl = `/api/iptv/proxy?username=${account.username}&password=${account.password}&portal_url=${encodeURIComponent(account.portal_url)}&action=get_live_streams&category_id=${category.category_id}`
        const res = await fetch(proxyUrl)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setChannels(data)
            onChannelsLoaded(category.category_id, data)
          } else {
            setError(true)
          }
        } else {
          setError(true)
        }
      } catch (err) {
        console.error(`Error fetching live category ${category.category_id}:`, err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchChannels()
  }, [isVisible, account, category.category_id, channels.length, loading, onChannelsLoaded])

  if (channels.length === 0 && !loading && !error && isVisible) return null

  return (
    <VirtualRow>
      <div ref={rowRef} className="pl-4 sm:pl-8 min-h-[200px]">
        <h3 className="text-xl sm:text-2xl font-black text-white mb-4 sm:mb-6 tracking-tight drop-shadow-md">
          {category.category_name}
        </h3>
        
        <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pt-4 pb-6 mx-[-1rem] px-[1rem] sm:mx-0 sm:px-0">
          {loading ? (
             [...Array(5)].map((_, j) => (
                <div key={`skel-live-${category.category_id}-${j}`} className="shrink-0 w-44 sm:w-60 aspect-[4/3] sm:aspect-video bg-zinc-900/50 rounded-xl animate-pulse border border-white/5"></div>
             ))
          ) : error ? (
             <div className="flex items-center gap-3 py-6 px-6 bg-zinc-900/40 rounded-xl border border-zinc-800 text-zinc-500">
                <Tv className="w-5 h-5 opacity-40" />
                <span className="text-xs">Sin señal en esta zona</span>
             </div>
          ) : (
             channels.map((chan: any) => renderChannelCard(chan))
          )}
        </div>
      </div>
    </VirtualRow>
  )
}

export function LiveUI({ categories, account }: { categories: any[], account: any }) {
  const { favorites, isLoaded, toggleFavorite, isFavorite } = useFavorites('live')

  const [channelsByCategoryId, setChannelsByCategoryId] = useState<Record<string, any[]>>({})
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Smart TV Navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        setSelectedChannel(null)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const catMap = useMemo(() => {
    const map = new Map()
    categories.forEach(c => map.set(c.category_id, String(c.category_name || '').toLowerCase()))
    return map
  }, [categories])

  const [visibleCount, setVisibleCount] = useState(4)

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800) {
        setVisibleCount(prev => prev + 3)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const bannedKeywords = ['xxx', 'adult', '18+', 'porn']

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
       const catName = String(c.category_name || '').toLowerCase()
       return !bannedKeywords.some(kw => catName.includes(kw))
    })
  }, [categories])

  // Búsqueda sobre lo cargado
  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    const allChannels = Object.values(channelsByCategoryId).flat()
    const query = searchQuery.toLowerCase()
    
    return allChannels.filter(chan => 
      String(chan.name || '').toLowerCase().includes(query)
    ).slice(0, 50)
  }, [channelsByCategoryId, searchQuery])

  const streamUrl = selectedChannel ? 
      `${account.portal_url.replace(/\/$/, '')}/live/${account.username}/${account.password}/${selectedChannel.stream_id}.m3u8` : ''

  const renderChannelCard = (chan: any) => (
    <div 
       key={chan.stream_id}
       onClick={() => setSelectedChannel(chan)}
       onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.click() }}
       role="button"
       tabIndex={0}
       className={`relative rounded-xl overflow-hidden shrink-0 w-44 sm:w-60 aspect-[4/3] sm:aspect-video transition-all duration-300 ease-out transform-gpu will-change-transform text-left group bg-zinc-900/60 backdrop-blur-sm border border-white/5 shadow-md hover:shadow-2xl hover:border-red-500 hover:bg-zinc-800 hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-red-500 cursor-pointer focus:-translate-y-2 flex flex-col`}
    >
       <button 
          onClick={(e) => { e.stopPropagation(); toggleFavorite({ id: chan.stream_id, type: 'live', data: chan }); }}
          onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.click() }}
          tabIndex={0}
          className={`absolute top-2 right-2 z-[30] p-1.5 rounded-full bg-black/50 hover:bg-black/90 backdrop-blur-md transition-all outline-none focus:ring-4 focus:ring-red-500 ${isFavorite(chan.stream_id, 'live') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
          title="Guardar en Favoritos"
       >
         <Heart className={`w-4 h-4 ${isFavorite(chan.stream_id, 'live') ? 'fill-red-500 text-red-500' : 'text-zinc-300'}`} />
       </button>

       <div className="flex-1 w-full bg-black/40 relative group-hover:bg-black/20 transition-colors overflow-hidden">
         <div className="absolute inset-0 p-4 flex items-center justify-center">
           {chan.stream_icon ? (
             <img src={chan.stream_icon} alt={chan.name} onError={(e) => e.currentTarget.style.display = 'none'} className="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
           ) : (
             <Tv className="w-12 h-12 text-zinc-600 group-hover:scale-110 transition-transform duration-500" />
           )}
         </div>
       </div>
       
       <div className="h-10 sm:h-12 w-full bg-zinc-950/80 px-3 flex items-center justify-center border-t border-white/5">
          <span className="text-xs sm:text-[13px] font-bold w-full truncate text-center text-zinc-300 group-hover:text-white transition-colors">
            {chan.name}
          </span>
       </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full w-full relative z-20 mx-auto px-4 sm:px-8 max-w-[2000px] pb-12 text-white overflow-x-hidden">
      
      <div className="sticky top-0 z-[60] bg-zinc-950/90 backdrop-blur-3xl py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-zinc-800 shadow-xl shadow-black mb-8 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-8">
        <div className="flex items-center gap-4 basis-1/2">
           <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
             <Tv className="w-8 h-8 text-[var(--color-rider-blue)] drop-shadow" />
             Live TV
           </h1>
        </div>

        <div className="relative w-full sm:w-72">
           <input 
             type="search" 
             placeholder={"Buscar canal..."}
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 px-6 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--color-rider-blue)]/50 focus:ring-1 focus:ring-[var(--color-rider-blue)]/50 transition-all shadow-inner"
           />
        </div>
      </div>

      {searchQuery ? (
        <section className="relative z-20 pt-8 px-4 sm:px-8 max-w-[2000px] mx-auto pb-32">
          <div className="mb-4">
             <h3 className="text-xl font-bold text-zinc-500">Resultados para: <span className="text-white">{searchQuery}</span></h3>
          </div>
          {searchResults.length > 0 ? (
             <div className="flex flex-wrap gap-4 sm:gap-6 pt-4 pb-8">
                {searchResults.map(chan => renderChannelCard(chan))}
             </div>
          ) : (
             <div className="py-32 flex flex-col items-center justify-center text-center opacity-60">
                 <Tv className="w-16 h-16 text-zinc-500 mb-6 drop-shadow-lg" />
                 <h4 className="text-xl font-bold text-white mb-2">Señal Perdida</h4>
                 <p className="text-zinc-400 max-w-sm">No encontramos canales con ese nombre en las categorías cargadas.</p>
             </div>
          )}
        </section>
      ) : (
        <div className="relative z-30 max-w-[2000px] mx-auto pb-32 mt-4 space-y-12 sm:space-y-16">
          {filteredCategories.length > 0 ? (
            <>
               {isLoaded && favorites.length > 0 && (
                 <VirtualRow>
                   <div className="pl-4 sm:pl-8 mb-12">
                     <h3 className="text-xl sm:text-2xl font-black text-rose-500 mb-4 sm:mb-6 tracking-tight drop-shadow-md flex items-center gap-3">
                       <Heart className="w-6 h-6 fill-current" />
                       Tus Favoritos
                     </h3>
                     <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pb-8 pt-6 pr-4 sm:pr-8 mx-[-1rem] px-[1rem] sm:mx-0 sm:px-0">
                       {favorites.map((fav) => renderChannelCard(fav.data))}
                     </div>
                   </div>
                 </VirtualRow>
               )}
               {filteredCategories.slice(0, visibleCount).map((cat: any) => (
                  <LiveCategoryRow 
                     key={cat.category_id} 
                     category={cat} 
                     account={account} 
                     renderChannelCard={renderChannelCard}
                     onChannelsLoaded={(catId, channels) => {
                        setChannelsByCategoryId(prev => ({ ...prev, [catId]: channels }))
                     }}
                  />
               ))}
            </>
          ) : (
             <div className="py-32 flex flex-col items-center justify-center text-center opacity-60">
               <Tv className="w-16 h-16 text-zinc-500 mb-6 drop-shadow-lg" />
               <h4 className="text-xl font-bold text-white mb-2">Sincronizando Satélites</h4>
               <p className="text-zinc-400 max-w-sm">Estamos conectando con la red de transmisiones.</p>
             </div>
          )}
        </div>
      )}

      {selectedChannel && (
        <div className="fixed inset-0 z-[100] lg:z-[70] lg:inset-auto lg:w-[32%] xl:w-[35%] lg:fixed lg:right-0 lg:top-[120px] lg:bottom-0 lg:pb-10 lg:pr-8 flex flex-col justify-end lg:justify-start bg-black/90 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none animate-in fade-in slide-in-from-bottom-16 lg:slide-in-from-right-16 duration-500">
          
          <div className="bg-zinc-950 border-t lg:border border-zinc-800 lg:backdrop-blur-xl h-auto lg:h-[calc(100vh-160px)] w-full rounded-t-3xl lg:rounded-[2rem] p-1.5 shadow-2xl flex flex-col relative shadow-[var(--color-rider-blue)]/5">
             
             <div className="px-6 py-5 flex items-center justify-between border-b border-zinc-900/50 shrink-0">
                <div>
                  <h4 className="text-xl font-bold text-white max-w-[200px] lg:max-w-[280px] truncate leading-tight">{selectedChannel.name}</h4>
                  <p className="text-red-500 font-bold uppercase tracking-[0.2em] mt-1 text-[11px] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    En Vivo
                  </p>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => toggleFavorite({ id: selectedChannel.stream_id, type: 'live', data: selectedChannel })} 
                     className="bg-white/5 hover:bg-white/10 hover:text-red-500 p-3 rounded-full text-zinc-400 transition-all outline-none"
                   >
                     <Heart className={`w-5 h-5 ${isFavorite(selectedChannel.stream_id, 'live') ? 'fill-red-500 text-red-500' : ''}`} />
                   </button>
                   <button 
                     onClick={() => setSelectedChannel(null)} 
                     className="bg-white/5 hover:bg-white/10 p-3 rounded-full text-zinc-400 outline-none"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>
             </div>

             <div className="relative w-full aspect-video bg-black flex-shrink-0 lg:mt-4 p-0 mx-0 overflow-hidden lg:rounded-xl border-y lg:border border-white/5">
                <VideoPlayer key={selectedChannel.stream_id} streamUrl={streamUrl} isLive={true} />
             </div>

             <div className="mt-6 mb-8 lg:mb-0 px-6 text-zinc-500 flex flex-col gap-3">
               <div className="flex bg-zinc-900/40 backdrop-blur-md rounded-xl p-4 border border-zinc-800/80 items-center justify-between shadow-lg">
                 <div className="flex gap-4 items-center w-full">
                   {selectedChannel.stream_icon && (
                      <div className="w-12 h-12 bg-black/50 rounded-lg p-2 flex items-center justify-center border border-white/10 shrink-0">
                         <img src={selectedChannel.stream_icon} alt="icon" className="w-full h-full object-contain" />
                      </div>
                   )}
                   <div className="overflow-hidden">
                     <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Categoría</p>
                     <p className="text-sm font-bold text-white truncate">{catMap.get(selectedChannel.category_id) || 'General'}</p>
                   </div>
                 </div>
               </div>
             </div>

          </div>
        </div>
      )}

    </div>
  )
}
