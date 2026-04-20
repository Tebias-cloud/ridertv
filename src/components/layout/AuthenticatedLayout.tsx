"use client"

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [activeAccount, setActiveAccount] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/'
        return
      }

      const { data: accounts } = await supabase
        .from('external_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const validAccounts = accounts || []
      const acc = validAccounts.find(a => a.status === 'active') || validAccounts[0]
      setActiveAccount(acc)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-extrabold uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-blue-500 animate-pulse">
            Rider TV
        </h1>
        <div className="spinner" />
        <p className="text-zinc-500 text-sm font-medium animate-pulse">Autenticando acceso maestro...</p>
      </div>
    )
  }

  return (
    <AppLayout account={activeAccount}>
      {children}
    </AppLayout>
  )
}
