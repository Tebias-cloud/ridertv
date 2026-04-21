"use client"

import { useState } from 'react'
import { createUserAction, toggleUserAccessAction, updateUserExpiryAction, deleteUserAction, updateIPTVCredentialsAction, resetWebPasswordAction } from '@/actions/admin'
import { Trash2, UserPlus, Save, KeyRound, Edit, Eye, EyeOff } from 'lucide-react'

export default function AdminClientPanel({ initialProfiles, currentUserId }: { initialProfiles: any[], currentUserId: string }) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [editingIptvId, setEditingIptvId] = useState<string | null>(null)
  const [editIptvData, setEditIptvData] = useState({ user: '', pass: '', url: '' })

  // Form State
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [iptvUsername, setIptvUsername] = useState('')
  const [iptvPassword, setIptvPassword] = useState('')
  const [iptvPortalUrl, setIptvPortalUrl] = useState('')

  const togglePassword = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const calculateDaysLeft = (expiresAt: string) => {
    const today = new Date()
    const expDate = new Date(expiresAt)
    const diffTime = expDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { text: 'Vencido', color: 'text-red-500' }
    if (diffDays <= 3) return { text: `Faltan ${diffDays} d`, color: 'text-amber-500' }
    return { text: `${diffDays} d`, color: 'text-emerald-500' }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    formData.append('iptvUsername', iptvUsername)
    formData.append('iptvPassword', iptvPassword)
    formData.append('iptvPortalUrl', iptvPortalUrl)

    const res = await createUserAction(formData)
    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setSuccessMsg('Cliente registrado')
      setUsername('')
      setPassword('')
      setIptvUsername('')
      setIptvPassword('')
      setIptvPortalUrl('')
      window.location.reload()
    }
    setIsLoading(false)
  }

  const handleToggleAccess = async (id: string, currentStatus: boolean) => {
     setIsLoading(true)
     const res = await toggleUserAccessAction(id, currentStatus)
     if (!res.error) {
        setProfiles(profiles.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p))
     }
     setIsLoading(false)
  }

  const handleChangeExpiry = async (id: string, newDateIso: string) => {
     setIsLoading(true)
     const res = await updateUserExpiryAction(id, newDateIso)
     if (!res.error) window.location.reload()
     setIsLoading(false)
  }

  const startEditIptv = (profile: any) => {
     if(profile.external_accounts?.[0]) {
        setEditingIptvId(profile.id)
        setEditIptvData({
           user: profile.external_accounts[0].username,
           pass: profile.external_accounts[0].password,
           url: profile.external_accounts[0].portal_url
        })
     }
  }

  const saveEditIptv = async (userId: string) => {
     setIsLoading(true)
     const res = await updateIPTVCredentialsAction(userId, editIptvData.user, editIptvData.pass, editIptvData.url)
     if (!res.error) {
        setEditingIptvId(null)
        window.location.reload()
     }
     setIsLoading(false)
  }

  const handleResetWebPass = async (userId: string) => {
     const newPass = prompt("Nueva clave web (Mín. 6 car.):")
     if (!newPass || newPass.length < 6) return
     setIsLoading(true)
     const res = await resetWebPasswordAction(userId, newPass)
     if (!res.error) alert("¡Clave actualizada!")
     setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
     if (!confirm('¿Eliminar usuario?')) return
     setIsLoading(true)
     const res = await deleteUserAction(id)
     if (!res.error) setProfiles(profiles.filter(p => p.id !== id))
     setIsLoading(false)
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* Create User Form */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-5 md:p-8 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" />
          Registrar Cliente
        </h2>
        
        {errorMsg && <div className="mb-4 text-red-500 text-xs bg-red-500/10 p-4 rounded-2xl border border-red-500/20">{errorMsg}</div>}
        {successMsg && <div className="mb-4 text-emerald-500 text-xs bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">{successMsg}</div>}
        
        <form onSubmit={handleCreate} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-1">Acceso Web</h3>
                 <div className="space-y-3">
                   <input 
                     type="text" required value={username} onChange={e => setUsername(e.target.value)}
                     className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 outline-none transition-all placeholder-zinc-700"
                     placeholder="Usuario" autoCapitalize="none" autoCorrect="off" spellCheck="false"
                   />
                   <input 
                     type="text" required value={password} onChange={e => setPassword(e.target.value)}
                     className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 outline-none transition-all placeholder-zinc-700"
                     placeholder="Clave Web" autoCapitalize="none" autoCorrect="off" spellCheck="false"
                   />
                 </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-1">Línea IPTV</h3>
                 <div className="space-y-3">
                   <input 
                     type="text" required value={iptvUsername} onChange={e => setIptvUsername(e.target.value)}
                     className="w-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none transition-all placeholder-emerald-900/50"
                     placeholder="User IPTV" autoCapitalize="none" autoCorrect="off" spellCheck="false"
                   />
                   <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" required value={iptvPassword} onChange={e => setIptvPassword(e.target.value)}
                        className="w-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none transition-all placeholder-emerald-900/50"
                        placeholder="Clave" autoCapitalize="none" autoCorrect="off" spellCheck="false"
                      />
                      <input 
                        type="text" required value={iptvPortalUrl} onChange={e => setIptvPortalUrl(e.target.value)}
                        className="w-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none transition-all placeholder-emerald-900/50"
                        placeholder="URL" autoCapitalize="none" autoCorrect="off" spellCheck="false"
                      />
                   </div>
                 </div>
              </div>
           </div>

           <button 
             type="submit" disabled={isLoading}
             className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-blue-900/20 uppercase tracking-tight text-lg"
           >
             {isLoading ? 'Registrando...' : 'Habilitar Cliente'}
           </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400 min-w-[700px] md:min-w-0">
            <thead className="bg-black/40 text-[10px] font-black uppercase text-zinc-600 border-b border-white/5 tracking-widest">
              <tr>
                <th className="px-6 py-5">Usuario</th>
                <th className="px-6 py-5">IPTV Info</th>
                <th className="px-6 py-5">Expira</th>
                <th className="px-6 py-5 text-center">Estado</th>
                <th className="px-6 py-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {profiles.map((profile: any) => {
                const daysLeft = calculateDaysLeft(profile.expires_at)
                
                return (
                  <tr key={profile.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-white text-base">{profile.username}</div>
                        {profile.role === 'admin' && <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black px-2 py-0.5 rounded border border-amber-500/20 uppercase">Admin</span>}
                      </div>
                      <button 
                         onClick={() => handleResetWebPass(profile.id)}
                         disabled={profile.id === currentUserId}
                         className="mt-2 text-[10px] uppercase font-bold text-amber-500 hover:text-white flex items-center gap-1 disabled:opacity-30"
                      >
                         <KeyRound className="w-3 h-3" /> Reset Clave
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      {profile.external_accounts?.[0] ? (
                        <div className="bg-black/60 p-3 rounded-2xl border border-white/5 relative group/iptv">
                           {editingIptvId === profile.id ? (
                             <div className="flex flex-col gap-2">
                               <input type="text" value={editIptvData.user} onChange={e => setEditIptvData({...editIptvData, user: e.target.value})} className="bg-zinc-900 border border-zinc-800 text-[11px] text-white px-3 py-2 rounded-xl outline-none" />
                               <input type="text" value={editIptvData.pass} onChange={e => setEditIptvData({...editIptvData, pass: e.target.value})} className="bg-zinc-900 border border-zinc-800 text-[11px] text-white px-3 py-2 rounded-xl outline-none" />
                               <div className="flex gap-2">
                                 <button onClick={() => saveEditIptv(profile.id)} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex-1"><Save className="w-3 h-3 mx-auto" /></button>
                                 <button onClick={() => setEditingIptvId(null)} className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded-xl text-xs font-bold">X</button>
                               </div>
                             </div>
                           ) : (
                             <div className="space-y-1">
                               <div className="flex items-center justify-between">
                                  <span className="text-emerald-400 font-mono text-xs font-bold">{profile.external_accounts[0].username}</span>
                                  <button onClick={() => startEditIptv(profile)} className="text-zinc-700 hover:text-blue-500 opacity-0 group-hover/iptv:opacity-100 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                               </div>
                               <div className="flex items-center gap-2">
                                 <span className="text-zinc-500 font-mono text-xs">{showPassword[profile.id] ? profile.external_accounts[0].password : '••••••••'}</span>
                                 <button onClick={() => togglePassword(profile.id)} className="text-zinc-700 hover:text-blue-500">{showPassword[profile.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</button>
                               </div>
                             </div>
                           )}
                        </div>
                      ) : <span className="text-[10px] text-zinc-700 italic">No asignada</span>}
                    </td>
                    <td className="px-6 py-5">
                       <input 
                          type="date"
                          defaultValue={new Date(profile.expires_at).toISOString().split('T')[0]}
                          onChange={(e) => e.target.value && handleChangeExpiry(profile.id, new Date(e.target.value).toISOString())}
                          className="bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50"
                       />
                       <div className={`mt-1 text-[10px] font-bold px-1 ${daysLeft.color}`}>{daysLeft.text}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => handleToggleAccess(profile.id, profile.is_active)}
                        disabled={profile.id === currentUserId}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors disabled:opacity-20 ${profile.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${profile.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => handleDelete(profile.id)}
                        disabled={profile.id === currentUserId}
                        className="p-2.5 bg-zinc-800/50 hover:bg-red-500/20 hover:text-red-500 text-zinc-600 rounded-xl transition-all disabled:opacity-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
