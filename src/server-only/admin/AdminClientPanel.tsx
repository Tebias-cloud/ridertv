"use client"

import { useState } from 'react'
import { createUserAction, toggleUserAccessAction, updateUserExpiryAction, deleteUserAction, updateIPTVCredentialsAction, resetWebPasswordAction } from '@/actions/admin'
import { Trash2, Clock, UserPlus, Power, AlertCircle, Eye, EyeOff, Edit, Save, KeyRound } from 'lucide-react'

export default function AdminClientPanel({ initialProfiles, currentUserId }: { initialProfiles: any[], currentUserId: string }) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})

  // Form
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
    if (diffDays <= 3) return { text: `Faltan ${diffDays} días`, color: 'text-amber-500' }
    return { text: `${diffDays} días restantes`, color: 'text-emerald-500' }
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
      setSuccessMsg('Usuario creado exitosamente')
      setUsername('')
      setPassword('')
      setIptvUsername('')
      setIptvPassword('')
      setIptvPortalUrl('')
      refreshProfiles()
    }
    setIsLoading(false)
  }

  const refreshProfiles = async () => {
    // In a real app we might re-fetch from an API route or refresh via Server Action
    window.location.reload()
  }

  const handleToggleAccess = async (id: string, currentStatus: boolean) => {
     setIsLoading(true)
     const res = await toggleUserAccessAction(id, currentStatus)
     if (res.error) alert(res.error)
     else {
        setProfiles(profiles.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p))
     }
     setIsLoading(false)
  }

  const handleChangeExpiry = async (id: string, newDateIso: string) => {
     setIsLoading(true)
     const res = await updateUserExpiryAction(id, newDateIso)
     if (res.error) alert(res.error)
     else refreshProfiles()
     setIsLoading(false)
  }

  const [editingIptvId, setEditingIptvId] = useState<string | null>(null)
  const [editIptvData, setEditIptvData] = useState({ user: '', pass: '', url: '' })

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
     if (res.error) alert(res.error)
     else {
        setEditingIptvId(null)
        refreshProfiles()
     }
     setIsLoading(false)
  }

  const handleResetWebPass = async (userId: string) => {
     const newPass = prompt("Supabase cifra la clave web para que nadie pueda verla. Escribe aquí la NUEVA CLAVE WEB para forzar un reseteo:")
     if (!newPass) return
     if (newPass.length < 6) return alert("Seguridad: La contraseña debe tener al menos 6 caracteres.")
     
     setIsLoading(true)
     const res = await resetWebPasswordAction(userId, newPass)
     if (res.error) alert(res.error)
     else alert("¡Contraseña Web reescrita con éxito!")
     setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
     if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return
     
     setIsLoading(true)
     const res = await deleteUserAction(id)
     if (res.error) alert(res.error)
     else setProfiles(profiles.filter(p => p.id !== id))
     setIsLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Create User Form */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[var(--color-rider-blue)]" />
          Registrar Nuevo Cliente
        </h2>
        
        {errorMsg && <div className="mb-6 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{errorMsg}</div>}
        {successMsg && <div className="mb-6 text-emerald-500 text-sm bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">{successMsg}</div>}
        
        <form onSubmit={handleCreate} className="space-y-6">
           {/* Sección Acceso Web */}
           <div className="bg-zinc-950/50 p-4 border border-zinc-800 rounded-xl space-y-4">
               <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">1. Datos de Acceso Web</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-medium text-zinc-500 mb-1">Apodo (Username)</label>
                   <input 
                     type="text" 
                     required
                     value={username}
                     onChange={e => setUsername(e.target.value)}
                     className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-rider-blue)]"
                     placeholder="ej. carlos50"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-zinc-500 mb-1">Clave de la App (Password)</label>
                   <input 
                     type="text" 
                     required
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-rider-blue)]"
                     placeholder="********"
                   />
                 </div>
               </div>
           </div>

           {/* Sección Línea IPTV */}
           <div className="bg-zinc-950/50 p-4 border border-zinc-800 rounded-xl space-y-4">
               <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">2. Línea IPTV (Del Proveedor)</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                   <label className="block text-xs font-medium text-zinc-500 mb-1">Usuario IPTV</label>
                   <input 
                     type="text" 
                     required
                     value={iptvUsername}
                     onChange={e => setIptvUsername(e.target.value)}
                     className="w-full bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                     placeholder="ej. 8xJ92kpl"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-zinc-500 mb-1">Contraseña IPTV</label>
                   <input 
                     type="text" 
                     required
                     value={iptvPassword}
                     onChange={e => setIptvPassword(e.target.value)}
                     className="w-full bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                     placeholder="********"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-zinc-500 mb-1">URL del Portal / DNS</label>
                   <input 
                     type="text" 
                     required
                     value={iptvPortalUrl}
                     onChange={e => setIptvPortalUrl(e.target.value)}
                     className="w-full bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                     placeholder="http://iptv-server.com:8080"
                   />
                 </div>
               </div>
           </div>

           <div className="flex justify-end pt-2">
             <button 
               type="submit" 
               disabled={isLoading}
               className="w-full md:w-auto px-8 bg-[var(--color-rider-blue)] hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 drop-shadow-md"
             >
               {isLoading ? 'Configurando Triple Insert...' : 'Crear y Habilitar Cliente'}
             </button>
           </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Línea IPTV (Info Real)</th>
                <th className="px-6 py-4">Vencimiento</th>
                <th className="px-6 py-4 text-center">Acceso Físico</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {profiles.map((profile: any) => {
                const daysLeft = calculateDaysLeft(profile.expires_at)
                
                return (
                  <tr key={profile.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-white text-base">{profile.username}</div>
                        {profile.role === 'admin' && (
                          <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded border border-amber-500/20 tracking-tighter uppercase">
                            Maestro
                          </span>
                        )}
                      </div>
                      <button 
                         onClick={() => handleResetWebPass(profile.id)}
                         disabled={profile.id === currentUserId}
                         title={profile.id === currentUserId ? "No puedes modificar tu propia cuenta administrativa" : ""}
                         className="mt-2 text-[10px] uppercase font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                         <KeyRound className="w-3 h-3" /> Reset Clave Web
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {profile.external_accounts && profile.external_accounts.length > 0 ? (
                        <div className="flex flex-col gap-1.5 bg-black/40 p-2.5 rounded-lg border border-white/5 relative group">
                           {editingIptvId === profile.id ? (
                             <div className="flex flex-col gap-2">
                               <input type="text" value={editIptvData.user} onChange={e => setEditIptvData({...editIptvData, user: e.target.value})} className="bg-zinc-900 border border-zinc-700 text-xs text-white px-2 py-1 rounded" placeholder="User IPTV" />
                               <input type="text" value={editIptvData.pass} onChange={e => setEditIptvData({...editIptvData, pass: e.target.value})} className="bg-zinc-900 border border-zinc-700 text-xs text-white px-2 py-1 rounded" placeholder="Clave IPTV" />
                               <input type="text" value={editIptvData.url} onChange={e => setEditIptvData({...editIptvData, url: e.target.value})} className="bg-zinc-900 border border-zinc-700 text-xs text-white px-2 py-1 rounded" placeholder="URL Portal" />
                               <div className="flex gap-2">
                                 <button onClick={() => saveEditIptv(profile.id)} className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black px-2 py-1 rounded text-xs font-bold transition-colors flex-1 flex justify-center items-center gap-1"><Save className="w-3 h-3" /> Guardar</button>
                                 <button onClick={() => setEditingIptvId(null)} className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700 px-2 py-1 rounded text-xs font-bold transition-colors">Cancelar</button>
                               </div>
                             </div>
                           ) : (
                             <>
                               <button onClick={() => startEditIptv(profile)} className="absolute top-2 right-2 text-zinc-500 hover:text-[var(--color-rider-blue)] opacity-0 group-hover:opacity-100 transition-all"><Edit className="w-4 h-4" /></button>
                               <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-zinc-500 font-bold uppercase w-10">Use:</span>
                                 <span className="text-emerald-400 font-mono text-sm tracking-wide">{profile.external_accounts[0].username}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-zinc-500 font-bold uppercase w-10">Pas:</span>
                                 <div className="flex items-center gap-3">
                                   <span className="text-white font-mono text-sm tracking-wide">{showPassword[profile.id] ? profile.external_accounts[0].password : '••••••••'}</span>
                                   <button onClick={() => togglePassword(profile.id)} className="text-zinc-500 hover:text-[var(--color-rider-blue)] transition-colors focus:outline-none">
                                     {showPassword[profile.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                   </button>
                                 </div>
                               </div>
                               <div className="flex items-center gap-2 mt-1 pt-1 border-t border-white/5 disabled opacity-50">
                                 <span className="text-[9px] text-zinc-500 font-bold uppercase truncate">{profile.external_accounts[0].portal_url}</span>
                               </div>
                             </>
                           )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-1 rounded">Sin línea asignada</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                         <input 
                            type="date"
                            defaultValue={new Date(profile.expires_at).toISOString().split('T')[0]}
                            onChange={(e) => {
                               if (e.target.value) {
                                  let newDate = new Date(e.target.value);
                                  newDate.setHours(23,59,59);
                                  handleChangeExpiry(profile.id, newDate.toISOString());
                               }
                            }}
                            disabled={isLoading}
                            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[var(--color-rider-blue)] cursor-pointer"
                         />
                         <div className={`text-[10px] font-bold ${daysLeft.color}`}>{daysLeft.text}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleAccess(profile.id, profile.is_active)}
                        disabled={isLoading || profile.id === currentUserId}
                        title={profile.id === currentUserId ? "No puedes modificar tu propio acceso administrativo" : ""}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed ${profile.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(profile.id)}
                          disabled={isLoading || profile.id === currentUserId}
                          title={profile.id === currentUserId ? "No puedes eliminar tu propia cuenta administrativa" : ""}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 text-zinc-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {profiles.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                     No hay clientes registrados aún.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
