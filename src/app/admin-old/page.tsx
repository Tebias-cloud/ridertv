
import { AccountsTable } from '@/components/admin/AccountsTable'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getAccounts() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { data, error } = await supabaseAdmin
    .from('external_accounts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching accounts:', error)
    return []
  }

  return data
}

export default async function AdminDashboard() {
  const accounts = await getAccounts()
  
  const totalUsers = accounts.length
  const activeUsers = accounts.filter(a => a.status === 'active').length
  const suspendedUsers = accounts.filter(a => a.status === 'suspended').length


  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      <div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg hover:-translate-y-1 transition-transform">
            <h3 className="text-zinc-400 text-sm font-medium mb-3 uppercase tracking-wider">Cuentas Totales</h3>
            <p className="text-4xl font-bold text-white drop-shadow">{totalUsers}</p>
          </div>
          <div className="p-6 bg-emerald-950/20 border border-emerald-900/50 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:-translate-y-1 transition-transform">
            <h3 className="text-emerald-500/80 text-sm font-black mb-3 uppercase tracking-wider">Activas (Online)</h3>
            <p className="text-4xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{activeUsers}</p>
          </div>
          <div className="p-6 bg-rose-950/20 border border-rose-900/50 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.05)] hover:-translate-y-1 transition-transform">
            <h3 className="text-rose-500/80 text-sm font-black mb-3 uppercase tracking-wider">Bajas / Suspendidas</h3>
            <p className="text-4xl font-black text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">{suspendedUsers}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          Gestión de Clientes
        </h2>
        <AccountsTable initialAccounts={accounts} />
      </div>

    </div>
  )
}
