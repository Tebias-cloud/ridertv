"use client"

import { useState, useMemo, useEffect, useRef } from 'react'
import { HeroBanner } from '@/components/ui/HeroBanner'
import { Search, Flame, Clock, Play, X, Compass, CheckCircle2, ChevronRight, Video, Heart } from 'lucide-react'
import { VideoPlayer } from '@/components/ui/VideoPlayer'
import { useFavorites } from '@/hooks/useFavorites'
import { VirtualRow } from '@/components/ui/VirtualRow'

// ==========================
// COMPONENTE: CATEGORY ROW (Lazy Loading)
// ==========================
function CategoryRow({ category, activeAccount, renderMovieCard, onMoviesLoaded }: {
  category: any,
  activeAccount: any,
  renderMovieCard: (mov: any) => React.ReactNode,
  onMoviesLoaded: (catId: string, movies: any[]) => void
}) {
  const [movies, setMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  // Intersection Observer to trigger fetch only when visible
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
    if (!isVisible || movies.length > 0 || loading) return

    async function fetchMovies() {
      setLoading(true)
      setError(false)
      try {
        const proxyUrl = `${(activeAccount.portal_url.endsWith('/') ? activeAccount.portal_url.slice(0, -1) : activeAccount.portal_url)}/player_api.php?username=${activeAccount.username}&password=${activeAccount.password}&action=get_vod_streams&category_id=${category.category_id}`
        const res = await fetch(proxyUrl)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            // Sort by rating desc
            const sorted = data.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
            setMovies(sorted)
            onMoviesLoaded(category.category_id, sorted)
          } else {
            setError(true)
          }
        } else {
          setError(true)
        }
      } catch (err) {
        console.error(`Error fetching category ${category.category_id}:`, err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchMovies()
  }, [isVisible, activeAccount, category.category_id, movies.length, loading, onMoviesLoaded])

  // Don't render empty categories after fetch
  if (movies.length === 0 && !loading && !error && isVisible) return null

  return (
    <VirtualRow>
      <div ref={rowRef} className="pl-4 sm:pl-8 min-h-[300px]">
        <h3 className="text-xl sm:text-2xl font-black text-white mb-4 sm:mb-6 tracking-tight drop-shadow-md">
          {category.category_name}
        </h3>

        <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pt-4 pb-6 mx-[-1rem] px-[1rem] sm:mx-0 sm:px-0 scroll-smooth">
          {loading ? (
            [...Array(6)].map((_, j) => (
              <div key={`skel-${category.category_id}-${j}`} className="shrink-0 w-36 sm:w-48 xl:w-56 aspect-[2/3] bg-zinc-900/50 rounded-2xl animate-pulse"></div>
            ))
          ) : error ? (
            <div className="flex items-center gap-3 py-10 px-6 bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500">
              <Video className="w-5 h-5 opacity-50" />
              <span className="text-sm">Contenido no disponible temporalmente</span>
            </div>
          ) : (
            movies.map((mov: any) => renderMovieCard(mov))
          )}
        </div>
      </div>
    </VirtualRow>
  )
}

