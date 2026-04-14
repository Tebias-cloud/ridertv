"use client"
import { Sidebar } from './Sidebar'

export function AppLayout({ children, account }: { children: React.ReactNode, account: any }) {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar account={account} />
      <main className="flex-1 ml-0 md:ml-[260px] relative overflow-x-hidden min-h-screen bg-zinc-950 p-6 md:p-8 lg:p-12 pb-20">
        {children}
      </main>
    </div>
  )
}
