"use client"
import { Sidebar } from './Sidebar'

export function AppLayout({ children, account }: { children: React.ReactNode, account: any }) {
  return (
    <div className="flex h-screen bg-black overflow-hidden relative">
      <Sidebar account={account} />
      <main className="flex-1 ml-0 md:ml-[260px] h-full relative overflow-y-auto bg-zinc-950 p-4 md:p-8 pb-10 custom-scrollbar">
        {children}
      </main>
    </div>
  )
}
