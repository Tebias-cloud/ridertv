"use client"

import { useState, useEffect } from 'react'
import { getAllProfilesAction } from '@/actions/admin'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AdminClientPanel from './AdminClientPanel'

export default function AdminPage() {
  const router = useRouter()
  const [data, setData] = useState<{ user: any, profiles: any[] } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/catalog')
        return
      }

      const res = await getAllProfilesAction()
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setData({ user, profiles: res.profiles || [] })
      }
    }
    load()
  }, [router])

  if (!data && !errorMsg) {
    return <div className="p-8 text-white opacity-50">Autenticando panel maestro...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">
          Panel de Control Maestro
        </h1>
        <div className="bg-[var(--color-rider-blue)]/20 text-[var(--color-rider-blue)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-[var(--color-rider-blue)]/30">
          Admin
        </div>
      </div>
      
      {errorMsg ? (
        <div className="bg-red-500/20 text-red-500 p-4 rounded-xl border border-red-500/50">
           Error cargando perfiles: {errorMsg}
        </div>
      ) : (
        <AdminClientPanel initialProfiles={data!.profiles} currentUserId={data!.user.id} />
      )}
    </div>
  )
}
