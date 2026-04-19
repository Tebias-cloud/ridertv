import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App } from '@capacitor/app'
import { createClient } from '../../lib/supabase/client'
import { ExitDialog } from '../ui/ExitDialog'

/**
 * Global registry for back button interceptors.
 * Components like VideoPlayer or Modals can register a function
 * that returns 'true' if the back button event was handled.
 */
const backInterceptors = new Set<() => boolean>();

export const navigationBus = {
  registerInterceptor: (fn: () => boolean) => {
    backInterceptors.add(fn);
    return () => backInterceptors.delete(fn);
  },
  // Helper to force focus from anywhere
  focus: () => {
    const SN = (window as any).SpatialNavigation;
    if (SN) try { SN.focus() } catch (e) {}
  }
};

export function SpatialNavProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false)

  // 🔙 Centralized Back Button Logic
  useEffect(() => {
    let backListener: any = null;

    const setupBackListener = async () => {
      backListener = await App.addListener('backButton', ({ canGoBack }) => {
        // 1. Check for registered interceptors (Modals, Players)
        for (const interceptor of Array.from(backInterceptors).reverse()) {
          if (interceptor()) {
            console.log('🔙 Regresando: Interceptado por componente');
            return;
          }
        }

        // 2. Default behavior
        if (location.pathname === '/' || location.pathname === '/catalog' || !canGoBack) {
          setIsExitDialogOpen(true)
        } else {
          window.history.back()
        }
      });
    };

    setupBackListener();
    return () => { if (backListener) backListener.remove() }
  }, [location.pathname]);

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.clear()
    setIsExitDialogOpen(false)
    navigate('/')
  }

  const handleExitApp = () => {
    App.exitApp()
  }

  // 🎮 Spatial Navigation Engine Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('spatial-navigation-js').then(() => {
        const SN = (window as any).SpatialNavigation;
        if (!SN) return;

        try {
          // 🔥 Guard: Prevent double initialization which causes "Section already exists" error
          if (!(window as any)._SN_INITIALIZED) {
            SN.init({
              rememberSource: true,
              straightOnly: false,
              straightOverlapThreshold: 0.1,
            })
            (window as any)._SN_INITIALIZED = true;
          }
          
          // Re-add sections to ensure focusable items are updated
          SN.add('sidebar', {
            selector: '.sidebar-item',
            enterTo: 'last-focused',
            nextElementByDirection: { right: '@content' }
          })

          SN.add('content', {
            selector: '.nav-item, button:not([disabled]), input, a[href]:not(.sidebar-item)',
            enterTo: 'last-focused',
            nextElementByDirection: { left: '@sidebar' }
          })

          SN.add('exit-dialog', {
            selector: '.exit-dialog-item',
            restrict: 'self-only',
            enterTo: 'default-element',
          })

          SN.makeFocusable()

          const handleFocused = (e: any) => {
            const element = e.target;
            if (element) {
              const isSidebar = element.classList.contains('sidebar-item');
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: isSidebar ? 'nearest' : 'center'
              });
            }
          };

          window.addEventListener('sn:focused', handleFocused);
          (window as any)._snHandler = handleFocused;

          // Initial focus
          setTimeout(() => SN.focus(), 500);

        } catch (e) {
          console.warn('SpatialNavigation setup error:', e)
        }
      });

      return () => {
        try {
           if ((window as any)._snHandler) {
             window.removeEventListener('sn:focused', (window as any)._snHandler);
           }
        } catch (e) {}
      }
    }
  }, []) // Solo al montar el provider

  // Manejo de Pausa/Resumen cuando hay diálogos
  useEffect(() => {
    if (typeof window !== 'undefined') {
       const SN = (window as any).SpatialNavigation;
       if (!SN) return;

       if (isExitDialogOpen) {
          try {
            SN.pause('sidebar')
            SN.pause('content')
            SN.focus('exit-dialog')
          } catch (e) {}
       } else {
          try {
            SN.resume('sidebar')
            SN.resume('content')
            SN.focus()
          } catch (e) {}
       }
    }
  }, [isExitDialogOpen])

  // Refocus on route changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && !isExitDialogOpen) {
         const SN = (window as any).SpatialNavigation;
         try { if (SN) SN.focus() } catch (e) {}
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [location.pathname, isExitDialogOpen])

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
