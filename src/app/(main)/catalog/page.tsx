import { HeroBanner } from '@/components/ui/HeroBanner'
import { MovieCard } from '@/components/ui/MovieCard'
import { Logo } from '@/components/ui/Logo'
import { IptvCard } from '@/components/ui/IptvCard'
import { CatalogUI } from '@/components/ui/CatalogUI'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getCategoriesAndHero(account: any) {
  if (!account || account.status !== 'active') return { categories: [], heroStream: null }
  
  const cleanPortalUrl = account.portal_url.endsWith('/') ? account.portal_url.slice(0, -1) : account.portal_url;
  const categoriesUrl = `${cleanPortalUrl}/player_api.php?username=${account.username}&password=${account.password}&action=get_vod_categories`
  
  try {
    const res = await fetch(categoriesUrl, { next: { revalidate: 3600 } })
    if (!res.ok) return { categories: [], heroStream: null }
    let categories: any[] = []
    try {
       const text = await res.text()
       categories = JSON.parse(text)
    } catch {
       console.error("Categories API JSON Parse Error")
       return { categories: [], heroStream: null }
    }
    
    if (Array.isArray(categories)) {
      // 1. Deduplicación
      const uniqueCategories = Array.from(new Map(categories.map((item: any) => [item.category_id, item])).values())
      
      // 2. Fetch de Hero Aleatorio SFW
      const bannedKeywords = ['xxx', 'porn', 'adult', '18+', 'brazzers', 'bangbros', 'venus', 'playboy'];
      const safeCategories = uniqueCategories.filter((cat: any) => {
        const catName = (cat.category_name || '').toLowerCase();
        return !bannedKeywords.some(keyword => catName.includes(keyword));
      });

      let heroStream = null;
      if (safeCategories.length > 0) {
        // Buscar categoría "estrenos", "nuevos", "202", "accion"
        const heroCat = safeCategories.find((c: any) => {
           const name = (c.category_name || '').toLowerCase();
           return name.includes('estreno') || name.includes('nuevo') || name.includes('accion') || name.includes('202')
        }) || safeCategories[0];

        const streamsUrl = `${cleanPortalUrl}/player_api.php?username=${account.username}&password=${account.password}&action=get_vod_streams&category_id=${heroCat.category_id}`;
        const streamsRes = await fetch(streamsUrl, { next: { revalidate: 3600 } });
        
        if (streamsRes.ok) {
           const text = await streamsRes.text();
           try {
              const rawStreams = JSON.parse(text);
              if (Array.isArray(rawStreams) && rawStreams.length > 0) {
                 const sfwStreams = rawStreams.filter((stream: any) => {
                    const streamName = (stream.name || '').toLowerCase();
                    return !bannedKeywords.some(keyword => streamName.includes(keyword));
                 });
                 
                 if (sfwStreams.length > 0) {
                    heroStream = sfwStreams[Math.floor(Math.random() * Math.min(20, sfwStreams.length))];
                 }
              }
           } catch {
              console.error("Hero Banner API JSON Parse Error");
           }
        }
      }

      return { categories: uniqueCategories, heroStream };
    }
    return { categories: [], heroStream: null }
  } catch (error) {
    console.error("Fetch Data Error:", error)
    return { categories: [], heroStream: null }
  }
}

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: accounts } = await supabase
    .from('external_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const validAccounts = accounts || []

  // 1. Manejo del Empty State Inmersivo
  if (validAccounts.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 w-full relative overflow-hidden">
         {/* Decorative Background Elements */}
         <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-[var(--color-rider-blue)]/5 to-transparent blur-3xl pointer-events-none" />
         
         <div className="relative z-10 flex flex-col items-center">
             <div className="mb-8 opacity-90 drop-shadow-2xl">
                <svg className="w-28 h-28 text-zinc-500 drop-shadow-xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
             </div>
             <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight drop-shadow-md">
               No hay servicios activos
             </h1>
             <p className="text-zinc-400 max-w-lg mx-auto mb-10 text-lg leading-relaxed">
               Tu cuenta no cuenta actualmente con un pase digital habilitado. Contacta a soporte para adquirir o renovar tu suscripción VIP y disfrutar del contenido ilimitado.
             </p>
             <Link href="mailto:soporte@rideriptv.com">
                 <button className="px-10 py-4 cursor-pointer bg-white text-zinc-950 hover:bg-zinc-200 transition-all hover:scale-105 rounded-full font-bold shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center gap-2">
                   Contactar Soporte
                 </button>
             </Link>
         </div>
      </div>
    )
  }

  // Obtenemos la cuenta activa
  const activeAccount = validAccounts.find(a => a.status === 'active') || validAccounts[0]
  
  // 2. Traer Categorías (Grilla Principal) y Hero
  const { categories, heroStream } = await getCategoriesAndHero(activeAccount)

  return (
    <div className="relative text-white overflow-hidden pb-32">
      <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-transparent pt-6 pb-12 px-4 sm:px-8 pointer-events-none">
        <div className="pointer-events-auto">
          {/* Ocultamos el logo original ya que el Sidebar lo tiene, o lo mantenemos minimizado para mobile */}
          <div className="md:hidden">
            <Logo />
          </div>
        </div>
      </header>
      
      <CatalogUI categories={categories} heroMovie={heroStream} validAccounts={validAccounts} activeAccount={activeAccount} />
    </div>
  )
}
