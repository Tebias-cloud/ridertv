import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '../../lib/supabase/client'

// WhatsApp funnel URL
const WHATSAPP_URL = "https://wa.me/56961391859?text=Hola%20Rober,%20necesito%20ayuda%20con%20Rider%20TV"

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const errorParam = searchParams.get('error')
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // 💨 Redirect Rápido: Chequeo de sesión inmediata
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // En la App de TV (Lite), siempre vamos al catálogo una vez logueados
        navigate('/catalog')
      }
    }
    checkSession()

    if (errorParam === 'suspended') {
      setErrorMsg('Tu cuenta ha expirado o ha sido suspendida. Contacta al soporte.')
    }
  }, [errorParam, navigate])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    
    if (!username || !password) {
      setErrorMsg('Usuario y Contraseña son requeridos')
      setIsLoading(false)
      return
    }

    const fakeEmail = `${username.trim().toLowerCase()}@rider.com`
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Acceso denegado. Usuario o clave incorrectos.')
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMsg('La cuenta no ha sido activada.')
        } else {
          setErrorMsg(error.message)
        }
      } else {
        // Redirección simple al catálogo
        navigate('/catalog')
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión con Rider TV. Reintenta en unos segundos.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-2xl space-y-12">
        <div className="flex flex-col items-center">
          <h1 className="text-center text-5xl md:text-6xl tracking-[0.1em] font-extrabold uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-blue-500 drop-shadow-lg">
            Rider TV
          </h1>
          <p className="mt-4 text-center text-xl text-zinc-400 font-medium tracking-wide">
            Lite Edition (TV Optimizado)
          </p>
        </div>

        <form className="mt-16 space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="relative">
              <label htmlFor="username" className="sr-only">Usuario</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                autoFocus
                className="nav-item block w-full px-5 py-5 border border-slate-800 bg-slate-900/80 backdrop-blur-sm placeholder-zinc-500 text-zinc-100 rounded-xl text-xl sm:text-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500 transition-colors duration-200 shadow-xl"
                placeholder="Nombre de Usuario"
              />
            </div>
            
            <div className="relative rounded-xl">
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="nav-item block w-full px-5 py-5 pr-16 border border-slate-800 bg-slate-900/80 backdrop-blur-sm placeholder-zinc-500 text-zinc-100 rounded-xl text-xl sm:text-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500 shadow-xl transition-colors duration-200"
                placeholder="Contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="nav-item absolute inset-y-0 right-3 my-auto h-12 w-12 flex items-center justify-center text-zinc-400 hover:text-white focus:text-white rounded-lg focus:outline-none focus:ring-4 focus:ring-red-500 focus:bg-slate-800 transition-all z-10"
                aria-label={showPassword ? "Ocultar Contraseña" : "Mostrar Contraseña"}
              >
                {showPassword ? <EyeOff className="w-7 h-7 sm:w-8 sm:h-8" /> : <Eye className="w-7 h-7 sm:w-8 sm:h-8" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded text-center animate-in fade-in duration-200">
              <p className="text-xl font-medium text-red-500">
                {errorMsg}
              </p>
            </div>
          )}

          <div className="pt-8 flex flex-col items-center">
            <button
              disabled={isLoading}
              type="submit"
              className="nav-item group relative w-full flex justify-center py-5 px-4 border border-transparent text-xl sm:text-2xl font-bold rounded-xl text-white bg-red-600 hover:bg-blue-600 focus:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-red-500 transition-colors duration-200 shadow-xl"
            >
              {isLoading ? 'Conectando...' : 'Iniciar Sesión'}
            </button>
            
            <a 
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item mt-8 text-sm text-zinc-400 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:text-red-400 rounded py-2 px-4"
            >
              ¿Necesitas una cuenta o soporte? Contáctanos por WhatsApp
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
