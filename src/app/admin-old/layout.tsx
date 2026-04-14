import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 hidden md:block">
        <div className="mb-8 font-bold text-xl text-white">Rider Admin</div>
        <nav className="space-y-2">
          <a href="/admin" className="block px-4 py-2 rounded bg-zinc-800/50 text-[var(--color-rider-blue)]">Dashboard / General</a>
          <a href="/admin" className="block px-4 py-2 rounded hover:bg-zinc-800/30 text-zinc-400 transition-colors">Usuarios</a>
          <a href="/admin" className="block px-4 py-2 rounded hover:bg-zinc-800/30 text-zinc-400 transition-colors">Cuentas IPTV</a>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="md:hidden border-b border-zinc-800 p-4 bg-zinc-900 flex justify-between items-center">
            <span className="font-bold text-lg text-white">Rider Admin</span>
            <button className="text-zinc-400 hover:text-white">☰</button>
        </header>
        {children}
      </main>
    </div>
  )
}
