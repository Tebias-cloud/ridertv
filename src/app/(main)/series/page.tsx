import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SeriesUI } from '@/components/ui/SeriesUI'

export const dynamic = 'force-dynamic'

async function getSeriesCategories(account: any) {
  if (!account || account.status !== 'active') return []
  
  const cleanPortalUrl = account.portal_url.endsWith('/') ? account.portal_url.slice(0, -1) : account.portal_url;
  const categoriesUrl = `${cleanPortalUrl}/player_api.php?username=${account.username}&password=${account.password}&action=get_series_categories`
  
  try {
    const res = await fetch(categoriesUrl, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    let categories = await res.json()
    
    if (Array.isArray(categories)) {
      // 1. Deduplicación
      const uniqueArray = Array.from(new Map(categories.map((item: any) => [item.category_id, item])).values())
      
      // 2. Filtro SFW Estricto
      const bannedKeywords = ['xxx', 'adult', '18+', 'porn', 'brazzer', 'playboy', 'hustler', 'bangbros', 'venus']
      const safeCategories = uniqueArray.filter((cat: any) => {
        const catName = (cat.category_name || '').toLowerCase()
        return !bannedKeywords.some(keyword => catName.includes(keyword))
      });

      return safeCategories;
    }
    return []
  } catch (error) {
    console.error("Series Categories Fetch Error:", error)
    return []
  }
}

export default async function SeriesPage() {
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
  const activeAccount = validAccounts.find(a => a.status === 'active') || validAccounts[0]

  if (!activeAccount) {
    return (
       <div className="relative w-full h-[60vh] flex flex-col items-center justify-center text-white">
         <p className="text-zinc-500 font-medium">No se detectó un Pase Digital activo para Series.</p>
       </div>
    )
  }

  const categories = await getSeriesCategories(activeAccount)

  return (
    <div className="relative text-white overflow-hidden min-h-screen">
      <SeriesUI categories={categories} account={activeAccount} />
    </div>
  )
}
