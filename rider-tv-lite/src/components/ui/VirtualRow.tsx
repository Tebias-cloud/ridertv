"use client"

import { useEffect, useRef, useState } from 'react'

export function VirtualRow({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true) 
  const [actualHeight, setActualHeight] = useState(300)
  const [hasBeenInView, setHasBeenInView] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    
    if (typeof window === 'undefined' || !window.IntersectionObserver) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setInView(true)
          setHasBeenInView(true)
        } else {
          // Update height before unmounting children to prevent scroll jumps
          if (containerRef.current) {
             const h = containerRef.current.getBoundingClientRect().height;
             if (h > 0) setActualHeight(h);
          }
          setInView(false)
        }
      })
    }, {
      rootMargin: '2000px 0px' // 🔥 AMORTIGUACIÓN AGRESIVA: Evita que las filas "desaparezcan" al scrollar.
    })

    observer.observe(containerRef.current)

    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current)
      observer.disconnect()
    }
  }, [])

  // Si ya fue vista una vez, mantenemos el contenido cargado para evitar el parpadeo del re-mount,
  // pero podemos ocultarlo visualmente si está muy lejos para ahorrar renderizado de GPU.
  const shouldRender = inView || hasBeenInView;

  return (
    <div 
      ref={containerRef} 
      style={{ 
        minHeight: !shouldRender ? actualHeight : 'auto'
      }} 
      className="w-full transition-opacity duration-300"
    >
      {shouldRender ? children : null}
    </div>
  )
}
