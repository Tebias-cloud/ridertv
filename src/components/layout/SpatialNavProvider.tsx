"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function SpatialNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpatialNavigation = require('spatial-navigation-js')
      try {
        SpatialNavigation.init()
        SpatialNavigation.add({
          selector: '.nav-item, button:not([disabled]), input, a[href]'
        })
        SpatialNavigation.makeFocusable()
        
        SpatialNavigation.set({
          rememberSource: true,
          straightOnly: false,
          straightOverlapThreshold: 0.5,
        })

        // 🔥 UX: Auto-scroll centrado para TV
        const handleFocused = (e: any) => {
          const element = e.target;
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
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

  return <>{children}</>
}
