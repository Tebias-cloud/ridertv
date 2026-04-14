"use client"

import { useState } from "react"
import { toggleAccountStatus, updateAccount, deleteAccount } from "@/actions/admin"
import { Trash2, Edit2, X, Check, Search, UserPlus } from 'lucide-react'
import { ClientCreationForm } from "@/components/admin/ClientCreationForm"

type Account = {
  id: string
  user_id: string
  service_name: string
  username: string
  portal_url: string
  status: string
  expires_at: string
}

export function AccountsTable({ initialAccounts }: { initialAccounts: Account[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // States for Edit Modal
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [editForm, setEditForm] = useState({ webUser: '', webPass: '', username: '', password: '', portal_url: '', expires_at: '' })
  
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleToggle = async (id: string, currentStatus: string) => {
    setLoadingId(id)
    try {
      await toggleAccountStatus(id, currentStatus)
    } catch (error) {
      console.error("Error toggling status:", error)
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string, userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este usuario? Esta acción liquidará su acceso a Router y Supabase Auth.')) return;
    
    setLoadingId(id)
    try {
      await deleteAccount(id, userId)
    } catch (error) {
      console.error("Error deleting account:", error)
    } finally {
      setLoadingId(null)
    }
  }

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc)
    setEditForm({
      webUser: '',
      webPass: '',
      username: acc.username,
      password: acc.password || '',
      portal_url: acc.portal_url,
      expires_at: acc.expires_at ? new Date(acc.expires_at).toISOString().split('T')[0] : ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingAccount) return;
    
    setLoadingId('edit')
    try {
      await updateAccount(editingAccount.id, editingAccount.user_id, {
        ...editForm,
        expires_at: new Date(editForm.expires_at).toISOString()
      })
      setEditingAccount(null)
    } catch (error) {
      console.error("Error updating account:", error)
    } finally {
      setLoadingId(null)
    }
  }

  const filteredAccounts = initialAccounts.filter(acc => 
    acc.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    acc.portal_url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 sm:p-6 border-b border-zinc-800/60 bg-zinc-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-64">
           <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
           <input 
             type="search" 
             placeholder="Buscar usuario..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[var(--color-rider-blue)] transition-colors"
           />
        </div>
        <button onClick={() => setIsCreating(true)} className="w-full sm:w-auto bg-white text-black font-bold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors">
           <UserPlus className="w-4 h-4" />
           Añadir Cliente
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-950/50 text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
            <tr>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Centro Host (Portal)</th>
              <th className="px-6 py-4">Vencimiento</th>
              <th className="px-6 py-4">Kill Switch</th>
              <th className="px-6 py-4 text-right">Settings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredAccounts.map((account) => (
              <tr key={account.id} className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-6 py-4 font-bold text-zinc-200">{account.username}</td>
                <td className="px-6 py-4 font-mono text-xs max-w-[200px] truncate" title={account.portal_url}>
                  {account.portal_url}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                  {new Date(account.expires_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex items-center gap-2">
                     <button
                       onClick={() => handleToggle(account.id, account.status)}
                       disabled={loadingId === account.id}
                       className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 disabled:opacity-50 ${
                         account.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-700'
                       }`}
                     >
                       <span className="sr-only">Toggle Status</span>
                       <span
                         aria-hidden="true"
                         className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                           account.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                         }`}
                       />
                     </button>
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${account.status === 'active' ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        {account.status === 'active' ? 'Online' : 'Offline'}
                     </span>
                   </div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap flex justify-end gap-2">
                  <button
                    onClick={() => openEditModal(account)}
                    className="p-2 rounded-md text-zinc-400 hover:text-[var(--color-rider-blue)] hover:bg-[var(--color-rider-blue)]/10 transition-colors"
                    title="Editar Cliente"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id, account.user_id)}
                    disabled={loadingId === account.id}
                    className="p-2 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title="Eliminar Cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                   Base de datos despejada o sin coincidencias de búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal Override */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-white">Editar Cliente</h3>
                 <button onClick={() => setEditingAccount(null)} className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-4">
                 <div className="pt-2 pb-4 mb-2 border-b border-zinc-800">
                    <h4 className="text-xs font-bold text-emerald-500 mb-4 uppercase tracking-widest">Credenciales Web (Acceso Platarforma)</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nuevo Usuario Web (Opcional)</label>
                        <input 
                          type="text"
                          placeholder="Dejar vacío para no cambiar"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-[var(--color-rider-blue)] outline-none transition-colors"
                          value={editForm.webUser}
                          onChange={(e) => setEditForm({...editForm, webUser: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nueva Clave Web (Opcional)</label>
                        <input 
                          type="text"
                          placeholder="Dejar vacío para no cambiar"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-[var(--color-rider-blue)] outline-none transition-colors"
                          value={editForm.webPass}
                          onChange={(e) => setEditForm({...editForm, webPass: e.target.value})}
                        />
                      </div>
                    </div>
                 </div>

                 <div>
                    <h4 className="text-xs font-bold text-[var(--color-rider-blue)] mb-4 uppercase tracking-widest mt-2">Credenciales Internas IPTV</h4>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Username de Host IPTV</label>
                    <input 
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-[var(--color-rider-blue)] outline-none transition-colors"
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Clave (Password) IPTV</label>
                    <input 
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-[var(--color-rider-blue)] outline-none transition-colors"
                      value={editForm.password}
                      onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">URL del Portal (DNS)</label>
                    <input 
                      type="url"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white font-mono text-sm focus:border-[var(--color-rider-blue)] outline-none transition-colors"
                      value={editForm.portal_url}
                      onChange={(e) => setEditForm({...editForm, portal_url: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Fecha Límite</label>
                    <input 
                      type="date"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-[var(--color-rider-blue)] outline-none transition-colors"
                      value={editForm.expires_at}
                      onChange={(e) => setEditForm({...editForm, expires_at: e.target.value})}
                    />
                 </div>
              </div>

              <div className="mt-8 flex gap-3">
                 <button 
                   onClick={() => setEditingAccount(null)}
                   className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-300 font-bold rounded-xl hover:bg-zinc-700 transition"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={handleSaveEdit}
                   disabled={loadingId === 'edit'}
                   className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
                 >
                   {loadingId === 'edit' ? 'Guardando...' : <><Check className="w-4 h-4" /> Guardar Red</>}
                 </button>
              </div>
           </div>
        </div>
      )}

    {/* Create Modal */}
    {isCreating && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
         <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl relative my-8">
            <button onClick={() => setIsCreating(false)} className="absolute top-4 right-4 z-[70] bg-black/50 hover:bg-white text-zinc-300 hover:text-black p-2 rounded-full transition-all">
               <X className="w-5 h-5" />
            </button>
            <ClientCreationForm />
         </div>
      </div>
    )}

    </div>
  )
}
