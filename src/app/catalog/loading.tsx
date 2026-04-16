export default function CatalogLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-32 overflow-x-hidden">
      {/* Hero Banner Skeleton */}
      <div className="relative w-full h-[85vh] min-h-[600px] flex items-end bg-zinc-900 border-b border-zinc-900 overflow-hidden">
        {/* Glow animado de fondo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800/20 to-zinc-900 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10" />
        
        <div className="relative z-20 w-full px-4 sm:px-8 max-w-[1400px] mx-auto pb-32">
          {/* Título */}
          <div className="h-16 sm:h-24 md:h-28 w-4/5 max-w-2xl bg-zinc-800/80 rounded-2xl animate-pulse mb-6 drop-shadow-md"></div>
          {/* Rating */}
          <div className="h-6 w-24 bg-zinc-800/80 rounded-md animate-pulse mb-8"></div>
          
          {/* Botones */}
          <div className="flex gap-4">
             <div className="h-14 w-44 bg-zinc-800/90 rounded-xl animate-pulse border border-white/5"></div>
             <div className="h-14 w-52 bg-zinc-800/60 rounded-xl animate-pulse border border-white/5"></div>
          </div>
        </div>
      </div>
      
      {/* Carruseles (Sensoriales) Skeleton */}
      <div className="pl-4 sm:pl-8 mt-[-6rem] sm:mt-[-8rem] relative z-20">
         <div className="h-8 w-72 bg-zinc-800/80 rounded-lg animate-pulse mb-6"></div>
         <div className="flex gap-4 sm:gap-6 overflow-hidden pb-10 pt-4">
           {[...Array(8)].map((_, i) => (
             <div 
                key={i} 
                className="min-w-[150px] w-[150px] sm:min-w-[180px] sm:w-[180px] md:min-w-[220px] md:w-[220px] aspect-[2/3] bg-zinc-800 rounded-xl animate-pulse shrink-0 border border-white/5"
                style={{ animationDelay: `${i * 100}ms` }}
              ></div>
           ))}
         </div>
      </div>
    </div>
  )
}
