import { useState, useMemo, useEffect, memo, useCallback } from 'react'
import debounce from 'lodash/debounce'
import { HeroBanner } from '@/components/ui/HeroBanner'
import { Video, X } from 'lucide-react'
import { VideoPlayer } from '@/components/ui/VideoPlayer'
import { VirtualRow } from '@/components/ui/VirtualRow'
import { fetchIptv, getBaseUrl, iptvGlobals } from '@/lib/iptv'
import { useApp } from '@/components/layout/AuthenticatedLayout'
import { navigationBus } from '../layout/SpatialNavProvider'

// ==========================
// COMPONENTE: CATEGORY ROW (Omega Stabilization)
// ==========================
function CategoryRow({ category, activeAccount, renderMovieCard, onMoviesLoaded }: {
  category: any,
  activeAccount: any,
  renderMovieCard: (mov: any) => React.ReactNode,
  onMoviesLoaded: (catId: string, movies: any[]) => void
}) {
  const [movies, setMovies] = useState<any[]>(() => iptvGlobals.getCategoryData(category.category_id) || [])
  const [loading, setLoading] = useState(() => iptvGlobals.isCategoryLoading(category.category_id))
  // Removing redundant inner IntersectionObserver. Replaced by VirtualRow mount trigger.

  useEffect(() => {
    // Si ya tenemos data o estamos cargando en este componente o globalmente, detener.
    if (movies.length > 0 || loading) return
    if (iptvGlobals.isCategoryLoading(category.category_id)) return
    
    // Si la data ya existe globalmente (otro componente la cargó), sincronizar.
    const globalData = iptvGlobals.getCategoryData(category.category_id)
    if (globalData) {
        setMovies(globalData)
        return
    }
 
    async function fetchMovies() {
      iptvGlobals.setCategoryLoading(category.category_id, true)
      setLoading(true)
      try {
        const baseUrl = getBaseUrl(activeAccount.portal_url)
        const url = `${baseUrl}/player_api.php?username=${activeAccount.username}&password=${activeAccount.password}&action=get_vod_streams&category_id=${category.category_id}`
        
        // fetchIptv ya maneja el bloqueo estricto (CALL_LOCK)
        const data = await fetchIptv(url)
        
        if (Array.isArray(data)) {
            const sorted = data.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
            iptvGlobals.setCategoryData(category.category_id, sorted)
            setMovies(sorted)
            setTimeout(() => onMoviesLoaded(category.category_id, sorted), 50)
        }
      } catch (err) {
        console.error(`🔴 [CatalogUI] Fetch error for category ${category.category_id}:`, err)
      } finally {
        iptvGlobals.setCategoryLoading(category.category_id, false)
        setLoading(false)
      }
    }
    fetchMovies()
  }, [activeAccount, category.category_id, movies.length, loading, onMoviesLoaded])

  if (movies.length === 0 && !loading) return null

  return (
    <VirtualRow>
      <div className="pl-4 sm:pl-8 min-h-[300px]">
        <h3 className="text-xl sm:text-2xl font-black text-white mb-4 sm:mb-6 tracking-tight drop-shadow-md uppercase">
          {category.category_name}
        </h3>
        <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pt-4 pb-6 mx-[-1rem] px-[1rem] sm:mx-0 sm:px-0 scroll-smooth">
          {loading ? (
            [...Array(6)].map((_, j) => (
              <div key={`skel-${category.category_id}-${j}`} className="shrink-0 w-36 sm:w-48 aspect-[2/3] bg-zinc-900/50 rounded-2xl animate-pulse" />
            ))
          ) : (
            movies.map((mov: any) => renderMovieCard(mov))
          )}
        </div>
      </div>
    </VirtualRow>
  )
}

const MemoizedCategoryRow = memo(CategoryRow);

