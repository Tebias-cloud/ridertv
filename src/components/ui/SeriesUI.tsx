"use client"

import { useState, useMemo, useEffect, useRef } from 'react'
import { Clapperboard, MonitorPlay, X, Play, TvMinimal, Heart } from 'lucide-react'
import { VideoPlayer } from '@/components/ui/VideoPlayer'
import { useFavorites } from '@/hooks/useFavorites'
import { VirtualRow } from '@/components/ui/VirtualRow'

const BANNED = ['xxx', 'adult', '18+', 'porn']

// ==========================
// COMPONENTE: SERIES CATEGORY ROW (Lazy Loading)
// ==========================
function SeriesCategoryRow({ category, account, renderSerieCard, onSeriesLoaded }: { 
  category: any, 
  account: any, 
  renderSerieCard: (ser: any) => React.ReactNode,
  onSeriesLoaded: (catId: string, series: any[]) => void
}) {
  const [series, setSeries] = useState<any[]>([])
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
    if (!isVisible || series.length > 0 || loading) return

    async function fetchSeries() {
      setLoading(true)
      setError(false)
      try {
        const proxyUrl = `/api/iptv/proxy?username=${account.username}&password=${account.password}&portal_url=${encodeURIComponent(account.portal_url)}&action=get_series&category_id=${category.category_id}`
        const res = await fetch(proxyUrl)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const sfw = data.filter(s => !BANNED.some(kw => String(s.name || '').toLowerCase().includes(kw)))
            const sorted = sfw.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
            setSeries(sorted)
            onSeriesLoaded(category.category_id, sorted)
          } else {
            setError(true)
          }
        } else {
          setError(true)
        }
      } catch (err) {
        console.error(`Error fetching series category ${category.category_id}:`, err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchSeries()
  }, [isVisible, account, category.category_id, series.length, loading, onSeriesLoaded])

  if (series.length === 0 && !loading && !error && isVisible) return null

  const displayName = category.category_name ? category.category_name.replace(/^[sS]\s+/, '') : ''

  return (
    <VirtualRow>
      <div ref={rowRef} className="pl-4 sm:pl-8 min-h-[280px]">
        <h3 className="text-xl sm:text-2xl font-black text-white mb-4 sm:mb-6 tracking-tight drop-shadow-md">
          {displayName}
        </h3>
        
        <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pt-4 pb-6 mx-[-1rem] px-[1rem] sm:mx-0 sm:px-0">
          {loading ? (
             [...Array(6)].map((_, j) => (
                <div key={`skel-series-${category.category_id}-${j}`} className="shrink-0 w-36 sm:w-48 xl:w-56 aspect-[2/3] bg-zinc-900/50 rounded-2xl animate-pulse"></div>
             ))
          ) : error ? (
             <div className="flex items-center gap-3 py-8 px-6 bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500">
                <Clapperboard className="w-5 h-5 opacity-40" />
                <span className="text-xs">Contenido no disponible temporalmente</span>
             </div>
          ) : (
             series.map((ser: any) => renderSerieCard(ser))
          )}
        </div>
      </div>
    </VirtualRow>
  )
}

