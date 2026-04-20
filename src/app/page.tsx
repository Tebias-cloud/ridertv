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
  
  // Nuclear Diagnostics
  const [logs, setLogs] = useState<string[]>([])
  const [netStatus, setNetStatus] = useState<string>("Checking...")
  
  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), `> ${msg}`])

  useEffect(() => {
    setIsMounted(true)
    addLog("System Init")
    
    // Catch Global Errors
    const handleError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const msg = 'reason' in e ? e.reason : e.message
      addLog(`FATAL: ${String(msg)}`)
    }
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleError)

    // Check Keys
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    addLog(`Config: ${url ? 'URL-OK' : 'URL-MISSING'} | ${key ? 'KEY-OK' : 'KEY-MISSING'}`)

    // Probe Network
    if (url) {
      fetch(url, { mode: 'no-cors' })
        .then(() => { setNetStatus("REACHABLE"); addLog("Network: Supabase Reachable"); })
        .catch((e) => { setNetStatus("BLOCKED"); addLog(`Network: BLOCKED (${e.message})`); })
    }

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleError)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setErrorMsg(null)
    addLog("Submit Triggered")

    const formData = new FormData(e.currentTarget)
    const username = (formData.get('username') as string)?.trim() || ""
    const password = (formData.get('password') as string)?.trim() || ""
    
    if (!username || !password) {
      setErrorMsg('Usuario y Clave requeridos')
      setIsLoading(false)
      return
    }

    try {
      addLog("Initializing Client...")
      const supabase = createClient()
      const fakeEmail = `${username.toLowerCase()}@rider.com`
      
      addLog("Auth: Requesting...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      })

      if (error) {
        addLog(`Auth Result: ERROR (${error.status})`)
        setErrorMsg(error.message.includes('Invalid login credentials') ? 'Usuario o clave incorrectos' : error.message)
      } else {
        addLog("Auth Result: SUCCESS")
        const role = data.user?.user_metadata?.role
        if (role === 'admin') router.push('/admin')
        else {
          setErrorMsg('No eres administrador')
          await supabase.auth.signOut()
        }
      }
    } catch (err: any) {
      addLog(`CATCH: ${err.message}`)
      setErrorMsg('Error de conexión con el sistema')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] bg-[#0c0c1e] px-8 overflow-hidden font-sans">
      
      {/* NUCLEAR DIAGNOSTIC OVERLAY */}
      <div className="fixed top-2 left-2 right-2 z-[9999] bg-black/80 backdrop-blur-md rounded-xl p-3 border border-zinc-800 text-[10px] font-mono select-text pointer-events-auto">
        <div className="flex justify-between items-center mb-1 border-b border-zinc-800 pb-1">
          <span className="text-zinc-500 uppercase tracking-widest font-bold">iPhone Diagnostic Console</span>
          <span className={`px-2 py-0.5 rounded ${netStatus === 'REACHABLE' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
            NET: {netStatus}
          </span>
        </div>
        <div className="space-y-0.5">
          {logs.map((log, i) => (
            <div key={i} className={log.includes('FATAL') ? 'text-red-500 font-bold' : 'text-blue-400'}>{log}</div>
          ))}
          {logs.length === 0 && <div className="text-zinc-600 italic">No logs yet...</div>}
        </div>
      </div>

      <div className="relative z-50 w-full max-w-sm space-y-12 mt-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight uppercase flex items-center justify-center gap-1.5">
            <span className="text-[#f13a3a]">R</span>
            <span className="text-[#e2e2e2]">IDER</span>
            <span className="text-[#e2e2e2] ml-1">T</span>
            <span className="text-[#3b82f6]">V</span>
          </h1>
          <p className="mt-4 text-[#a0a0b8] font-medium text-[15px]">
            Streaming sin límites (Solo Usuario y Clave)
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input
              id="username" name="username" type="text" required
              className="block w-full px-5 py-5 bg-[#1a1a3a]/60 border border-white/5 text-white rounded-xl text-lg placeholder-[#5c5c7a] outline-none"
              placeholder="Nombre de Usuario"
            />
            
            <div className="relative">
              <input
                id="password" name="password" 
                type={showPassword ? "text" : "password"}
                required
                className="block w-full px-5 py-5 pr-16 bg-[#1a1a3a]/60 border border-white/5 text-white rounded-xl text-lg placeholder-[#5c5c7a] outline-none"
                placeholder="Contraseña"
              />
              <div
                onClick={() => { console.log('Toggle Click'); setShowPassword(!showPassword); }}
                className="absolute inset-y-0 right-0 w-16 h-full flex items-center justify-center text-[#5c5c7a] z-[100] active:text-white"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-center">
              <p className="text-xs font-bold text-red-500 italic uppercase">
                {errorMsg}
              </p>
            </div>
          )}

          <button
            disabled={isLoading}
            type="submit"
            className="w-full h-16 bg-[#f13a3a] text-white text-[19px] font-bold rounded-2xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all uppercase"
          >
             {isLoading ? 'Conectando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center pt-8">
          <a href={WHATSAPP_URL} target="_blank" className="text-[13px] text-[#a0a0b8] font-medium block">
            ¿Necesitas ayuda? Contáctanos por WhatsApp
          </a>
        </div>
      </div>

      <div className="absolute top-0 w-full h-[50%] bg-blue-600/5 blur-[100px] pointer-events-none" />
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





