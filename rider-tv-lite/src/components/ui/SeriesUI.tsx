import { useState, useMemo, useEffect, memo, useCallback } from 'react'
import debounce from 'lodash/debounce'
import { Tv, Play, X, Heart } from 'lucide-react'
import { useFavorites } from '../../hooks/useFavorites'
import { VirtualRow } from '@/components/ui/VirtualRow'
import { fetchIptv, getBaseUrl, iptvGlobals } from '@/lib/iptv'
import { useApp } from '@/components/layout/AuthenticatedLayout'
import { navigationBus } from '../layout/SpatialNavProvider'

// ==========================
// COMPONENTE: SERIES CATEGORY ROW (Omega Stabilization)
// ==========================
function CategoryRow({ category, activeAccount, onSeriesLoaded, onSelectSeries }: {
  category: any,
  activeAccount: any,
  onSeriesLoaded: (catId: string, series: any[]) => void,
  onSelectSeries: (series: any) => void
}) {
  const catKey = `series_${category.category_id}`
  const [seriesList, setSeriesList] = useState<any[]>(() => iptvGlobals.getCategoryData(catKey) || [])
  const [loading, setLoading] = useState(() => iptvGlobals.isCategoryLoading(catKey))
  // Removing redundant inner IntersectionObserver. Replaced by VirtualRow mount trigger.

  useEffect(() => {
    if (seriesList.length > 0 || loading) return
    if (iptvGlobals.isCategoryLoading(catKey)) return
    
    const globalData = iptvGlobals.getCategoryData(catKey)
    if (globalData) {
      setSeriesList(globalData)
      return
    }
 
    async function fetchSeries() {
      iptvGlobals.setCategoryLoading(catKey, true)
      setLoading(true)
      try {
        const baseUrl = getBaseUrl(activeAccount.portal_url)
        const url = `${baseUrl}/player_api.php?username=${activeAccount.username}&password=${activeAccount.password}&action=get_series&category_id=${category.category_id}`
        const data = await fetchIptv(url)
        if (Array.isArray(data)) {
          iptvGlobals.setCategoryData(catKey, data)
          setSeriesList(data)
          setTimeout(() => onSeriesLoaded(category.category_id, data), 50)
        }
      } catch (err) {
        console.error("🔴 [SeriesUI] Fetch error:", err)
      } finally {
        iptvGlobals.setCategoryLoading(catKey, false)
        setLoading(false)
      }
    }
    fetchSeries()
  }, [activeAccount, category.category_id, seriesList.length, loading, onSeriesLoaded, catKey])

  if (seriesList.length === 0 && !loading) return null

  return (
    <VirtualRow>
      <div className="pl-4 sm:pl-8 min-h-[300px]">
        <h3 className="text-xl sm:text-2xl font-black text-white mb-6 tracking-tight drop-shadow-md uppercase flex items-center gap-3">
           <Play className="w-6 h-6 text-[var(--color-rider-blue)] fill-[var(--color-rider-blue)]" />
           {category.category_name}
        </h3>
        <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pb-8 mx-[-1rem] px-[1rem] sm:mx-0 sm:px-0 scroll-smooth">
          {loading ? (
             [...Array(5)].map((_, j) => (
              <div key={`series-skel-${category.category_id}-${j}`} className="shrink-0 w-36 sm:w-48 aspect-[2/3] bg-zinc-900/50 rounded-2xl animate-pulse" />
            ))
          ) : (
            seriesList.map((ser: any) => (
              <div
                key={ser.series_id}
                onClick={() => onSelectSeries(ser)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click() }}
                role="button"
                tabIndex={0}
                className="nav-item relative rounded-2xl overflow-hidden shrink-0 w-36 sm:w-48 aspect-[2/3] transition-all bg-zinc-950 border border-transparent focus:scale-110 focus:z-50 focus:border-[var(--color-rider-blue)] cursor-pointer"
              >
                {ser.cover ? (
                  <img src={ser.cover} alt={ser.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-zinc-700 font-bold uppercase">{ser.name}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-80" />
              </div>
            ))
          )}
        </div>
      </div>
    </VirtualRow>
  )
}

const MemoizedCategoryRow = memo(CategoryRow);

export function SeriesUI() {
  const { activeAccount, categories } = useApp()
  const { toggleFavorite, isFavorite } = useFavorites('series')

  const [searchQuery, setSearchQuery] = useState('')
  const [, setSeriesByCategoryId] = useState<Record<string, any[]>>({})
  const [selectedSeries, setSelectedSeries] = useState<any | null>(null)

  const handleSeriesLoaded = useCallback((catId: string, series: any[]) => {
    setSeriesByCategoryId(prev => {
      if (prev[catId]) return prev 
      return { ...prev, [catId]: series }
    })
  }, [])

  const updateSearch = useMemo(() => debounce((_q: string) => {}, 400), [])
  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    updateSearch(val)
  }

  const filteredCategories = useMemo(() => {
    const banned = ['xxx', 'adult', '18+', 'porn']
    return (categories || []).filter(c => !banned.some(kw => c.category_name.toLowerCase().includes(kw)))
  }, [categories])

  const [visibleCount, setVisibleCount] = useState(8)

  useEffect(() => {
    // 🔙 Interceptor para cerrar el detalle de serie con el botón Atrás
    const cleanup = navigationBus.registerInterceptor(() => {
      if (selectedSeries) {
        setSelectedSeries(null);
        setTimeout(() => navigationBus.focus(), 100);
        return true;
      }
      return false;
    });
    return () => { cleanup(); };
  }, [selectedSeries]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800) {
        setVisibleCount(prev => prev + 4)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="relative min-h-screen pt-24 pb-32">
       <div className="fixed top-0 w-full lg:w-[calc(100%-280px)] right-0 z-[60] bg-zinc-950/90 backdrop-blur-3xl border-b border-zinc-800/50 py-4 px-8 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-3">
             <Tv className="w-6 h-6 text-[var(--color-rider-blue)]" />
             SERIES TV
          </h2>
          <div className="relative w-[300px]">
             <input
               type="search"
               placeholder="Buscar serie..."
               value={searchQuery}
               onChange={(e) => handleSearchChange(e.target.value)}
               className="nav-item w-full bg-zinc-900 border border-zinc-800 rounded-full py-2.5 px-4 text-sm text-white focus:outline-none focus:border-[var(--color-rider-blue)]"
             />
          </div>
       </div>

       <div className="space-y-16">
          {filteredCategories.slice(0, visibleCount).map(cat => (
              <MemoizedCategoryRow
                key={cat.category_id}
                category={cat}
                activeAccount={activeAccount}
                onSeriesLoaded={handleSeriesLoaded}
                onSelectSeries={setSelectedSeries}
              />
            ))}
       </div>

       {selectedSeries && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-10" onClick={() => setSelectedSeries(null)}>
             <div className="bg-zinc-950 max-w-4xl w-full rounded-3xl overflow-hidden relative border border-zinc-800 shadow-2xl" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedSeries(null)} className="absolute top-6 right-6 z-[110] p-3 text-white">
                   <X className="w-8 h-8" />
                </button>
                <div className="flex flex-col md:flex-row p-8 gap-8">
                   <div className="w-64 shrink-0 rounded-2xl overflow-hidden">
                      <img src={selectedSeries.cover} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 space-y-6">
                      <h2 className="text-4xl font-black text-white uppercase">{selectedSeries.name}</h2>
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-[var(--color-rider-blue)]/20 text-[var(--color-rider-blue)] rounded-lg text-sm font-black tracking-widest">{selectedSeries.rating || 'N/A'} RATING</span>
                        <span className="text-zinc-500 font-bold tracking-widest uppercase">{selectedSeries.releaseDate || 'TV Series'}</span>
                      </div>
                      <p className="text-zinc-400 leading-relaxed text-lg line-clamp-4">{selectedSeries.plot || 'Cargando información de la serie...'}</p>
                      
                      <div className="pt-6 flex gap-4">
                         <button className="px-8 py-4 bg-white text-black font-black rounded-xl hover:scale-105 transition-all">REPRODUCIR</button>
                         <button 
                            onClick={() => toggleFavorite({ id: selectedSeries.series_id, type: 'series', data: selectedSeries })}
                            className="p-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-all border border-zinc-800"
                         >
                            <Heart className={`w-6 h-6 ${isFavorite(selectedSeries.series_id, 'series') ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       )}
    </main>
  )
}
