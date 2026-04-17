"use client"
import { Sidebar } from './Sidebar'

export function AppLayout({ children, account }: { children: React.ReactNode, account: any }) {
  return (
    <div className="flex flex-row h-screen bg-black overflow-hidden">
      <Sidebar account={account} />
      <main className="flex-1 h-full relative overflow-y-auto bg-zinc-950 p-4 md:p-8 pb-10 custom-scrollbar">
        {children}
      </main>
    </div>
  )
}
