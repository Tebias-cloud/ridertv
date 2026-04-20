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
  const [diagInfo, setDiagInfo] = useState<string | null>(null)
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
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setErrorMsg(null)
    setDiagInfo(null)

    // Diagnostic Timeout
    const diagTimeout = setTimeout(() => {
      setDiagInfo("Diagnóstico: El servidor tarda en responder. Verifica tu conexión o VPN.")
    }, 5000)

    try {
      const formData = new FormData(e.currentTarget)
      const username = (formData.get('username') as string)?.trim()
      const password = (formData.get('password') as string)?.trim()
      
      if (!username || !password) {
        setErrorMsg('Ingresa usuario y clave')
        clearTimeout(diagTimeout)
        setIsLoading(false)
        return
      }

      const fakeEmail = `${username.toLowerCase()}@rider.com`
      const supabase = createClient()

      console.log("Attempting login for:", fakeEmail)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      })

      clearTimeout(diagTimeout)

      if (error) {
        console.error("Supabase Error:", error)
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Usuario o clave incorrectos')
        } else {
          setErrorMsg(`Error del Sistema: ${error.message}`)
          setDiagInfo(`Detalles técnicos: ${JSON.stringify(error)}`)
        }
      } else {
        const role = data.user?.user_metadata?.role
        if (role === 'admin') {
          router.push('/admin')
        } else {
          setErrorMsg('Acceso Denegado: Solo Administradores')
          await supabase.auth.signOut()
        }
      }
    } catch (err: any) {
      clearTimeout(diagTimeout)
      setErrorMsg('Fallo de Red. Verifica si tu iPhone bloquea el acceso.')
      setDiagInfo(`Error fatal: ${err.message || 'Desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="relative flex flex-col items-center justify-center min-h-[100dvh] px-6 overflow-hidden font-sans"
      style={{ 
        background: 'radial-gradient(circle at top, #001a33, #000000)',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Background Glows (Safari Safe) */}
      <div className="absolute top-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[150%] h-[50%] bg-blue-600/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[50%] bg-red-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-50 w-full max-w-md space-y-12">
        <div className="text-center">
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white uppercase italic drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            Rider <span className="text-red-600">TV</span>
          </h1>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="block w-full px-6 py-5 bg-zinc-900/80 border border-white/5 text-white rounded-3xl text-xl focus:outline-none focus:border-blue-500 transition-all shadow-2xl backdrop-blur-md"
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
                className="block w-full px-6 py-5 pr-14 bg-zinc-900/80 border border-white/5 text-white rounded-3xl text-xl focus:outline-none focus:border-blue-500 transition-all shadow-2xl backdrop-blur-md"
                placeholder="Contraseña"
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                className="absolute inset-y-0 right-4 flex items-center justify-center px-2 text-zinc-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-600/10 border border-red-600/20 py-4 px-4 rounded-2xl text-center backdrop-blur-md animate-pulse">
              <p className="text-sm font-bold text-red-500 uppercase tracking-tight">
                {errorMsg}
              </p>
            </div>
          )}

          {diagInfo && (
            <div className="bg-blue-600/10 border border-blue-600/20 py-3 px-4 rounded-xl text-center">
              <p className="text-[10px] font-mono text-blue-400 leading-tight">
                {diagInfo}
              </p>
            </div>
          )}

          <div className="pt-4">
            <button
              disabled={isLoading}
              type="submit"
              className="w-full h-16 flex items-center justify-center bg-red-600 text-white text-xl font-black rounded-3xl hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] uppercase tracking-tighter"
            >
              {isLoading ? 'Conectando...' : 'Entrar al Sistema'}
            </button>
            
            <div className="mt-10 text-center">
              <a 
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-500 hover:text-white font-bold uppercase tracking-[0.3em] transition-colors"
              >
                Soporte Oficial Rider
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic';

export default function RootHomePage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-black" />}>
      <LoginFormContent />
    </Suspense>
  )
}



