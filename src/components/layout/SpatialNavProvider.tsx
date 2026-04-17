"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { App } from '@capacitor/app'
import { createClient } from '@/lib/supabase/client'
import { ExitDialog } from '@/components/ui/ExitDialog'

export function SpatialNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false)

  useEffect(() => {
    // 🔙 Interceptor de Botón Atrás Físico (Capacitor / Android TV)
    let backListener: any = null;

    const setupBackListener = async () => {
      backListener = await App.addListener('backButton', ({ canGoBack }) => {
        // Si estamos en una pantalla raíz, mostrar el diálogo de salida
        if (pathname === '/' || pathname === '/catalog' || pathname === '/admin' || !canGoBack) {
          setIsExitDialogOpen(true)
        } else {
          // Si no es raíz, intentar navegar atrás normalmente
          window.history.back()
        }
      });
    };

    setupBackListener();

    return () => {
      if (backListener) backListener.remove();
    }
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.clear() // Limpiar credenciales de IPTV persistentes
    setIsExitDialogOpen(false)
    router.replace('/')
  }

  const handleExitApp = () => {
    App.exitApp()
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpatialNavigation = require('spatial-navigation-js')
      try {
        SpatialNavigation.init()
        
        // Configuración Global
        SpatialNavigation.set({
          rememberSource: true,
          straightOnly: false,
          straightOverlapThreshold: 0.1, // Más estricto para evitar saltos diagonales
        })

        // Sección SIDEBAR: Solo accesible desde la izquierda
        SpatialNavigation.add('sidebar', {
          selector: '.sidebar-item',
          enterTo: 'last-focused',
        })

        // Sección CONTENIDO: Galería principal
        SpatialNavigation.add('content', {
          selector: '.nav-item, button:not([disabled]), input, a[href]:not(.sidebar-item)',
          enterTo: 'last-focused',
        })

        // Restricción: Salida del sidebar hacia el contenido
        SpatialNavigation.set('sidebar', {
          nextElementByDirection: {
            right: '@content'
          }
        })

        // 🔥 Escape: Salida del contenido hacia el sidebar (Novedad clave)
        SpatialNavigation.set('content', {
          nextElementByDirection: {
            left: '@sidebar'
          }
        })

        SpatialNavigation.makeFocusable()

        // 🔥 UX: Auto-scroll centrado para TV (Optimizado para evitar parpadeos)
        const handleFocused = (e: any) => {
          const element = e.target;
          if (element) {
            const isSidebar = element.classList.contains('sidebar-item');
            
            // Si es sidebar, no necesitamos scroll horizontal, solo vertical suave
            // Si es contenido, queremos centrarlo
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: isSidebar ? 'nearest' : 'center'
            });
          }
        };

        window.addEventListener('sn:focused', handleFocused);
        (window as any)._snHandler = handleFocused;

      } catch (e) {
        console.warn('SpatialNavigation init error:', e)
      }

      return () => {
        try {
           if ((window as any)._snHandler) {
             window.removeEventListener('sn:focused', (window as any)._snHandler);
           }
           SpatialNavigation.uninit()
        } catch (e) {}
      }
    }
  }, [])

  useEffect(() => {
    // Focus when pathname changes
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
         const SpatialNavigation = require('spatial-navigation-js')
         try { SpatialNavigation.focus() } catch (e) {}
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <>
      {children}
      <ExitDialog 
        isOpen={isExitDialogOpen} 
        onClose={() => setIsExitDialogOpen(false)} 
        onExit={handleExitApp} 
        onLogout={handleLogout}
      />
    </>
  )
}
