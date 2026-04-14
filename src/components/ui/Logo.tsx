import React from 'react'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 font-sans ${className}`}>
      <div className="flex items-center">
        {/* Play triangle stylized */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[var(--color-rider-blue)] mr-1"
        >
          <path d="M6 4L20 12L6 20V4Z" fill="currentColor" />
          {/* Fluid line intersecting */}
          <path d="M4 12C10 2 12 24 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
        </svg>
        
        <span className="text-2xl font-black tracking-tight text-[var(--color-rider-red)]">
          Rider
        </span>
        <span className="text-2xl font-bold tracking-tight text-[var(--color-rider-blue)]">
          IPTV
        </span>
      </div>
    </div>
  )
}
