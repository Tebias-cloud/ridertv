"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// WhatsApp funnel URL
const WHATSAPP_URL = "https://wa.me/56961391859?text=Hola%20Rober,%20necesito%20ayuda%20con%20Rider%20TV"

// Inline SVGs
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 1.267-.076c7 0 10 7 10 7a9.956 9.956 0 0 1-1.551 2.232"/><path d="M14.652 14.652a3 3 0 0 1-4.304-4.304"/><path d="M15.534 20.03c-1.115.33-2.332.51-3.534.51-7 0-10-7-10-7a13.109 13.109 0 0 1 2.584-3.506"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
)

function LoginFormContent() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [useEmergencyMode, setUseEmergencyMode] = useState(false)
  
  // Nuclear Diagnostics
  const [logs, setLogs] = useState<string[]>([])
  const [netStatus, setNetStatus] = useState<string>("...")
  
  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-3), `> ${msg}`])

  useEffect(() => {
    setIsMounted(true)
    addLog("App Engine Started")
    
    // Catch Global Errors
    const handleError = (e: any) => addLog(`FATAL: ${e.message || 'Error JS'}`)
    window.addEventListener('error', handleError)

    // Check Config and Net
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (url) {
      fetch(url, { mode: 'no-cors' })
        .then(() => setNetStatus("OK"))
        .catch(() => setNetStatus("BLOCKED"))
    }

    // Check for query errors (from Zero-JS redirect)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const error = params.get('error')
      if (error) setErrorMsg(decodeURIComponent(error))
    }

    return () => window.removeEventListener('error', handleError)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Si estamos en modo emergencia, dejamos que el navegador haga el POST estándar
    if (useEmergencyMode) return 

    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setErrorMsg(null)
    addLog("Submit Intercepted")

    const formData = new FormData(e.currentTarget)
    const username = (formData.get('username') as string)?.trim() || ""
    const password = (formData.get('password') as string)?.trim() || ""
    
    if (!username || !password) {
      setErrorMsg('Ingresa usuario y clave')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const fakeEmail = `${username.toLowerCase()}@rider.com`
      
      addLog("Authenticating...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      })

      if (error) {
        addLog("Login Fail")
        setErrorMsg(error.message.includes('Invalid') ? 'Usuario o clave incorrectos' : error.message)
      } else {
        addLog("Login Success")
        const role = data.user?.user_metadata?.role
        if (role === 'admin') router.push('/admin')
        else {
          setErrorMsg('No eres administrador')
          await supabase.auth.signOut()
        }
      }
    } catch (err: any) {
      addLog(`Crash: ${err.message}`)
      setErrorMsg('Error de sistema. Usa Modo Emergencia.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] bg-[#0c0c1e] px-8 overflow-hidden font-sans">
      
      {/* DIAGNOSTIC PANEL (Only if JS works) */}
      <div className="fixed top-2 left-2 right-2 z-50 bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/5 text-[9px] font-mono text-zinc-500">
        <div className="flex justify-between items-center opacity-50">
          <span>iPhone Health Monitor</span>
          <span>NET: {netStatus}</span>
        </div>
        <div className="mt-1">
          {logs.map((log, i) => <div key={i}>{log}</div>)}
          {logs.length === 0 && <div className="text-red-500 font-bold animate-pulse">! JAVASCRIPT BLOQUEADO POR IPHONE !</div>}
        </div>
      </div>

      <div className="relative z-20 w-full max-w-sm space-y-12">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight uppercase flex items-center justify-center gap-1.5 py-2">
            <span className="text-[#f13a3a]">R</span>
            <span className="text-[#e2e2e2]">IDER</span>
            <span className="text-[#e2e2e2] ml-1">T</span>
            <span className="text-[#3b82f6]">V</span>
          </h1>
          <p className="mt-4 text-[#a0a0b8] font-medium text-[15px] tracking-tight">
            {useEmergencyMode ? 'MODO DE EMERGENCIA ACTIVO' : 'Streaming sin límites (Solo Usuario y Clave)'}
          </p>
        </div>

        {/* MODAL / TOGGLE FOR EMERGENCY */}
        {!useEmergencyMode && logs.length === 0 && isMounted && (
           <div className="bg-red-600/20 border border-red-600/40 p-4 rounded-xl text-center animate-bounce cursor-pointer" onClick={() => setUseEmergencyMode(true)}>
             <p className="text-xs font-black text-red-500 uppercase">Activar Modo de Emergencia (Sin JS)</p>
           </div>
        )}

        <form 
          className="space-y-6" 
          onSubmit={handleSubmit}
          action={useEmergencyMode ? "/api/auth/login" : undefined}
          method={useEmergencyMode ? "POST" : undefined}
        >
          <div className="space-y-4">
            <input
              id="username" name="username" type="text" required
              className="block w-full px-5 py-5 bg-[#1a1a3a]/40 border border-white/5 text-white rounded-xl text-lg placeholder-[#5c5c7a] outline-none"
              placeholder="Nombre de Usuario"
            />
            
            <div className="relative">
              <input
                id="password" name="password" 
                type={showPassword ? "text" : "password"}
                required
                className="block w-full px-5 py-5 pr-16 bg-[#1a1a3a]/40 border border-white/5 text-white rounded-xl text-lg placeholder-[#5c5c7a] outline-none"
                placeholder="Contraseña"
              />
              <div
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 w-16 h-full flex items-center justify-center text-[#5c5c7a] cursor-pointer"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-600/5 border border-red-600/20 py-3 px-4 rounded-xl text-center">
              <p className="text-sm font-bold text-red-500 italic">
                {errorMsg}
              </p>
            </div>
          )}

          <div className="pt-4">
            <button
              disabled={isLoading && !useEmergencyMode}
              type="submit"
              className="w-full h-16 flex items-center justify-center bg-[#f13a3a] text-white text-[19px] font-bold rounded-2xl hover:bg-red-700 active:scale-[0.98] transition-all uppercase"
            >
               {isLoading ? 'Conectando...' : 'Iniciar Sesión'}
            </button>
            
            <div className="mt-14 text-center space-y-4">
              <button 
                type="button"
                onClick={() => setUseEmergencyMode(!useEmergencyMode)}
                className="text-[11px] text-zinc-600 hover:text-zinc-400 font-bold uppercase tracking-widest"
              >
                {useEmergencyMode ? 'Volver al Modo Normal' : '¿Problemas? Usar Modo Emergencia'}
              </button>

              <a href={WHATSAPP_URL} target="_blank" className="text-[13px] text-[#a0a0b8] font-medium block">
                Soporte por WhatsApp
              </a>
            </div>
          </div>
        </form>
      </div>

      <div className="absolute top-0 w-full h-[50%] bg-blue-600/5 blur-[100px] pointer-events-none" />
      
      {/* DIAGNOSTIC FOR ZERO-JS: If JS is off, this shows */}
      <noscript>
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-8 text-center">
          <h2 className="text-red-600 text-2xl font-black mb-4">JS BLOQUEADO</h2>
          <p className="text-zinc-400 text-sm mb-8">Tu iPhone está bloqueando el motor de la web. Usa el botón de abajo para entrar sin JavaScript.</p>
          <form action="/api/auth/login" method="POST" className="w-full space-y-4">
            <input name="username" placeholder="Usuario" className="w-full p-4 bg-zinc-900 rounded-xl text-white outline-none" required />
            <input name="password" type="password" placeholder="Clave" className="w-full p-4 bg-zinc-900 rounded-xl text-white outline-none" required />
            <button type="submit" className="w-full p-4 bg-red-600 text-white font-black rounded-xl">INICIAR SESIÓN (MODO SEGURO)</button>
          </form>
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






