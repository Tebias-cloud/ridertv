"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LiveUI } from '@/components/ui/LiveUI'

async function getLiveCategories(account: any) {
  if (!account || account.status !== 'active') return []
  
  try {
    const url = `${(account.portal_url.endsWith('/') ? account.portal_url.slice(0, -1) : account.portal_url)}/player_api.php?username=${account.username}&password=${account.password}&action=get_live_categories`
    
    const res = await fetch(url, { 
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!res.ok) return []
    
    const categories = await res.json()
    
    if (!Array.isArray(categories)) return []

    const banned = ['xxx', 'adult', '18+', 'porn', 'brazzer', 'playboy', 'hustler', 'bangbros', 'venus']
    const unique = Array.from(new Map(categories.map((c: any) => [c.category_id, c])).values())
    return unique.filter((cat: any) => {
      const name = (cat.category_name || '').toLowerCase()
      return !banned.some(kw => name.includes(kw))
    })
  } catch (error) {
    console.error('[LivePage] Error fetching live categories:', error)
    return []
  }
}

export default function LivePage() {
  const router = useRouter()
  const [state, setState] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: accounts } = await supabase
        .from('external_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const validAccounts = accounts || []
      const activeAccount = validAccounts.find((a: any) => a.status === 'active') || validAccounts[0]

      if (!activeAccount) {
        setState({ noAccounts: true })
        return
      }

      const categories = await getLiveCategories(activeAccount)
      setState({ noAccounts: false, activeAccount, categories })
    }
    load()
  }, [router])

  if (!state) return <div className="min-h-screen bg-black" />

  if (state.noAccounts) {
    return (
       <div className="relative w-full h-[60vh] flex flex-col items-center justify-center">
         <p className="text-zinc-500 font-medium">No se detectó un Pase Digital activo para Live TV.</p>
       </div>
    )
  }

  return (
    <div className="relative text-white overflow-hidden min-h-screen">
      <LiveUI categories={state.categories} account={state.activeAccount} />
    </div>
  )
}
