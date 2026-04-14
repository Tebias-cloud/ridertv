import { getAllProfilesAction } from '@/actions/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClientPanel from './AdminClientPanel'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/catalog')
  }

  const { profiles, error } = await getAllProfilesAction()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">
          Panel de Control Maestro
        </h1>
        <div className="bg-[var(--color-rider-blue)]/20 text-[var(--color-rider-blue)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-[var(--color-rider-blue)]/30">
          Admin
        </div>
      </div>
      
      {error ? (
        <div className="bg-red-500/20 text-red-500 p-4 rounded-xl border border-red-500/50">
           Error cargando perfiles: {error}
        </div>
      ) : (
        <AdminClientPanel initialProfiles={profiles || []} currentUserId={user.id} />
      )}
    </div>
  )
}
