

import { useEffect, useState } from 'react'
import { SplashScreen } from '@capacitor/splash-screen'

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // 1. Ocultar splash screen nativo cuando el JS esté listo
    const init = async () => {
      try {
        // Pequeño delay para asegurar que el primer paint de React ya sucedió
        setTimeout(async () => {
          await SplashScreen.hide()
          setIsReady(true)
          console.log('⚡ [AppInitializer] Splash Screen hidden, App Ready');
        }, 500);
      } catch (e) {
        // Fallback si no estamos en Capacitor
        setIsReady(true)
        console.warn('AppInitializer: Capacitor not detected or SplashScreen failed');
      }
    }

    init()
  }, [])

  return (
    <div className={`app-container flex-1 flex flex-col ${isReady ? 'app-ready' : ''}`}>
      {children}
    </div>
  )
}