export function CatalogUI({ categories, heroMovie, validAccounts, activeAccount }: { categories: any[], heroMovie: any, validAccounts: any[], activeAccount: any }) {
  const { favorites, isLoaded, toggleFavorite, isFavorite } = useFavorites('movie')

  const [searchQuery, setSearchQuery] = useState('')
  const [moviesByCategoryId, setMoviesByCategoryId] = useState<Record<string, any[]>>({})
  const [loadingSearch, setLoadingSearch] = useState(false)

  // Nivel 3 (Inmersivo)
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null)
  const [playingMovie, setPlayingMovie] = useState<any | null>(null)

  // Smart TV Navigation (Escape/Backspace to close modals)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        setSelectedMovie(null)
        setPlayingMovie(null)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const bannedKeywords = ['xxx', 'brazzer', 'adult', '18+', 'porn', 'playboy', 'hustler', 'bangbros', 'venus']

  // ==========================
  // 2. BUSCADOR DINÁMICO (Basado en lo cargado)
  // ==========================
  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    const allMovies = Object.values(moviesByCategoryId).flat()
    const query = searchQuery.toLowerCase()

    const bypassAdultBlock = bannedKeywords.some(kw => query.includes(kw))

    const matches = allMovies.filter((mov: any) => {
      const matchSearch = String(mov.name || '').toLowerCase().includes(query) || String(mov.stream_id || '').includes(query)
      if (!matchSearch) return false;

      if (!bypassAdultBlock) {
        const streamName = String(mov.name || '').toLowerCase()
        const isAdult = bannedKeywords.some(kw => streamName.includes(kw))
        if (isAdult) return false;
      }
      return true;
    })

    return matches.slice(0, 50)
  }, [moviesByCategoryId, searchQuery])

  // ==========================
  // 3. GENERADOR DE CARRUSELES DINAMICOS (Lazy Loading + SFW Filter)
  // ==========================
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
    if (categories.length === 0) return [];
    return categories.filter(c => {
      const catName = String(c.category_name || '').toLowerCase()
      return !bannedKeywords.some(kw => catName.includes(kw))
    })
  }, [categories])


  // ==========================
  // 4. DEEP INFO FETCH (NIVEL 3 METADATA)
  // ==========================
  const [movieInfo, setMovieInfo] = useState<any | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  useEffect(() => {
    if (!selectedMovie) {
      setMovieInfo(null)
      return
    }

    async function fetchDeepInfo() {
      setLoadingInfo(true)
      try {
        const proxyUrl = `${(activeAccount.portal_url.endsWith('/') ? activeAccount.portal_url.slice(0, -1) : activeAccount.portal_url)}/player_api.php?username=${activeAccount.username}&password=${activeAccount.password}&action=get_vod_info&vod_id=${selectedMovie.stream_id}`
        const res = await fetch(proxyUrl)
        if (res.ok) {
          const data = await res.json()
          if (data && data.info) {
            setMovieInfo(data.info)
          }
        }
      } catch (err) {
        console.error("Deep Fetch failed: ", err)
      } finally {
        setLoadingInfo(false)
      }
    }
    fetchDeepInfo()
  }, [selectedMovie, activeAccount])

  // ==========================
  // RENDER HELPERS
  // ==========================
  const renderMovieCard = (mov: any) => (
    <div
      key={mov.stream_id}
      onClick={() => setSelectedMovie(mov)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click() }}
      role="button"
      tabIndex={0}
      className="nav-item relative rounded-2xl overflow-hidden shrink-0 w-36 sm:w-48 xl:w-56 aspect-[2/3] transition-transform duration-300 ease-out transform-gpu will-change-transform text-left group bg-zinc-950 border border-transparent hover:border-white/20 focus:outline-none focus:ring-[6px] focus:ring-white focus:scale-[1.05] focus:z-50 focus:border-white hover:-translate-y-2 cursor-pointer"
    >
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite({ id: mov.stream_id, type: 'movie', data: mov }); }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click() }}
        tabIndex={0}
        className={`absolute top-2 left-2 z-[30] p-2 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md transition-all outline-none focus:ring-4 focus:ring-rose-500 ${isFavorite(mov.stream_id, 'movie') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
        title="Guardar en Favoritos"
      >
        <Heart className={`w-5 h-5 ${isFavorite(mov.stream_id, 'movie') ? 'fill-red-500 text-red-500' : 'text-white'}`} />
      </button>

      {mov.stream_icon ? (
        <img src={mov.stream_icon} alt={mov.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90" onError={(e) => { e.currentTarget.src = ''; e.currentTarget.className = "hidden" }} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 p-4"><Video className="w-10 h-10 mb-2 opacity-50" /><span className="text-xs text-center font-bold tracking-tight px-2">{mov.name}</span></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
        <Play className="w-10 h-10 text-[var(--color-rider-blue)] filter drop-shadow-[0_0_10px_rgba(37,99,235,0.8)] scale-75 group-hover:scale-100 transition-transform duration-500 mb-3" fill="currentColor" />
        <span className="text-white text-xs font-bold text-center line-clamp-3">{mov.name}</span>
      </div>
      {(mov.rating && mov.rating !== "0" && mov.rating !== "0.0") && (
        <span className="absolute top-2 right-2 text-[10px] bg-yellow-500/90 text-black font-black px-1.5 py-0.5 rounded shadow shadow-black/50 backdrop-blur-md z-20">
          ⭐ {mov.rating}
        </span>
      )}
    </div>
  )

  return (
    <main className="relative min-h-screen">

      {/* GLOBAL SEARCH TOP_BAR (Always Visible) */}
      <div className={`fixed top-0 w-full lg:w-[calc(100%-260px)] right-0 z-[60] bg-zinc-950/80 backdrop-blur-3xl border-b border-zinc-800/50 py-4 px-4 sm:px-8 transition-all`}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 max-w-[2000px] mx-auto">
          {searchQuery ? (
            <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-3 w-full sm:w-auto">
              <Search className="w-5 h-5 text-[var(--color-rider-blue)]" />
              Búsqueda Profunda
            </h2>
          ) : (
            <h2 className="text-xl font-bold text-white tracking-widest uppercase w-full sm:w-auto opacity-0 sm:opacity-100 invisible sm:visible">
              Explorar App
            </h2>
          )}
          <div className="relative w-full sm:w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 z-10" />
            <input
              type="search"
              placeholder="Buscar película por nombre o ID global..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  const firstItem = document.querySelector('.nav-item, button:not([disabled])') as HTMLElement;
                  if (firstItem) firstItem.focus();
                }
              }}
              className="w-full bg-zinc-900 border border-zinc-700/50 rounded-full py-3.5 pl-11 pr-6 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--color-rider-blue)] focus:ring-1 focus:ring-[var(--color-rider-blue)] transition-all shadow-inner"
            />
          </div>
        </div>
      </div>


      {/* ======================= */}
      {/* RENDERIZADO CONDICIONAL DE PANTALLA */}
      {/* ======================= */}



      {searchQuery ? (
        <section className="relative z-20 pt-32 px-4 sm:px-8 max-w-[2000px] mx-auto pb-32 min-h-screen">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              Resultados en Memoria <ChevronRight className="w-6 h-6 text-zinc-600" />
              <span className="text-zinc-500 font-medium text-lg">{searchQuery}</span>
            </h3>
          </div>
          {searchResults.length > 0 ? (
            <div className="flex flex-wrap gap-4 sm:gap-6">
              {searchResults.map(mov => renderMovieCard(mov))}
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center opacity-60">
              <Search className="w-16 h-16 text-zinc-500 mb-6 drop-shadow-lg" />
              <h4 className="text-xl font-bold text-white mb-2">Punto Ciego</h4>
              <p className="text-zinc-400 max-w-sm">No encontramos coincidencias en las categorías cargadas. Intenta cargar más categorías haciendo scroll.</p>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* HERO PRINCIPAL */}
          <section className="relative w-full z-10 pt-20 sm:pt-0">
            {heroMovie && (
              <HeroBanner movie={heroMovie} account={activeAccount} overridePlay={() => setSelectedMovie(heroMovie)} />
            )}
            <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-zinc-950 to-transparent z-20" />
          </section>

          <section className="relative z-30 max-w-[2000px] mx-auto pb-32 -mt-10 space-y-12 sm:space-y-16">

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
                        {favorites.map((fav) => renderMovieCard(fav.data))}
                      </div>
                    </div>
                  </VirtualRow>
                )}
                {filteredCategories.slice(0, visibleCount).map((cat: any) => (
                  <CategoryRow
                    key={cat.category_id}
                    category={cat}
                    activeAccount={activeAccount}
                    renderMovieCard={renderMovieCard}
                    onMoviesLoaded={(catId, movies) => {
                      setMoviesByCategoryId(prev => ({ ...prev, [catId]: movies }))
                    }}
                  />
                ))}
              </>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-center opacity-60">
                <Video className="w-16 h-16 text-zinc-500 mb-6 drop-shadow-lg" />
                <h4 className="text-xl font-bold text-white mb-2">Preparando Estante</h4>
                <p className="text-zinc-400 max-w-sm">Estamos organizando la librería de películas para ti.</p>
              </div>
            )}

          </section>
        </>
      )}


      {/* ======================= */}
      {/* FINAL FASE: MODAL INMERSIVO */}
      {/* ======================= */}
      {selectedMovie && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300 bg-black/90 backdrop-blur-md items-center justify-center p-0 lg:p-10" onClick={() => { setSelectedMovie(null); setPlayingMovie(null); }}>

          <div className="bg-zinc-950 border border-zinc-800 lg:rounded-[2rem] w-full h-full lg:h-auto max-h-full lg:max-h-[90vh] lg:max-w-7xl overflow-hidden flex flex-col relative shadow-[0_0_100px_rgba(0,0,0,1)]" onClick={e => e.stopPropagation()}>

            <div className="absolute top-4 right-4 z-[90] flex gap-3">
              <button
                onClick={() => toggleFavorite({ id: selectedMovie.stream_id, type: 'movie', data: selectedMovie })}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click() }}
                tabIndex={0}
                className="bg-black/50 hover:bg-white text-zinc-300 hover:text-red-500 backdrop-blur-md p-3.5 rounded-full transition-all outline-none focus:ring-4 focus:ring-rose-500 active:scale-90"
                title="Favoritos"
              >
                <Heart className={`w-6 h-6 ${isFavorite(selectedMovie.stream_id, 'movie') ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button
                onClick={() => { setSelectedMovie(null); setPlayingMovie(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click() }}
                tabIndex={0}
                className="bg-black/50 hover:bg-white text-zinc-300 hover:text-black backdrop-blur-md p-3.5 rounded-full transition-all outline-none focus:ring-4 focus:ring-white active:scale-90"
                title="Cerrar Película"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {playingMovie ? (
              <div className="relative w-full h-full lg:aspect-video flex items-center justify-center bg-black shrink-0 transition-opacity duration-700 pb-16 lg:pb-0 overflow-y-visible">
                {(() => {
                  const formatCompatibleUrl = (url: string) => url.replace(/\.mkv$/i, '.mp4').replace(/\.avi$/i, '.mp4').replace(/\.ts$/i, '.m3u8');
                  return (
                    <VideoPlayer
                      key={playingMovie.stream_id || playingMovie.id}
                      streamUrl={formatCompatibleUrl(`${activeAccount.portal_url.replace(/\/$/, '')}/movie/${activeAccount.username}/${activeAccount.password}/${playingMovie.stream_id || playingMovie.id}.${playingMovie.container_extension || 'mp4'}`)}
                    />
                  );
                })()}
              </div>
            ) : (
              <div className="relative w-full h-full flex flex-col justify-end bg-black">
                <img
                  src={selectedMovie.stream_icon || selectedMovie.cover}
                  alt="Movie Background"
                  className="absolute inset-0 w-full h-full object-cover object-center opacity-30 blur-3xl scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent"></div>

                <div className="relative z-10 p-8 sm:p-12 lg:p-16 w-full flex flex-col md:flex-row items-end md:items-center justify-between gap-12">

                  <div className="w-full max-w-3xl">
                    <h2 className="text-4xl sm:text-6xl font-black text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] leading-tight mb-2 tracking-tighter">
                      {selectedMovie.name || "Cinta Desconocida"}
                    </h2>

                    <div className="flex flex-wrap gap-3 mb-6 items-center text-sm font-bold opacity-0 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-forwards">
                      {(selectedMovie.rating && selectedMovie.rating !== "0" && selectedMovie.rating !== "0.0") && (
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded shadow drop-shadow-md">⭐ {selectedMovie.rating}</span>
                      )}
                      {(selectedMovie.added && !isNaN(Number(selectedMovie.added))) && (
                        <span className="text-zinc-300 border border-zinc-700 bg-zinc-900/80 backdrop-blur-sm px-3 py-1 rounded tracking-widest drop-shadow-md">
                          {new Date(Number(selectedMovie.added) * 1000).getFullYear()}
                        </span>
                      )}
                      {movieInfo?.duration && (
                        <span className="text-zinc-300 border border-zinc-700 bg-zinc-900/80 backdrop-blur-sm px-3 py-1 rounded flex items-center gap-1 drop-shadow-md">
                          <Clock className="w-4 h-4" /> {movieInfo.duration}
                        </span>
                      )}
                      {movieInfo?.genre && (
                        <span className="text-white border border-[var(--color-rider-blue)] bg-[var(--color-rider-blue)]/20 backdrop-blur-sm px-3 py-1 rounded drop-shadow-md">
                          {movieInfo.genre.split(',')[0]}
                        </span>
                      )}{loadingInfo && (
                        <span className="text-zinc-500 animate-pulse px-2 flex items-center gap-2 rounded">
                          <div className="w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                          Desencriptando metadatos...
                        </span>
                      )}
                    </div>

                    <p className="text-zinc-300 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed mb-6 line-clamp-4 font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                      {movieInfo?.plot || selectedMovie.plot || "Acomódese y disfrute de este metraje extraído en la más alta resolución posible mediante Rider IPTV."}
                    </p>

                    {/* Cast & Crew Compact List */}
                    <div className="flex flex-col gap-1 mb-10 text-sm opacity-0 animate-in fade-in duration-500 delay-300 fill-mode-forwards text-zinc-400 drop-shadow-md">
                      {movieInfo?.director && <p><span className="text-zinc-500 font-bold">Director:</span> <span className="text-white">{movieInfo.director}</span></p>}
                      {movieInfo?.cast && <p className="line-clamp-1"><span className="text-zinc-500 font-bold">Elenco:</span> <span className="text-white">{movieInfo.cast}</span></p>}
                    </div>
                    <button
                      onClick={() => setPlayingMovie(selectedMovie)}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click() }}
                      tabIndex={0}
                      className="flex items-center px-10 py-5 bg-white text-black hover:bg-zinc-300 font-black rounded-[1.2rem] transition-all hover:scale-105 shadow-[0_10px_40px_rgba(255,255,255,0.2)] text-lg capitalize tracking-wide outline-none focus:ring-8 focus:ring-white focus:scale-105 active:scale-95"
                    >
                      <svg className="w-8 h-8 mr-3 fill-black" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      Iniciar Proyección
                    </button>
                  </div>

                  {/* Poster Nítido lateral (Premium UI) */}
                  <div className="hidden md:block w-56 lg:w-72 xl:w-80 shrink-0 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                    {selectedMovie.stream_icon && (
                      <img
                        src={selectedMovie.stream_icon}
                        alt="Poster"
                        className="w-full h-auto object-contain rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] border border-white/10"
                      />
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  )
}
