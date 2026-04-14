"use client"

import { useEffect, useRef, useState } from 'react'

export function VirtualRow({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true) 
  const [actualHeight, setActualHeight] = useState(300)

  useEffect(() => {
    if (!containerRef.current) return
    
    if (typeof window === 'undefined' || !window.IntersectionObserver) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setInView(true)
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
      rootMargin: '1800px 0px' // Mantiene vivas 1 o 2 filas por arriba y abajo, desmonta las demás.
    })

    observer.observe(containerRef.current)

    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current)
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} style={{ minHeight: !inView ? actualHeight : 'auto' }} className="w-full transition-opacity duration-300">
      {inView ? children : null}
    </div>
  )
}
