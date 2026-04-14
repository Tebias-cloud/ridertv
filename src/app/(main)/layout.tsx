import { AppLayout } from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the active account to load into the Sidebar globally
  const { data: accounts } = await supabase
    .from('external_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const validAccounts = accounts || []
  const activeAccount = validAccounts.find(a => a.status === 'active') || validAccounts[0]

  return (
    <AppLayout account={activeAccount}>
      {children}
    </AppLayout>
  )
}
