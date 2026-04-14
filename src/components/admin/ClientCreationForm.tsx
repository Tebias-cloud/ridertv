"use client"

import { useState } from 'react'
import { createClientUser } from '@/actions/admin'

export function ClientCreationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    
    // Auth Web
    const webUser = formData.get('webUser') as string
    const webPass = formData.get('webPass') as string

    // Datos IPTV
    const iptvUser = formData.get('iptvUser') as string
    const iptvPass = formData.get('iptvPass') as string
    const iptvUrl = formData.get('iptvUrl') as string

    try {
      const res = await createClientUser(webUser, webPass, {
        username: iptvUser,
        password: iptvPass,
        portal_url: iptvUrl,
        service_name: 'Premium IPTV',
      })
      
      if (res?.success) {
        setMessage({ type: 'success', text: '¡Usuario creado exitosamente y vinculado con IPTV!' })
        ;(e.target as HTMLFormElement).reset()
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al crear el usuario en Supabase.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl w-full">
      <h2 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4">Registrar Nuevo Cliente</h2>
      
      {message && (
        <div className={`mb-6 p-4 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/50' : 'bg-red-500/10 text-[var(--color-rider-red)] border border-[var(--color-rider-red)]/50'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sección Web */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Acceso Web</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Usuario Web</label>
              <input name="webUser" type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--color-rider-blue)]" placeholder="Ej: roberto_24" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Contraseña Web</label>
              <input name="webPass" type="password" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--color-rider-blue)]" placeholder="••••••••" minLength={6} />
            </div>
          </div>
        </div>

        {/* Sección IPTV */}
        <div className="space-y-4 pt-6 border-t border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Credenciales IPTV</h3>
          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Usuario IPTV</label>
                <input name="iptvUser" type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--color-rider-blue)]" placeholder="12345678X" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Contraseña IPTV</label>
                <input name="iptvPass" type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--color-rider-blue)]" placeholder="98765432Z" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">URL del Portal (DNS)</label>
              <input name="iptvUrl" type="url" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--color-rider-blue)]" placeholder="http://dominio-ejemplo.com:80" />
            </div>
          </div>
        </div>

        <button disabled={isLoading} type="submit" className="w-full py-3.5 px-4 bg-[var(--color-rider-blue)] hover:bg-[#1d4ed8] text-white rounded-lg font-bold transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50 flex justify-center items-center">
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {isLoading ? 'Creando Usuario y Vinculando...' : 'Registrar Cliente en la Plataforma'}
        </button>
      </form>
    </div>
  )
}
