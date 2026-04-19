import { useState, useEffect, createContext, useContext, useMemo } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { useNavigate, useLocation } from 'react-router-dom'
import React from 'react'
import { fetchIptv, getBaseUrl } from '@/lib/iptv'

interface AppContextType {
  activeAccount: any
  categories: any[]
  loading: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AuthenticatedLayout')
  }
  return context
}

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeAccount, setActiveAccount] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 🔥 1. Carga Inicial de Datos (Solo una vez al montar)
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
 
      if (!user) {
        navigate('/')
        return
      }
 
      const { data: accounts } = await supabase
        .from('external_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
 
      const validAccounts = accounts || []
      console.log(`🔍 [Auth] Encontradas ${validAccounts.length} cuentas.`);
      
      let workingAcc = null;
      let loadedCats = [];
 
      for (const acc of validAccounts) {
        try {
          console.log(`⏳ [Auth] Probando cuenta: ${acc.username}...`);
          const baseUrl = getBaseUrl(acc.portal_url)
          const catUrl = `${baseUrl}/player_api.php?username=${acc.username}&password=${acc.password}&action=get_live_categories`
          const data = await fetchIptv(catUrl)
          
          if (Array.isArray(data)) {
            workingAcc = acc;
            loadedCats = data;
            console.log(`✅ [Auth] Cuenta funcional detectada: ${acc.username}`);
            break;
          }
        } catch (e) {
          console.warn(`⚠️ [Auth] Error cargando cuenta ${acc.username}:`, e);
        }
      }
 
      const finalAcc = workingAcc || validAccounts[0];
      setActiveAccount(finalAcc);
      setCategories(loadedCats);
 
      if (!workingAcc) console.error("❌ [Auth] No se encontró ninguna cuenta IPTV funcional.");
      setLoading(false)
    }
    load()
  }, []) // 👈 Solo al montar
 
  // 🔥 2. Redirección Inteligente (Solo si estamos en la raíz y ya terminó de cargar)
  useEffect(() => {
    if (!loading && (location.pathname === '/' || location.pathname === '/app')) {
      console.log("🏠 [Auth] Redirigiendo a Home (Catalog)...");
      navigate('/catalog', { replace: true });
    }
  }, [loading, location.pathname, navigate])

  // 🔥 ESTABILIZACIÓN: Asegurar que el objeto del contexto sea el mismo si la data no cambia
  const contextValue = useMemo(() => ({
    activeAccount,
    categories,
    loading
  }), [activeAccount, categories, loading])

  if (loading) {
    return <div className="min-h-screen bg-zinc-950" />
  }

  return (
    <AppContext.Provider value={contextValue}>
      <AppLayout account={activeAccount}>
        {children}
      </AppLayout>
    </AppContext.Provider>
  )
}
