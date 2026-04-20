"use client"
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Menu } from 'lucide-react'

export function AppLayout({ children, account }: { children: React.ReactNode, account: any }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-black overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-white/5 z-[55]">
        <h2 className="text-xl font-black uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-blue-500">
          Rider TV
        </h2>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-zinc-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <Sidebar 
        account={account} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 h-full relative overflow-y-auto bg-zinc-950 p-4 md:p-8 pb-10 custom-scrollbar">
        {children}
      </main>
    </div>
  )
}
