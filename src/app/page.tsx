"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// WhatsApp funnel URL
const WHATSAPP_URL = "https://wa.me/56961391859?text=Hola%20Rober,%20necesito%20ayuda%20con%20Rider%20TV"

// Inline SVGs for zero-dependency loading stability
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 1.267-.076c7 0 10 7 10 7a9.956 9.956 0 0 1-1.551 2.232"/><path d="M14.652 14.652a3 3 0 0 1-4.304-4.304"/><path d="M15.534 20.03c-1.115.33-2.332.51-3.534.51-7 0-10-7-10-7a13.109 13.109 0 0 1 2.584-3.506"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
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
        setErrorMsg('Tu cuenta ha expirado o ha sido suspendida.')
      }
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    
    if (!username || !password) {
      setErrorMsg('Usuario y Contraseña son requeridos')
      setIsLoading(false)
      return
    }

    const fakeEmail = `${username.trim().toLowerCase()}@rider.com`
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Acceso denegado. Usuario o clave incorrectos.')
        } else {
          setErrorMsg(error.message)
        }
      } else {
        const role = data.user?.user_metadata?.role
        if (role === 'admin') {
          router.push('/admin')
        } else {
          setErrorMsg('Acceso restringido. Solo administradores.')
          await supabase.auth.signOut()
        }
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión con Rider TV.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="relative flex flex-col items-center justify-center min-h-[100dvh] bg-black px-4 sm:px-6 lg:px-8 overflow-hidden font-sans select-none"
      style={{
        background: 'radial-gradient(circle at top left, rgba(239, 68, 68, 0.05), transparent 40%), radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.05), transparent 40%), #000000',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div className="relative z-50 w-full max-w-2xl space-y-12">
        <div className="flex flex-col items-center">
          <h1 
            className="text-center text-6xl md:text-7xl tracking-[0.1em] font-black uppercase text-white drop-shadow-2xl"
            style={{
              background: 'linear-gradient(to right, #ef4444, #3b82f6)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            }}
          >
            Rider TV
          </h1>
          <p className="mt-6 text-center text-2xl text-zinc-400 font-bold tracking-widest uppercase">
            Acceso Maestro <span className="opacity-20 text-xs">v3.0</span>
          </p>
        </div>

        <form className="mt-20 space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="block w-full px-6 py-6 border border-white/10 bg-white/5 backdrop-blur-3xl placeholder-zinc-800 text-white rounded-2xl text-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500 transition-all duration-300 shadow-2xl"
                style={{ WebkitBackdropFilter: 'blur(40px)' }}
                placeholder="Nombre de Usuario"
              />
            </div>
            
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="block w-full px-6 py-6 pr-20 border border-white/10 bg-white/5 backdrop-blur-3xl placeholder-zinc-800 text-white rounded-2xl text-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500 shadow-2xl transition-all duration-300"
                style={{ WebkitBackdropFilter: 'blur(40px)' }}
                placeholder="Contraseña"
              />
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                className="absolute inset-y-0 right-4 my-auto h-14 w-14 flex items-center justify-center text-zinc-500 hover:text-white transition-all z-10"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl text-center backdrop-blur-xl">
              <p className="text-xl font-bold text-red-500 tracking-tight">
                {errorMsg}
              </p>
            </div>
          )}

          <div className="pt-10 flex flex-col items-center">
            <button
              disabled={isLoading}
              type="submit"
              className="group relative w-full flex justify-center py-6 px-4 border-none text-2xl font-black rounded-2xl text-white bg-gradient-to-r from-red-600 to-blue-600 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl uppercase tracking-widest"
            >
              {isLoading ? 'ESTABLECIENDO VÍNCULO...' : 'ENTRAR AL SISTEMA'}
            </button>
            
            <a 
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 text-zinc-500 hover:text-red-500 transition-colors uppercase font-bold tracking-widest text-xs"
            >
              Soporte Directo Maestro
            </a>
          </div>
        </form>
      </div>
      
      {/* Ultra-subtle status tag for verification */}
      {isMounted && (
        <div className="absolute bottom-6 right-6 opacity-5 pointer-events-none">
          <span className="text-[8px] text-white tracking-[0.5em] font-black uppercase">iOS_Hardened_Stable</span>
        </div>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic';

export default function RootHomePage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-black flex items-center justify-center text-zinc-900 font-black">RIDER TV</div>}>
      <LoginFormContent />
    </Suspense>
  )
}

