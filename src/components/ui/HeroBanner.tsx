"use client"
import { useRouter } from 'next/navigation'

export function HeroBanner({ movie, account, overridePlay }: { movie: any, account: any, overridePlay?: () => void }) {
  const router = useRouter()
  
  const handlePlay = () => {
    if (overridePlay) {
      overridePlay()
      return
    }
    localStorage.setItem('iptv_username', account.username)
    localStorage.setItem('iptv_password', account.password)
    localStorage.setItem('iptv_portal_url', account.portal_url)
    router.push('/player')
  }

  const imageUrl = movie.stream_icon ? movie.stream_icon : ''
  const title = movie.name || 'Premium Stream'

  return (
    <div className="relative w-full h-[85vh] min-h-[600px] flex items-end">
      {/* Absolute Image Layer */}
      <div className="absolute inset-0 w-full h-full bg-zinc-950">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover object-top opacity-80"
            loading="eager"
          />
        )}
      </div>

      {/* Hero Gradients 2026 Style */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 w-full px-4 sm:px-8 max-w-[1400px] mx-auto pb-32">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white max-w-4xl drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)] tracking-tight leading-none">
          {title}
        </h1>
        {movie.rating && movie.rating !== "0" && movie.rating !== "0.0" && (
          <div className="flex items-center gap-3 mt-6">
             <span className="text-emerald-400 font-bold border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 rounded text-sm tracking-widest backdrop-blur-sm">
               ★ {movie.rating}
             </span>
          </div>
        )}
        
        <div className="mt-8 flex flex-wrap gap-4">
          <button 
            onClick={handlePlay}
            className="flex items-center px-8 py-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded-xl transition-all hover:scale-105 border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.15)] focus:ring-4 focus:ring-white/30 outline-none"
          >
            <svg className="w-7 h-7 mr-2 fill-white" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Reproducir
          </button>
          
          <button 
             onClick={() => { if (overridePlay) overridePlay() }}
             className="flex items-center px-8 py-3.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-zinc-100 font-bold rounded-xl transition-all hover:scale-105 border border-white/10 shadow-lg focus:ring-4 focus:ring-white/20 outline-none">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Más información
          </button>
        </div>
      </div>
    </div>
  )
}
