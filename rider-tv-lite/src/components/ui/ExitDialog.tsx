import { LogOut, Power } from 'lucide-react'

interface ExitDialogProps {
  isOpen: boolean
  onClose: () => void
  onExit: () => void
  onLogout: () => void
}

export function ExitDialog({ isOpen, onClose, onExit, onLogout }: ExitDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-white/10 p-8 sm:p-12 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-sm w-full mx-4 flex flex-col items-center text-center">
        
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-rose-500/20">
          <Power className="w-10 h-10 text-rose-500 drop-shadow-md" />
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">¿Deseas Salir?</h3>
        <p className="text-zinc-400 text-sm sm:text-base font-medium leading-relaxed mb-10">
          Estás a punto de abandonar Rider TV. ¿Prefieres cerrar la sesión actual o simplemente cerrar la aplicación?
        </p>

        <div className="flex flex-col w-full gap-4">
          <button 
            onClick={onExit}
            className="nav-item exit-dialog-item w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 outline-none focus:ring-4 focus:ring-white"
          >
            <Power className="w-5 h-5" />
            Cerrar Aplicación
          </button>

          <button 
            onClick={onLogout}
            className="nav-item exit-dialog-item w-full py-4 bg-zinc-800 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 border border-white/5 outline-none focus:ring-4 focus:ring-rose-500"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>

          <button 
            onClick={onClose}
            className="nav-item exit-dialog-item w-full py-4 text-zinc-500 font-bold hover:text-white transition-colors outline-none"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
