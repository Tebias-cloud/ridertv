import { useNavigate } from 'react-router-dom'

const upgradeToHttps = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://')) return url.replace('http://', 'https://');
  return url;
};

export function MovieCard({ movie, account }: { movie: any, account: any }) {
  const navigate = useNavigate()

  const handlePlay = () => {
    localStorage.setItem('iptv_username', account.username)
    localStorage.setItem('iptv_password', account.password)
    localStorage.setItem('iptv_portal_url', account.portal_url)
    navigate('/player')
  }

  return (
    <div 
      onClick={handlePlay}
      className="nav-item group relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 transition-all duration-300 hover:scale-105 hover:z-20 hover:border hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] cursor-pointer outline-none focus:scale-105 focus:border-white/30 focus:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
      tabIndex={0}
      role="button"
    >
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus:opacity-100" />
      
      <div className="relative aspect-[2/3] overflow-hidden">
        {movie.stream_icon ? (
          <img 
            src={upgradeToHttps(movie.stream_icon)} 
            alt={movie.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-focus:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Poster'
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800">
            <span className="text-zinc-500 text-xs font-bold uppercase text-center px-4 leading-relaxed tracking-wider">{movie.name}</span>
          </div>
        )}
      </div>

      {/* Play Button Overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 scale-50 transition-all duration-300 delay-75 group-hover:opacity-100 group-hover:scale-100 group-focus:opacity-100 group-focus:scale-100">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-xl">
          <svg className="w-7 h-7 text-white ml-1.5" viewBox="0 0 24 24" fill="currentColor">
             <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 p-5 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100 bg-gradient-to-t from-zinc-950 to-transparent">
        <h3 className="text-sm font-bold text-white line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">{movie.name}</h3>
      </div>
    </div>
  )
}