export function CatalogUI() {
  const { activeAccount, categories } = useApp()
  const [moviesByCategoryId, setMoviesByCategoryId] = useState<Record<string, any[]>>({})
  const [searchQuery, setSearchQuery] = useState('')

  const handleMoviesLoaded = useCallback((catId: string, movies: any[]) => {
    setMoviesByCategoryId(prev => {
      if (prev[catId]) return prev 
      return { ...prev, [catId]: movies }
    })
  }, [])

  const updateSearch = useMemo(() => debounce((_q: string) => {}, 400), [])
  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    updateSearch(val)
  }

  const [selectedMovie, setSelectedMovie] = useState<any | null>(null)
  const [playingMovie, setPlayingMovie] = useState<any | null>(null)

  const filteredCategories = useMemo(() => {
    if (!categories) return []
    const banned = ['xxx', 'adult', '18+', 'porn', 'brazzer']
    return categories.filter(c => !banned.some(kw => c.category_name.toLowerCase().includes(kw)))
  }, [categories])

  const [visibleCount, setVisibleCount] = useState(8)

  useEffect(() => {
    // 🔙 Interceptor para cerrar el modal/jugador con el botón Atrás
    const cleanup = navigationBus.registerInterceptor(() => {
      if (playingMovie) {
        setPlayingMovie(null);
        return true;
      }
      if (selectedMovie) {
        setSelectedMovie(null);
        setTimeout(() => navigationBus.focus(), 100);
        return true;
      }
      return false;
    });
    return () => { cleanup(); };
  }, [selectedMovie, playingMovie]);

  useEffect(() => {
    if (selectedMovie) {
      setTimeout(() => navigationBus.focus(), 200);
    }
  }, [selectedMovie]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800) {
        setVisibleCount(prev => prev + 4)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const renderMovieCard = useCallback((mov: any) => (
    <div
      key={mov.stream_id}
      onClick={() => setSelectedMovie(mov)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click() }}
      role="button"
      tabIndex={0}
      className="nav-item relative rounded-2xl overflow-hidden shrink-0 w-36 sm:w-48 aspect-[2/3] transition-all bg-zinc-950 border border-transparent focus:scale-[1.08] focus:z-50 focus:border-[var(--color-rider-blue)] cursor-pointer"
    >
      {mov.stream_icon ? (
        <img src={mov.stream_icon} alt={mov.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-zinc-700 text-xs font-bold">{mov.name}</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-80" />
     </div>
  ), [])

  const heroMovie = useMemo(() => {
    const all = Object.values(moviesByCategoryId).flat()
    return all.length > 0 ? all[0] : null
  }, [moviesByCategoryId])

  return (
    <main className="relative min-h-screen pt-20">
      <div className="fixed top-0 w-full lg:w-[calc(100%-280px)] right-0 z-[60] bg-zinc-950/90 backdrop-blur-3xl border-b border-zinc-800/50 py-4 px-8 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Video className="w-6 h-6 text-[var(--color-rider-blue)]" />
            CATÁLOGO VOD
          </h2>
          <div className="relative w-[300px]">
            <input
              type="search"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="nav-item w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 px-4 text-sm text-white"
            />
          </div>
      </div>

      <section className="relative z-10 w-full pb-32 space-y-12">
        {heroMovie && activeAccount && (
          <HeroBanner movie={heroMovie} account={activeAccount} overridePlay={() => setSelectedMovie(heroMovie)} />
        )}
        
        {filteredCategories.slice(0, visibleCount).map((cat: any) => (
          <MemoizedCategoryRow
            key={cat.category_id}
            category={cat}
            activeAccount={activeAccount}
            renderMovieCard={renderMovieCard}
            onMoviesLoaded={handleMoviesLoaded}
          />
        ))}
      </section>

      {selectedMovie && (
         <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setSelectedMovie(null)}>
           <div className="bg-zinc-950 w-full h-full lg:rounded-3xl overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedMovie(null)} className="absolute top-6 right-6 z-[110] p-3 text-white">
                <X className="w-8 h-8" />
              </button>
              <div className="flex-1 flex flex-col items-center justify-center">
                {playingMovie ? (
                  <VideoPlayer
                    streamUrl={`${activeAccount?.portal_url.replace(/\/$/, '')}/movie/${activeAccount?.username}/${activeAccount?.password}/${playingMovie.stream_id}.${playingMovie.container_extension || 'mp4'}`}
                    onClose={() => setPlayingMovie(null)}
                  />
                ) : (
                  <div className="text-center space-y-8">
                     <h2 className="text-4xl font-black text-white">{selectedMovie.name}</h2>
                     <button onClick={() => setPlayingMovie(selectedMovie)} className="px-12 py-6 bg-white text-black font-black rounded-2xl text-xl hover:scale-110 transition-transform">
                        REPRODUCIR AHORA
                     </button>
                  </div>
                )}
              </div>
           </div>
         </div>
      )}
    </main>
  )
}
