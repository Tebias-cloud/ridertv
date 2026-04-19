import { useState, useMemo, useEffect, memo, useCallback } from 'react'
import debounce from 'lodash/debounce'
import { Tv, Heart } from 'lucide-react'
import { VideoPlayer } from '@/components/ui/VideoPlayer'
import { useFavorites } from '../../hooks/useFavorites'
import { VirtualRow } from '@/components/ui/VirtualRow'
import { fetchIptv, getBaseUrl, iptvGlobals } from '@/lib/iptv'
import { useApp } from '@/components/layout/AuthenticatedLayout'
import { navigationBus } from '../layout/SpatialNavProvider'

// ==========================
// COMPONENTE: LIVE CATEGORY ROW (Omega Stabilization)
// ==========================
function CategoryRow({ category, activeAccount, onChannelsLoaded, onSelectStream }: {
  category: any,
  activeAccount: any,
  onChannelsLoaded: (catId: string, channels: any[]) => void,
  onSelectStream: (stream: any) => void
}) {
  const catKey = `live_${category.category_id}`
  const [channels, setChannels] = useState<any[]>(() => iptvGlobals.getCategoryData(catKey) || [])
  const [loading, setLoading] = useState(() => iptvGlobals.isCategoryLoading(catKey))
  // Removing redundant inner IntersectionObserver. Replaced by VirtualRow mount trigger.

  useEffect(() => {
    if (channels.length > 0 || loading) return
    if (iptvGlobals.isCategoryLoading(catKey)) return
    
    const globalData = iptvGlobals.getCategoryData(catKey)
    if (globalData) {
      setChannels(globalData)
      return
    }
 
    async function fetchChannels() {
      iptvGlobals.setCategoryLoading(catKey, true)
      setLoading(true)
      try {
        const baseUrl = getBaseUrl(activeAccount.portal_url)
        const url = `${baseUrl}/player_api.php?username=${activeAccount.username}&password=${activeAccount.password}&action=get_live_streams&category_id=${category.category_id}`
        const data = await fetchIptv(url)
        if (Array.isArray(data)) {
          iptvGlobals.setCategoryData(catKey, data)
          setChannels(data)
          setTimeout(() => onChannelsLoaded(category.category_id, data), 50)
        }
      } catch (err) {
        console.error("🔴 [LiveUI] Fetch error:", err)
      } finally {
        iptvGlobals.setCategoryLoading(catKey, false)
        setLoading(false)
      }
    }
    fetchChannels()
  }, [activeAccount, category.category_id, channels.length, loading, onChannelsLoaded, catKey])

  if (channels.length === 0 && !loading) return null

  return (
    <VirtualRow>
      <div className="pl-4 sm:pl-8 min-h-[180px]">
        <h3 className="text-lg font-bold text-zinc-400 mb-4 tracking-wider uppercase flex items-center gap-2">
           <span className="w-2 h-2 bg-[var(--color-rider-blue)] rounded-full animate-pulse" />
           {category.category_name}
        </h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-6 mx-[-1rem] px-[1rem] sm:mx-0 sm:px-0 scroll-smooth">
          {loading ? (
             [...Array(6)].map((_, j) => (
              <div key={`live-skel-${category.category_id}-${j}`} className="shrink-0 w-48 sm:w-64 h-28 bg-zinc-900/50 rounded-xl animate-pulse" />
            ))
          ) : (
            channels.map((ch: any) => (
              <div
                key={ch.stream_id}
                onClick={() => onSelectStream(ch)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click() }}
                role="button"
                tabIndex={0}
                className="nav-item shrink-0 w-48 sm:w-64 h-28 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative group hover:border-[var(--color-rider-blue)] focus:scale-[1.05] transition-all outline-none cursor-pointer"
              >
                <div className="absolute inset-0 flex items-center p-4 gap-4">
                  {ch.stream_icon ? (
                    <img src={ch.stream_icon} className="w-12 h-12 object-contain" onError={(e) => { e.currentTarget.src = ''; e.currentTarget.className = "hidden" }} />
                  ) : (
                    <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center text-zinc-500 font-bold text-lg">{ch.name?.charAt(0)}</div>
                  )}
                  <span className="text-sm font-bold text-white line-clamp-2 leading-tight">{ch.name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </VirtualRow>
  )
}

const MemoizedCategoryRow = memo(CategoryRow);

export function LiveUI() {
  const { activeAccount, categories } = useApp()
  const { toggleFavorite, isFavorite } = useFavorites('live')

  const [searchQuery, setSearchQuery] = useState('')
  const [, setChannelsByCategoryId] = useState<Record<string, any[]>>({})
  const [selectedStream, setSelectedStream] = useState<any | null>(null)

  const handleChannelsLoaded = useCallback((catId: string, channels: any[]) => {
    setChannelsByCategoryId(prev => {
      if (prev[catId]) return prev 
      return { ...prev, [catId]: channels }
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

  const [visibleCount, setVisibleCount] = useState(10)

  useEffect(() => {
    // 🔙 Interceptor para cerrar el reproductor con el botón Atrás
    const cleanup = navigationBus.registerInterceptor(() => {
      if (selectedStream) {
        setSelectedStream(null);
        setTimeout(() => navigationBus.focus(), 100);
        return true;
      }
      return false;
    });
    return () => { cleanup(); };
  }, [selectedStream]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800) {
        setVisibleCount(prev => prev + 5)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="relative min-h-screen pt-24 pb-32">
       <div className="fixed top-0 w-full lg:w-[calc(100%-280px)] right-0 z-[60] bg-zinc-950/90 backdrop-blur-3xl border-b border-zinc-800/50 py-4 px-8 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white uppercase flex items-center gap-3">
             <Tv className="w-6 h-6 text-[var(--color-rider-blue)]" />
             TV EN VIVO
          </h2>
          <div className="relative w-[300px]">
             <input
               type="search"
               placeholder="Buscar canal..."
               value={searchQuery}
               onChange={(e) => handleSearchChange(e.target.value)}
               className="nav-item w-full bg-zinc-900 border border-zinc-800 rounded-full py-2.5 px-4 text-sm text-white focus:outline-none focus:border-[var(--color-rider-blue)]"
             />
          </div>
       </div>

       <div className="space-y-12">
          {filteredCategories.slice(0, visibleCount).map(cat => (
              <MemoizedCategoryRow
                key={cat.category_id}
                category={cat}
                activeAccount={activeAccount}
                onChannelsLoaded={handleChannelsLoaded}
                onSelectStream={setSelectedStream}
              />
            ))}
       </div>

       {selectedStream && (
          <div className="fixed inset-0 z-[100] bg-black">
             <VideoPlayer
               isLive={true}
               streamUrl={`${activeAccount?.portal_url.replace(/\/$/, '')}/live/${activeAccount?.username}/${activeAccount?.password}/${selectedStream.stream_id}.ts`}
               onClose={() => setSelectedStream(null)}
               logoUrl={selectedStream.stream_icon}
             />
             <button
               onClick={() => toggleFavorite({ id: selectedStream.stream_id, type: 'live', data: selectedStream })}
               className="absolute top-6 right-20 z-[110] p-4 bg-black/50 rounded-full hover:bg-white/20 transition-all outline-none"
             >
               <Heart className={`w-8 h-8 ${isFavorite(selectedStream.stream_id, 'live') ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
             </button>
          </div>
       )}
    </main>
  )
}
