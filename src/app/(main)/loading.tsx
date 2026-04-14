import { Tv } from 'lucide-react'

export default function Loading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-zinc-950">
      <div className="relative">
        <Tv className="w-16 h-16 text-[var(--color-rider-blue)] animate-pulse drop-shadow-[0_0_30px_rgba(37,99,235,0.8)]" />
        <div className="absolute inset-0 bg-[var(--color-rider-blue)]/20 blur-2xl rounded-full animate-pulse"></div>
      </div>
      <h3 className="mt-8 text-xl font-bold text-white tracking-widest uppercase">
        Conectando a satélites
      </h3>
      <div className="w-48 h-1 bg-zinc-900 rounded-full mt-4 overflow-hidden relative">
        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-[var(--color-rider-blue)] w-1/2 animate-bounce flex">
            <div className="w-full h-full animate-[progress_1s_ease-in-out_infinite_alternate]" style={{
                background: 'linear-gradient(90deg, rgba(239,68,68,1) 0%, rgba(37,99,235,1) 100%)'
            }}></div>
        </div>
      </div>
    </div>
  )
}
