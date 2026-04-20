"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// WhatsApp funnel URL
const WHATSAPP_URL = "https://wa.me/56961391859?text=Hola%20Rober,%20necesito%20ayuda%20con%20Rider%20TV"

// Inline SVGs for zero-dependency loading stability
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 1.267-.076c7 0 10 7 10 7a9.956 9.956 0 0 1-1.551 2.232"/><path d="M14.652 14.652a3 3 0 0 1-4.304-4.304"/><path d="M15.534 20.03c-1.115.33-2.332.51-3.534.51-7 0-10-7-10-7a13.109 13.109 0 0 1 2.584-3.506"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
)

function LoginFormContent() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
    
    // 💨 Guarded Check Session
    const checkSession = async () => {
      try {
        const supabase = createClient()
        if (!supabase) return
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) return
        
        if (session) {
          const role = session.user?.user_metadata?.role
          if (role === 'admin') router.push('/admin')
        }
      } catch (err) {
        console.error("Auth Fail:", err)
      }
    }
    checkSession()

    // Legacy search params extraction for high-compatibility
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('error') === 'suspended') {
        setErrorMsg('Tu cuenta ha sido suspendida.')
      }
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const formData = new FormData(e.currentTarget)
      const username = (formData.get('username') as string)?.trim()
      const password = (formData.get('password') as string)?.trim()
      
      if (!username || !password) {
        setErrorMsg('Ingresa usuario y clave')
        setIsLoading(false)
        return
      }

      const fakeEmail = `${username.toLowerCase()}@rider.com`
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Usuario o clave incorrectos')
        } else {
          setErrorMsg(error.message)
        }
      } else {
        const role = data.user?.user_metadata?.role
        if (role === 'admin') {
          router.push('/admin')
        } else {
          setErrorMsg('Solo administradores')
          await supabase.auth.signOut()
        }
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="relative flex flex-col items-center justify-center min-h-[100dvh] bg-zinc-950 px-6 overflow-hidden font-sans"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className="relative z-50 w-full max-w-md space-y-10">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
            Rider <span className="text-red-600">TV</span>
          </h1>
          <p className="mt-3 text-zinc-500 font-medium tracking-widest text-xs uppercase">
            Administración Premium
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="block w-full px-5 py-4 bg-zinc-900 border border-white/5 text-white rounded-2xl text-lg focus:outline-none focus:border-red-600 transition-all shadow-inner"
                placeholder="Usuario"
              />
            </div>
            
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="block w-full px-5 py-4 pr-14 bg-zinc-900 border border-white/5 text-white rounded-2xl text-lg focus:outline-none focus:border-red-600 transition-all shadow-inner"
                placeholder="Contraseña"
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                className="absolute inset-y-0 right-3 flex items-center justify-center px-2 text-zinc-600 hover:text-white transition-colors"
                aria-label="Toggle Password"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="py-2 px-1 text-center">
              <p className="text-sm font-bold text-red-500 italic">
                {errorMsg}
              </p>
            </div>
          )}

          <div className="pt-4 space-y-6">
            <button
              disabled={isLoading}
              type="submit"
              className="w-full flex justify-center py-4 px-4 bg-white text-black text-lg font-black rounded-2xl hover:bg-zinc-200 active:scale-95 disabled:opacity-50 transition-all shadow-lg uppercase tracking-tighter"
            >
              {isLoading ? 'Cargando...' : 'Entrar al Panel'}
            </button>
            
            <div className="flex flex-col items-center gap-4">
              <a 
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-600 hover:text-zinc-400 font-bold uppercase tracking-widest transition-colors"
              >
                Soporte Técnico
              </a>
            </div>
          </div>
        </form>
      </div>
      
      {/* Background decoration - very subtle for mobile gpu */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {isMounted && (
        <div className="absolute bottom-10 left-0 right-0 text-center opacity-10 pointer-events-none">
          <span className="text-[10px] text-white font-mono uppercase tracking-[0.4em]">Auth System Active</span>
        </div>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic';

export default function RootHomePage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-zinc-950" />}>
      <LoginFormContent />
    </Suspense>
  )
}