export function SeriesUI({ categories, account }: { categories: any[], account: any }) {
  const { favorites, isLoaded, toggleFavorite, isFavorite } = useFavorites('series')

  const [seriesByCategoryId, setSeriesByCategoryId] = useState<Record<string, any[]>>({})
  const [searchQuery, setSearchQuery] = useState('')

  // Nivel 3: Seleccion de Serie
  const [selectedSerie, setSelectedSerie] = useState<any | null>(null)
  const [serieInfo, setSerieInfo] = useState<any | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [activeSeason, setActiveSeason] = useState<string>('')
  const [playingEpisode, setPlayingEpisode] = useState<any | null>(null)

  // Smart TV Navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        setSelectedSerie(null)
        setPlayingEpisode(null)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

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

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
       const catName = String(c.category_name || '').toLowerCase()
       return !BANNED.some(kw => catName.includes(kw))
    })
  }, [categories])

  // Búsqueda sobre lo ya cargado en memoria
  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    const allSeries = Object.values(seriesByCategoryId).flat()
    const query = searchQuery.toLowerCase()
    return allSeries.filter(s =>
      String(s.name || '').toLowerCase().includes(query)
    ).slice(0, 50)
  }, [seriesByCategoryId, searchQuery])

  // Fetch info episodios al seleccionar una serie
  useEffect(() => {
    if (!selectedSerie) {
      setSerieInfo(null)
      setPlayingEpisode(null)
      return
    }
    async function fetchSerieInfo() {
      setLoadingInfo(true)
      setPlayingEpisode(null)
      try {
        const proxyUrl = `/api/iptv/proxy?username=${account.username}&password=${account.password}&portal_url=${encodeURIComponent(account.portal_url)}&action=get_series_info&series_id=${selectedSerie.series_id}`
        const res = await fetch(proxyUrl)
        if (res.ok) {
          const data = await res.json()
          if (data?.episodes) {
            setSerieInfo(data)
            const seasons = Object.keys(data.episodes)
            if (seasons.length > 0) setActiveSeason(seasons[0])
          } else {
            setSerieInfo(null)
          }
        }
      } catch (e) {
        console.error("Error fetching series info:", e)
      } finally {
        setLoadingInfo(false)
      }
    }
    fetchSerieInfo()
  }, [selectedSerie, account])

  const renderSerieCard = (ser: any) => (
     <div 
        key={ser.series_id}
        onClick={() => setSelectedSerie(ser)}
        onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.click() }}
        role="button"
        tabIndex={0}
        className="relative rounded-[1.5rem] shrink-0 w-36 sm:w-48 xl:w-56 overflow-hidden transition-transform duration-300 ease-out transform-gpu will-change-transform text-left group border border-transparent hover:border-rose-500/50 hover:shadow-[0_0_40px_rgba(244,63,94,0.2)] aspect-[2/3] hover:-translate-y-2 bg-zinc-900 cursor-pointer focus:outline-none focus:ring-[6px] focus:ring-white focus:scale-[1.05] focus:z-50 focus:-translate-y-2"
     >
        <button 
          onClick={(e) => { e.stopPropagation(); toggleFavorite({ id: ser.series_id, type: 'series', data: ser }); }}
          tabIndex={0}
          className={`absolute top-2 left-2 z-[30] p-2 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md transition-all outline-none focus:ring-4 focus:ring-rose-500 ${isFavorite(ser.series_id, 'series') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
        >
          <Heart className={`w-5 h-5 ${isFavorite(ser.series_id, 'series') ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>

        {ser.cover ? (
          <img src={ser.cover} alt={ser.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => e.currentTarget.style.display = 'none'} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 bg-zinc-950 p-4">
             <TvMinimal className="w-12 h-12 mb-2 opacity-50" />
             <span className="text-xs text-center font-bold">{ser.name}</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
           <Play className="w-12 h-12 text-white ml-1 filter drop-shadow-lg scale-75 group-hover:scale-100 transition-transform duration-500" fill="currentColor" />
        </div>
        <div className="absolute bottom-0 w-full p-4">
          <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow-md">{ser.name}</h4>
          {ser.rating && ser.rating !== "0" ? (
            <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-md mt-2 inline-block">⭐ {ser.rating}</span>
          ) : null}
        </div>
     </div>
  )

  return (
    <div className="flex flex-col h-full w-full relative z-20 mx-auto max-w-[2000px] mb-12 text-white">
      
      <div className="sticky top-0 z-[60] bg-zinc-950/90 backdrop-blur-3xl py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-zinc-800 shadow-xl shadow-black mb-8 px-4 sm:px-8 pt-8">
        <div className="flex items-center gap-4 basis-1/2">
           <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
             <Clapperboard className="w-8 h-8 text-rose-500 drop-shadow" />
             Series VOD
           </h1>
        </div>
        <div className="relative w-full sm:w-80">
           <input 
             type="search" 
             placeholder="Buscar serie..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 px-6 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all shadow-inner"
           />
        </div>
      </div>



      {searchQuery ? (
        <section className="relative z-20 pt-8 px-4 sm:px-8 max-w-[2000px] mx-auto pb-32">
          <div className="mb-4">
             <h3 className="text-xl font-bold text-zinc-500">Resultados para: <span className="text-white">{searchQuery}</span></h3>
          </div>
          {searchResults.length > 0 ? (
             <div className="flex flex-wrap gap-4 sm:gap-6">
                {searchResults.map(ser => renderSerieCard(ser))}
             </div>
          ) : (
             <div className="py-32 flex flex-col items-center justify-center text-center opacity-60">
                 <Clapperboard className="w-16 h-16 text-zinc-500 mb-6 drop-shadow-lg" />
                 <h4 className="text-xl font-bold text-white mb-2">Bóveda Vacía</h4>
                 <p className="text-zinc-400 max-w-sm">No encontramos series con ese nombre en las categorías cargadas.</p>
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
                     <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pt-4 pb-6 mx-[-1rem] px-[1rem] sm:mx-0 sm:px-0">
                       {favorites.map((fav) => renderSerieCard(fav.data))}
                     </div>
                   </div>
                 </VirtualRow>
               )}
               {filteredCategories.slice(0, visibleCount).map((cat: any) => (
                  <SeriesCategoryRow 
                     key={cat.category_id} 
                     category={cat} 
                     account={account} 
                     renderSerieCard={renderSerieCard}
                     onSeriesLoaded={(catId, s) => {
                        setSeriesByCategoryId(prev => ({ ...prev, [catId]: s }))
                     }}
                  />
               ))}
            </>
          ) : (
             <div className="py-32 flex flex-col items-center justify-center text-center opacity-60">
               <Clapperboard className="w-16 h-16 text-zinc-500 mb-6 drop-shadow-lg" />
               <h4 className="text-xl font-bold text-white mb-2">Preparando Catálogo</h4>
               <p className="text-zinc-400 max-w-sm">Cargando franquicias disponibles.</p>
             </div>
          )}
        </div>
      )}

      {/* NIVEL 3: Modal Inmersivo */}
      {selectedSerie && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300 bg-black/80 backdrop-blur-sm items-center justify-center p-4 lg:p-10" onClick={() => { setSelectedSerie(null); setPlayingEpisode(null); }}>
          
          <div className="bg-zinc-950 border border-zinc-800 shadow-2xl rounded-3xl w-full max-w-6xl max-h-full lg:max-h-[85vh] overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
            
            <div className="absolute top-4 right-4 z-50 flex gap-2">
               <button 
                 onClick={() => toggleFavorite({ id: selectedSerie.series_id, type: 'series', data: selectedSerie })}
                 className="bg-black/50 hover:bg-white text-zinc-300 hover:text-red-500 backdrop-blur-md p-3 rounded-full transition-all outline-none focus:ring-4 focus:ring-rose-500 active:scale-90"
               >
                 <Heart className={`w-5 h-5 ${isFavorite(selectedSerie.series_id, 'series') ? 'fill-red-500 text-red-500' : ''}`} />
               </button>
               <button 
                 onClick={() => { setSelectedSerie(null); setPlayingEpisode(null); }} 
                 className="bg-black/50 hover:bg-white text-zinc-300 hover:text-black backdrop-blur-md p-3 rounded-full transition-all outline-none focus:ring-4 focus:ring-white active:scale-90"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="w-full relative shrink-0 transition-all duration-700 ease-in-out bg-black" style={{ height: playingEpisode ? '45vh' : '40vh', minHeight: playingEpisode ? '250px' : '200px' }}>
               {playingEpisode ? (
                  (() => {
                    const formatCompatibleUrl = (url: string) => url.replace(/\.mkv$/i, '.mp4').replace(/\.avi$/i, '.mp4').replace(/\.ts$/i, '.m3u8');
                    return (
                      <VideoPlayer 
                          key={playingEpisode.id}
                          streamUrl={formatCompatibleUrl(`${account.portal_url.replace(/\/$/, '')}/series/${account.username}/${account.password}/${playingEpisode.id}.${playingEpisode.container_extension || 'mp4'}`)}
                      />
                    );
                  })()
               ) : (
                  <>
                     <img 
                       src={serieInfo?.info?.backdrop_path ? serieInfo.info.backdrop_path[0] : (selectedSerie.cover || selectedSerie.backdrop_path)} 
                       alt="Backdrop" 
                       className="w-full h-full object-cover opacity-60"
                       onError={(e) => { e.currentTarget.src = ''; e.currentTarget.className = "w-full h-full bg-zinc-900"; }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
                     <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 to-transparent p-8 sm:p-12 flex flex-col justify-end">
                       <h2 className="text-3xl sm:text-5xl font-black text-white drop-shadow-lg max-w-2xl leading-tight">
                         {serieInfo?.info?.title || selectedSerie.name}
                       </h2>
                       <div className="flex gap-4 mt-4 text-sm font-medium text-zinc-300">
                         {serieInfo?.info?.releaseDate && <span>📅 {serieInfo.info.releaseDate}</span>}
                         {serieInfo?.info?.genre && <span>🎬 {serieInfo.info.genre}</span>}
                       </div>
                       <p className="text-zinc-400 mt-4 max-w-3xl line-clamp-3 text-sm leading-relaxed">
                         {serieInfo?.info?.plot || "Sin sinopsis disponible."}
                       </p>
                     </div>
                  </>
               )}
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
               {loadingInfo ? (
                  <div className="flex items-center justify-center h-full">
                     <MonitorPlay className="w-12 h-12 text-zinc-800 animate-pulse" />
                  </div>
               ) : serieInfo?.episodes ? (
                  <>
                    <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-950 shrink-0">
                       <div className="flex overflow-x-auto gap-2 hide-scrollbar">
                         {Object.keys(serieInfo.episodes).map(seasonNum => (
                           <button 
                              key={`s-${seasonNum}`}
                              onClick={() => setActiveSeason(seasonNum)}
                              className={`px-5 py-2 rounded-full font-bold text-sm transition-colors shrink-0 ${activeSeason === seasonNum ? 'bg-white text-black' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'}`}
                           >
                             Temporada {seasonNum}
                           </button>
                         ))}
                       </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4 gap-4 flex flex-col hide-scrollbar">
                       {serieInfo.episodes[activeSeason]?.map((ep: any) => (
                           <button 
                             key={ep.id}
                             onClick={() => setPlayingEpisode(ep)}
                             tabIndex={0}
                             className={`flex flex-col sm:flex-row gap-4 p-4 rounded-2xl transition-all w-full text-left group border outline-none focus:ring-[6px] focus:ring-white focus:scale-[1.02] focus:z-50
                               ${playingEpisode?.id === ep.id 
                                 ? 'bg-rose-500/10 border-rose-500/30' 
                                 : 'bg-zinc-900/50 hover:bg-zinc-800 border-transparent hover:border-white/5'
                               }`}
                           >
                             <div className="w-full sm:w-48 aspect-video bg-zinc-950 rounded-lg overflow-hidden relative shrink-0">
                                {ep.info?.movie_image ? (
                                  <img src={ep.info.movie_image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-800"><Clapperboard /></div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Play className="w-8 h-8 text-white" fill="currentColor" />
                                </div>
                                <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                                  EP {ep.episode_num}
                                </span>
                             </div>
                             <div className="flex flex-col justify-center">
                               <h5 className={`font-bold text-base ${playingEpisode?.id === ep.id ? 'text-rose-500' : 'text-white'}`}>
                                 {ep.title}
                               </h5>
                               <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                                 {ep.info?.plot || "Reproducir episodio."}
                               </p>
                               {ep.info?.duration && (
                                 <span className="text-xs text-zinc-600 mt-3 font-semibold">{ep.info.duration} min</span>
                               )}
                             </div>
                          </button>
                       ))}
                    </div>
                  </>
               ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
                     No se encontraron episodios para esta serie.
                  </div>
               )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
