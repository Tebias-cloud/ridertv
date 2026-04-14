"use client"

import { useRouter } from "next/navigation"

type Account = {
  id: string
  service_name: string
  username: string
  password: string
  portal_url: string
  status: string
  expires_at: string
}

export function IptvCard({ account }: { account: Account }) {
  const router = useRouter()

  const handlePlay = () => {
    sessionStorage.setItem('iptv_username', account.username)
    sessionStorage.setItem('iptv_password', account.password)
    sessionStorage.setItem('iptv_portal_url', account.portal_url)
    router.push('/player')
  }

  return (
    <div className="w-full h-full max-w-lg bg-zinc-900/70 backdrop-blur-2xl border border-white/10 flex flex-col justify-between rounded-3xl overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.5)] transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-white/5 bg-white/[0.02]">
        <h3 className="font-bold text-white text-xl tracking-tight">{account.service_name}</h3>
        <div className="flex items-center gap-2">
          {account.status === "active" ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider">Activo</span>
            </>
          ) : (
            <>
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-xs font-medium text-red-500 uppercase tracking-wider">Suspendido</span>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between items-center sm:items-end gap-4">
          <div className="flex flex-col text-xs text-zinc-500 w-full">
            <span>Válido hasta:</span>
            <span className="font-medium text-zinc-400">
              {new Date(account.expires_at).toLocaleDateString()}
            </span>
          </div>

          <button 
            onClick={account.status === "suspended" ? undefined : handlePlay}
            disabled={account.status === "suspended"}
            className={`w-full sm:w-auto shrink-0 flex items-center justify-center px-4 py-2 font-bold rounded-md transition-colors text-sm ${
              account.status === "suspended"
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                : "bg-[var(--color-rider-red)] hover:bg-[#b91c1c] text-white"
            }`}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            {account.status === "suspended" ? "Servicio Suspendido - Pago Pendiente" : "Reproductor Web"}
          </button>
        </div>
      </div>
    </div>
  )
}
