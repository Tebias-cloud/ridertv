"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { Home, Tv, Film, Clapperboard, User, LogOut, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getUserRoleAction } from '@/actions/admin'

export const Sidebar = React.memo(function Sidebar({ account }: { account?: any }) {
  const pathname = usePathname()
  const [isAccountModalOpen, setAccountModalOpen] = useState(false)
  const [localUser, setLocalUser] = useState<string>('Usuario')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isNative, setIsNative] = useState(true) // assume native until confirmed

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user?.email) {
        setLocalUser(data.user.email.replace('@rider.com', ''))
        
        // Role check via Auth Metadata (fast & static-compatible)
        const role = data.user.user_metadata?.role
        if (role === 'admin') setIsAdmin(true)
      }
    })

    // Check platform
    import('@capacitor/core').then(m => {
      setIsNative(m.Capacitor.isNativePlatform())
    })
  }, [])

  const links = [
    { name: 'Inicio / Descubrir', href: '/catalog', icon: Home },
    { name: 'TV en Vivo', href: '/live', icon: Tv },
    { name: 'Películas (VOD)', href: '/catalog', icon: Film },
    { name: 'Series', href: '/series', icon: Clapperboard },
  ]

  // Add Admin if web and authorized
  if (isAdmin && !isNative) {
    links.push({ name: 'Admin Panel', href: '/admin', icon: ShieldCheck })
  }

  // Convert TIMESTAMP to Date safely
  let accountExpDate = 'No disponible'
  if (account?.expires_at) {
    const isTimestamp = !isNaN(Number(account.expires_at))
    const dateValue = isTimestamp ? Number(account.expires_at) * 1000 : account.expires_at
    
    try {
      accountExpDate = new Intl.DateTimeFormat('es-CL', {
        day: '2-digit', month: 'long', year: 'numeric'
      }).format(new Date(dateValue))
    } catch(e) {
      accountExpDate = '-'
    }
  }

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-[260px] bg-zinc-950/80 backdrop-blur-3xl border-r border-white/5 flex flex-col py-8 px-6 z-50 transform-gpu will-change-transform">
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl tracking-[0.1em] font-extrabold uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-blue-500 drop-shadow-lg">
            RIDER TV
          </h2>
        </div>

        <nav className="flex-1 space-y-3">
          {links.map(link => {
            const isActive = pathname === link.href || pathname.startsWith(link.href) && link.href !== '/catalog'
            return (
              <Link 
                key={link.name} 
                href={link.href} 
                prefetch={false}
                className={`sidebar-item flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out transform-gpu outline-none ${isActive ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-[1.02]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 focus:bg-white/10 focus:text-white'}`}
              >
                <link.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[var(--color-rider-blue)]' : 'group-focus:text-[var(--color-rider-blue)]'}`} />
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 border-t border-white/5 pt-6 space-y-2">
           <button 
             onClick={() => setAccountModalOpen(true)}
             className="sidebar-item w-full flex items-center gap-4 px-4 py-3 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 focus:bg-white/10 focus:text-white transition-all duration-300 font-medium group outline-none"
           >
             <User className="w-5 h-5 group-hover:text-[var(--color-rider-blue)] group-focus:text-[var(--color-rider-blue)] transition-colors" />
             Mi Cuenta
           </button>
           <button 
             onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                localStorage.clear()
                window.location.href = '/'
             }}
             className="sidebar-item w-full flex items-center gap-4 px-4 py-3 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10 focus:bg-red-500/20 focus:text-red-500 transition-all duration-300 font-medium group outline-none"
           >
             <LogOut className="w-5 h-5 group-hover:text-red-500 group-focus:text-red-500 transition-colors" />
             Cerrar Sesión
           </button>
        </div>
      </aside>

      {/* Account Modal (Glassmorphism) */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-lg p-4 animate-in fade-in duration-300" onClick={() => setAccountModalOpen(false)}>
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-[400px] w-full shadow-[0_0_60px_rgba(0,0,0,0.8)] relative transform transition-transform" onClick={e => e.stopPropagation()}>
            <button className="absolute top-6 right-6 text-zinc-600 hover:text-white" onClick={() => setAccountModalOpen(false)}>✕</button>
            
            <div className="text-center mb-8">
               <div className="w-20 h-20 bg-gradient-to-tr from-zinc-800 to-zinc-900 rounded-[2rem] mx-auto flex items-center justify-center mb-5 shadow-inner shadow-white/5 border border-white/5">
                 <User className="w-8 h-8 text-[var(--color-rider-blue)]" />
               </div>
               <h3 className="text-2xl font-bold text-white tracking-tight">Tu Pase Digital</h3>
               <p className="text-sm text-zinc-400 mt-1 font-medium">Suscripción Premium Autorizada</p>
            </div>

            <div className="space-y-3">
              <div className="bg-zinc-950/80 rounded-2xl p-4 flex justify-between items-center shadow-inner">
                <span className="text-zinc-500 text-sm font-semibold tracking-wide">Usuario</span>
                <span className="text-white font-bold">{localUser}</span>
              </div>
              <div className="bg-zinc-950/80 rounded-2xl p-4 flex justify-between items-center shadow-inner">
                <span className="text-zinc-500 text-sm font-semibold tracking-wide">Estado</span>
                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
                  {account?.status === 'active' ? 'ACTIVA' : account?.status || 'ACTIVA'}
                </span>
              </div>
              <div className="bg-zinc-950/80 rounded-2xl p-4 flex justify-between items-center shadow-inner">
                <span className="text-zinc-500 text-sm font-semibold tracking-wide">Expiración</span>
                <span className="text-white font-bold">{accountExpDate}</span>
              </div>
            </div>
            
            <button onClick={() => setAccountModalOpen(false)} className="w-full mt-8 bg-white text-zinc-950 font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]">
               Cerrar Panel
            </button>
          </div>
        </div>
      )}
    </>
  )
})
