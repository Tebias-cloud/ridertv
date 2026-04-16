"use client"

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // const pathname = usePathname()
  const [activeAccount, setActiveAccount] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      // Fetch the active account to load into the Sidebar globally
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
    return <div className="min-h-screen bg-zinc-950" />
  }

  return (
    <AppLayout account={activeAccount}>
      {children}
    </AppLayout>
  )
}
