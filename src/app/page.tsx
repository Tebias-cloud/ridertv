"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// WhatsApp funnel URL
const WHATSAPP_URL = "https://wa.me/56961391859?text=Hola%20Rober,%20necesito%20ayuda%20con%20Rider%20TV"

// Professional SVGs for zero-dependency stability
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 1.267-.076c7 0 10 7 10 7a9.956 9.956 0 0 1-1.551 2.232"/><path d="M14.652 14.652a3 3 0 0 1-4.304-4.304"/><path d="M15.534 20.03c-1.115.33-2.332.51-3.534.51-7 0-10-7-10-7a13.109 13.109 0 0 1 2.584-3.506"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
)

function LoginFormContent() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Quick session check
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session && session.user?.user_metadata?.role === 'admin') {
          router.push('/admin')
        }
      } catch (err) {}
    }
    checkSession()
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    const username = (formData.get('username') as string)?.trim()?.toLowerCase()
    const password = (formData.get('password') as string)?.trim()
    
    if (!username || !password) {
      setErrorMsg('Ingresa tu usuario y contraseña')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const fakeEmail = `${username}@rider.com`

      const { data, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      })

      if (error) {
        setErrorMsg(error.message.includes('Invalid') ? 'Credenciales incorrectas' : 'Error al conectar con el servidor')
      } else {
        const role = data.user?.user_metadata?.role
        if (role === 'admin') {
          router.push('/admin')
        } else {
          setErrorMsg('Acceso Denegado')
          await supabase.auth.signOut()
        }
      }
    } catch (err) {
      setErrorMsg('Fallo de conexión. Reintenta pronto.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="relative flex flex-col items-center justify-center min-h-[100dvh] bg-[#0c0c1e] px-8 overflow-hidden font-sans"
      style={{ 
        background: 'linear-gradient(135deg, #13132e 0%, #0c0c1e 100%)',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Premium Background Ambience */}
      <div className="absolute top-0 w-full h-[60%] bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 w-full h-[40%] bg-red-600/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-12">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight uppercase flex items-center justify-center gap-1.5 py-2">
            <span className="text-[#f13a3a]">R</span>
            <span className="text-[#e2e2e2]">IDER</span>
            <span className="text-[#e2e2e2] ml-1">T</span>
            <span className="text-[#3b82f6]">V</span>
          </h1>
          <p className="mt-4 text-[#a0a0b8] font-medium text-[15px] tracking-tight opacity-80">
            Streaming sin límites (Administración)
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="block w-full px-6 py-5 bg-[#1a1a3a]/40 border border-white/5 text-white rounded-2xl text-lg placeholder-[#5c5c7a] focus:outline-none focus:border-[#f13a3a]/50 transition-all shadow-2xl"
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
                className="block w-full px-6 py-5 pr-16 bg-[#1a1a3a]/40 border border-white/5 text-white rounded-2xl text-lg placeholder-[#5c5c7a] focus:outline-none focus:border-[#f13a3a]/50 transition-all shadow-2xl"
                placeholder="Contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 w-16 flex items-center justify-center text-[#5c5c7a] hover:text-[#e2e2e2] transition-colors"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-600/5 border border-red-600/20 py-3 px-4 rounded-xl text-center animate-shake">
              <p className="text-sm font-bold text-red-500 italic">
                {errorMsg}
              </p>
            </div>
          )}

          <div className="pt-4">
            <button
              disabled={isLoading}
              type="submit"
              className="w-full h-16 flex items-center justify-center bg-[#f13a3a] text-white text-[19px] font-bold rounded-2xl hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 transition-all shadow-2xl uppercase tracking-tight"
            >
               {isLoading ? (
                 <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                 'Iniciar Sesión'
               )}
            </button>
            
            <div className="mt-14 text-center">
              <a 
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[#a0a0b8] hover:text-white font-medium transition-colors"
              >
                ¿Necesitas ayuda? Contáctanos por WhatsApp
              </a>
            </div>
          </div>
        </form>
      </div>

      {/* Hidden legacy bridge accessibility */}
      <noscript>
        <div className="fixed inset-0 z-[100] bg-[#0c0c1e] flex flex-col items-center justify-center p-8 text-center text-white">
           <h2 className="text-2xl font-bold mb-4">JS Requerido</h2>
           <p className="text-zinc-500 mb-8">Por favor activa JavaScript en los ajustes de tu iPhone para entrar al sistema.</p>
        </div>
      </noscript>
    </div>
  )
}

export const dynamic = 'force-dynamic';

export default function RootHomePage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#0c0c1e]" />}>
      <LoginFormContent />
    </Suspense>
  )
}







