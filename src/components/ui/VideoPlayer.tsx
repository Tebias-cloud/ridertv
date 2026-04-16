"use client"

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { useRouter } from 'next/navigation'
import { X, Play, Pause, Volume2, VolumeX, Maximize, MonitorX, Settings, AlertCircle, ExternalLink } from 'lucide-react'

import { Capacitor } from '@capacitor/core'
import { VideoPlayer as CapacitorVideoPlayer } from '@capgo/capacitor-video-player'

interface VideoPlayerProps {
  streamUrl: string
  isLive?: boolean
}

function TimeDisplay({ videoRef, isLive }: { videoRef: React.RefObject<HTMLVideoElement | null>, isLive?: boolean }) {
  const timeRef = useRef<HTMLSpanElement>(null)
  
  useEffect(() => {
    if (isLive) return
    let animationFrameId: number
    const updateTime = () => {
      if (videoRef.current && timeRef.current) {
        const current = videoRef.current.currentTime || 0
        const duration = videoRef.current.duration || 0
        
        const formatTime = (time: number) => {
          if (isNaN(time)) return "00:00"
          const h = Math.floor(time / 3600)
          const m = Math.floor((time % 3600) / 60)
          const s = Math.floor(time % 60)
          if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
          return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        }
        
        timeRef.current.textContent = `${formatTime(current)} / ${formatTime(duration)}`
      }
      animationFrameId = requestAnimationFrame(updateTime)
    }
    animationFrameId = requestAnimationFrame(updateTime)
    return () => cancelAnimationFrame(animationFrameId)
  }, [videoRef, isLive])

  if (isLive) return <span className="text-white text-xs sm:text-sm font-bold tracking-wider text-rose-500 uppercase flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span> EN VIVO</span>
  return <span ref={timeRef} className="text-white text-xs sm:text-sm font-medium tracking-widest opacity-80">00:00 / 00:00</span>
}

function ProgressBar({ videoRef, isLive }: { videoRef: React.RefObject<HTMLVideoElement | null>, isLive?: boolean }) {
  const progressRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLive) return
    let animationFrameId: number
    const updateProgress = () => {
      if (videoRef.current && progressRef.current) {
        const current = videoRef.current.currentTime || 0
        const duration = videoRef.current.duration || 1
        const percentage = (current / duration) * 100
        progressRef.current.style.width = `${percentage}%`
      }
      animationFrameId = requestAnimationFrame(updateProgress)
    }
    animationFrameId = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(animationFrameId)
  }, [videoRef, isLive])

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLive || !videoRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    if (videoRef.current.duration) {
      videoRef.current.currentTime = pos * videoRef.current.duration
    }
  }

  if (isLive) return <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>

  return (
    <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer group/progress transform hover:scale-y-150 transition-transform origin-bottom" onClick={handleSeek} ref={containerRef}>
      <div ref={progressRef} className="absolute top-0 left-0 h-full bg-[var(--color-rider-blue)] w-0 pointer-events-none">
         <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
      </div>
    </div>
  )
}

export function VideoPlayer({ streamUrl, isLive = false }: VideoPlayerProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [hasFatalError, setHasFatalError] = useState(false)
  const [requiresInteraction, setRequiresInteraction] = useState(false)
  const [loadingNative, setLoadingNative] = useState(false)
  
  // Custom Controls State
  const [isPlaying, setIsPlaying] = useState(true)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  
  // HLS Quality State
  const [hlsLevels, setHlsLevels] = useState<{index: number, height: number, name: string}[]>([])
  const [currentLevel, setCurrentLevel] = useState<number>(-1)
  const [showSettings, setShowSettings] = useState(false)

  // Autohide controls logic
  useEffect(() => {
    let timeout: NodeJS.Timeout
    const handleMouseMove = () => {
      setShowControls(true)
      clearTimeout(timeout)
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 3000)
      }
    }
    
    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', () => { if (isPlaying) setShowControls(false) })
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseleave', () => setShowControls(false))
      }
      clearTimeout(timeout)
    }
  }, [isPlaying])

  // Smart TV Hotkeys: Enter (Play/Pause), M (Mute), Arrows (Seek)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return
      
      // Toggle play with Enter (Native TV OK button)
      if (e.key === 'Enter') {
        e.preventDefault()
        if (videoRef.current.paused) {
          const p = videoRef.current.play()
          if (p !== undefined) p.catch(err => { if (err.name !== 'AbortError') console.error(err) })
        }
        else videoRef.current.pause()
      }
      // Toggle mute with "m" or "M"
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault()
        videoRef.current.muted = !videoRef.current.muted
        setIsMuted(videoRef.current.muted)
        if (!videoRef.current.muted && videoRef.current.volume === 0) setVolume(1)
      }
      // Scrubbing with D-Pad
      if (!isLive) {
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration || Infinity)
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0)
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isLive])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) return
    
    // 🔥 Intercepción Crítica: Forzar HTTPS y quitar puerto 8080 para evitar Mixed Content
    let safeUrl = streamUrl;
    if (safeUrl.startsWith('http://')) {
      safeUrl = safeUrl.replace('http://', 'https://').replace(':8080', '');
    }

    console.log("🔗 URL del stream solicitada:", safeUrl)
    setErrorMsg(null)
    setHasFatalError(false)
    setHlsLevels([])
    setCurrentLevel(-1)

    // ==========================================
    // INTEGRACIÓN NATIVA (ANDROID TV / iOS) - SOLO VOD
    // ==========================================
    if (typeof window !== 'undefined' && Capacitor?.isNativePlatform() && !isLive) {
      let isExiting = false;
      const initNative = async () => {
        setLoadingNative(true);
        try {
          // Escuchar eventos ANTES de inicializar para evitar pérdida de señal o errores de timing
          if ((CapacitorVideoPlayer as any).addListener) {
            ;(CapacitorVideoPlayer as any).removeAllListeners?.().catch(() => {});
            
            ;(CapacitorVideoPlayer as any).addListener('jeepCapVideoPlayerExit', () => {
              if (isExiting) return;
              isExiting = true;
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            });

            ;(CapacitorVideoPlayer as any).addListener('jeepCapVideoPlayerEnded', () => {
              if (isExiting) return;
              isExiting = true;
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            });
          }

          await CapacitorVideoPlayer.initPlayer({
            mode: 'fullscreen',
            url: safeUrl,
            playerId: 'rider-fullscreen',
            componentTag: 'capacitor-video-player',
            chromecast: false, // Desactivar para evitar crash de CastContext en Android TV
            volume: 1.0,      // Forzar volumen al máximo
            isMuted: false,   // Asegurar que no inicie silenciado
            headers: {
              'User-Agent': 'IPTVSmarters/1.0' // El servidor IPTV requiere un UA conocido para liberar el stream
            }
          } as any);

          // Forzado de volumen adicional para asegurar que el motor de audio nativo se active
          if ((CapacitorVideoPlayer as any).setVolume) {
            await (CapacitorVideoPlayer as any).setVolume({
              playerId: 'rider-fullscreen',
              volume: 1.0
            });
          }
          
          setLoadingNative(false);
        } catch (err) {
          console.error("Fallo al iniciar CapacitorVideoPlayer:", err);
          setErrorMsg("Error iniciando el motor nativo del dispositivo. Intenta nuevamente.");
          setHasFatalError(true);
          setLoadingNative(false);
        }
      };

      initNative();

      return () => {
        isExiting = true;
        if ((CapacitorVideoPlayer as any).removeAllListeners) {
          ;(CapacitorVideoPlayer as any).removeAllListeners().catch(() => {});
        }
        CapacitorVideoPlayer.stopAllPlayers().catch(() => {});
      };
    }

    // ==========================================
    // INTEGRACIÓN WEB (HTML5 / HLS.js)
    // ==========================================
    const webVideo = videoRef.current
    if (!webVideo) return

    let hls: Hls

    const playVideo = () => {
      webVideo.play().then(() => setIsPlaying(true)).catch(error => {
        if (error.name === 'NotAllowedError' || (error.message && error.message.includes('interact'))) {
          setRequiresInteraction(true)
          setIsPlaying(false)
        } else if (error.name !== 'AbortError') {
          console.error(error)
        }
      })
    }

    const handleVideoError = () => {
      console.error('❌ Video Player Native Error:', webVideo.error)
      setErrorMsg(`Error nativo de reproducción. Código: ${webVideo.error?.code || 'Desconocido'}`)
    }
    webVideo.addEventListener('error', handleVideoError)
    
    // Sync React state with video native state
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    webVideo.addEventListener('play', handlePlay)
    webVideo.addEventListener('pause', handlePause)

    const isHls = safeUrl.includes('.m3u8') || safeUrl.includes('.ts')

    const playNativeUrl = () => {
      webVideo.src = safeUrl
      webVideo.addEventListener('loadedmetadata', () => {
        playVideo()
      }, { once: true })
      webVideo.load()
    }

    if (isHls) {
      const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

      if (Hls.isSupported() && !isIOS) {
        // Prioridad total a HLS.js en Android/PC (El nativo suele fallar y arrojar Error 4 en TV WebViews si Capacitor falla o es navegador)
        hls = new Hls({
          maxBufferSize: 0,
          maxBufferLength: 30,
          enableWorker: true,
          lowLatencyMode: true,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
          manifestLoadingTimeOut: 10000,
          fragLoadingTimeOut: 20000,
        })
        
        let mediaRecovered = false;
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            if ((data.details === 'fragParsingError' || data.type === Hls.ErrorTypes.MEDIA_ERROR) && !mediaRecovered) {
              mediaRecovered = true;
              hls.recoverMediaError()
            } else {
              setErrorMsg('Error al cargar el stream. Posible bloqueo de red o fuente inactiva.')
              setHasFatalError(true)
              hls.destroy()
            }
          }
        })
        
        hls.loadSource(safeUrl)
        hls.attachMedia(webVideo)
        
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          if (data.levels && data.levels.length > 0) {
            const levels = data.levels.map((l: any, i: number) => ({ index: i, height: l.height, name: `${l.height}p` }))
            setHlsLevels(levels)
          }
          playVideo()
        })
        hlsRef.current = hls
      } else if (webVideo.canPlayType('application/vnd.apple.mpegurl')) {
        playNativeUrl()
      } else {
        playNativeUrl()
      }
    } else {
      playNativeUrl()
    }

    return () => {
      if (hls) hls.destroy()
      if (webVideo) {
        webVideo.removeEventListener('error', handleVideoError)
        webVideo.removeEventListener('play', handlePlay)
        webVideo.removeEventListener('pause', handlePause)
        webVideo.pause()
        webVideo.removeAttribute('src')
        webVideo.load()
      }
    }
  }, [streamUrl])

  // Volume Effect
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  // Quality Selection Handler
  const changeQuality = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex
      setCurrentLevel(levelIndex)
      setShowSettings(false)
    }
  }

  // Custom Controls Handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        const p = videoRef.current.play()
        if (p !== undefined) p.catch(err => { if (err.name !== 'AbortError') console.error(err) })
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value)
    setVolume(newVol)
    if (newVol > 0 && isMuted) setIsMuted(false)
    if (newVol === 0) setIsMuted(true)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const toggleSpeed = () => {
    const nextSpeed = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 2 : 1
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed
    }
    setPlaybackRate(nextSpeed)
  }

  const isNativeVOD = typeof window !== 'undefined' && Capacitor?.isNativePlatform() && !isLive;

  if (isNativeVOD && loadingNative && !hasFatalError) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white relative z-[100]">
        <button 
           onClick={() => router.push('/catalog')}
           className="absolute top-8 right-8 z-[110] p-4 bg-zinc-900/80 rounded-full border border-white/20 text-white"
        >
          <X className="w-8 h-8" />
        </button>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-500 mb-6"></div>
        <p className="font-black tracking-[0.2em] text-lg uppercase animate-pulse">Iniciando ExoPlayer Nativo...</p>
        <p className="text-zinc-500 text-sm mt-2">Soporte para 4K y códecs avanzados de TV</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden ${!showControls && isPlaying ? 'cursor-none' : 'cursor-default'}`}
    >
      {/* Botón Flotante Volver / Cerrar */}
      {!requiresInteraction && (
        <button 
          onClick={() => router.push('/catalog')}
          className={`absolute top-4 right-4 z-[60] p-2 md:p-3 bg-black/40 hover:bg-black/80 backdrop-blur-md rounded-full text-white border border-white/10 shadow-lg transition-all hover:scale-110 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          title="Volver al Catálogo"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      )}

      {requiresInteraction && (
        <div 
          className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer transition-opacity"
          onClick={() => {
            if (videoRef.current) {
              const p = videoRef.current.play()
              if (p !== undefined) p.catch(err => { if (err.name !== 'AbortError') console.error(err) })
              setRequiresInteraction(false)
              setIsPlaying(true)
            }
          }}
        >
          <button className="flex flex-col items-center justify-center group">
             <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[var(--color-rider-blue)]/20 border border-[var(--color-rider-blue)]/50 shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:scale-105 transition-transform backdrop-blur-md mb-4 group-hover:bg-[var(--color-rider-blue)]/40">
               <svg className="w-10 h-10 ml-2 text-white" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M8 5v14l11-7z" />
               </svg>
             </div>
             <span className="text-white font-bold tracking-widest text-sm uppercase opacity-80 group-hover:opacity-100">Click para Iniciar Sonido</span>
          </button>
        </div>
      )}

      {hasFatalError ? (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-xl transition-all duration-500 animate-in fade-in p-4">
           <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-[280px] sm:max-w-xs text-center backdrop-blur-2xl mx-auto">
             <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 shadow-inner ring-1 ring-rose-500/20">
               <MonitorX className="w-8 h-8 text-rose-500 animate-pulse drop-shadow-md" />
             </div>
             <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">Señal Interrumpida</h3>
             <p className="text-zinc-400 text-xs sm:text-sm font-medium leading-snug mb-6">
               Este canal o contenido no está transmitiendo en este momento. Por favor, intenta con otro.
             </p>
             <button 
               onClick={() => router.push('/catalog')}
               className="bg-white/10 hover:bg-white hover:text-black border border-white/20 hover:scale-105 active:scale-95 transition-all text-sm font-bold w-full py-2.5 rounded-xl drop-shadow-lg flex items-center justify-center gap-2"
             >
               Ver otro canal
             </button>
           </div>
        </div>
      ) : errorMsg && !hasFatalError ? (
        <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-zinc-950 px-4 text-center z-50">
          {errorMsg}
        </div>
      ) : !streamUrl ? (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 z-50">
          Selecciona un canal para reproducir
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            onClick={togglePlay}
            controls={false}
            className="w-full h-full object-contain relative z-[40] cursor-pointer"
            autoPlay
            playsInline
            muted={isMuted}
            style={{ backgroundColor: '#000' }}
          />

          {/* CUSTOM CONTROLS OVERLAY */}
          <div 
            className={`absolute bottom-0 left-0 right-0 pt-16 pb-4 px-4 sm:px-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[60] transition-opacity duration-300 flex flex-col justify-end ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ProgressBar */}
            <ProgressBar videoRef={videoRef} isLive={isLive} />

            <div className="flex items-center gap-6 mt-4 w-full">
              {/* Play/Pause */}
              <button 
                onClick={togglePlay}
                className="text-white hover:text-[var(--color-rider-blue)] transition-colors hover:scale-110 active:scale-95"
              >
                {isPlaying ? <Pause className="w-10 h-10 sm:w-14 sm:h-14 fill-current drop-shadow-md" /> : <Play className="w-10 h-10 sm:w-14 sm:h-14 fill-current drop-shadow-md" />}
              </button>

              {/* Volume Control (Only for Pointer Devices like PC) */}
              <div className="hidden lg:flex items-center gap-4">
                <button onClick={toggleMute} className="text-white hover:text-[var(--color-rider-blue)] transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-24 transition-all duration-300 accent-[var(--color-rider-blue)] cursor-pointer h-1.5 bg-white/20 rounded-lg appearance-none"
                />
              </div>

              {/* Time Display */}
              <div className="text-lg sm:text-2xl">
                <TimeDisplay videoRef={videoRef} isLive={isLive} />
              </div>

              <div className="flex-1"></div>

              {/* VOD Codec Helpers */}
              {!isLive && (
                <div className="flex items-center gap-1 sm:gap-2 mr-2">
                  <div className="group relative flex items-center">
                    <button className="text-zinc-400 hover:text-white transition-colors p-2 cursor-help outline-none">
                      <AlertCircle className="w-5 h-5 drop-shadow" />
                    </button>
                    <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-4 w-64 bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] text-center">
                      Si experimentas falta de audio en estrenos 4K, el códec (Dolby AC-3/DTS) requiere un Smart TV o usar la opción <b className="text-white">"Ver en externo"</b> debido a licencias de tu navegador web.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-700"></div>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      
                      // Pausa suave (sin destrozar el buffer para evitar penalizaciones por parte del servidor IPTV)
                      if (videoRef.current) videoRef.current.pause();
                      setIsPlaying(false);
                      
                      // Formato M3U Clásico Exacto Original
                      const m3uContent = "#EXTM3U\n#EXTINF:-1, Rider VOD\n" + streamUrl;
                      const blob = new Blob([m3uContent], { type: 'application/vnd.apple.mpegurl' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'play.m3u';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="text-white hover:text-[var(--color-rider-blue)] p-2 transition-colors group relative"
                    title="Ver en Reproductor Externo (ej. VLC)"
                  >
                    <ExternalLink className="w-5 h-5 drop-shadow group-hover:scale-110 active:scale-95 transition-transform" />
                  </button>
                </div>
              )}

              {/* Speed Settings */}
              {!isLive && (
                <button 
                  onClick={toggleSpeed}
                  className="text-white hover:text-[var(--color-rider-blue)] font-black text-sm tracking-widest px-2 transition-colors drop-shadow"
                >
                  {playbackRate}x
                </button>
              )}

              {/* Quality Settings UI */}
              <div className="relative">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`text-white hover:text-[var(--color-rider-blue)] transition-colors ml-2 p-1.5 rounded-full hover:bg-white/10 ${showSettings ? 'rotate-90 bg-white/10' : ''}`}
                >
                  <Settings className="w-5 h-5 drop-shadow" />
                </button>

                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-4 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden w-48 animate-in slide-in-from-bottom-2 fade-in duration-200 z-[80]">
                     <div className="px-4 py-3 bg-white/5 border-b border-white/5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Resolución</span>
                     </div>
                     <div className="flex flex-col py-2">
                       {hlsLevels.length <= 1 ? (
                         <div className="px-5 py-3 text-sm text-zinc-500 font-medium italic">
                           Calidad Original (Fuente única)
                         </div>
                       ) : (
                         <>
                           <button 
                             onClick={() => changeQuality(-1)}
                             className={`px-5 py-2.5 text-left text-sm font-bold transition-colors hover:bg-white/10 ${currentLevel === -1 ? 'text-[var(--color-rider-blue)]' : 'text-zinc-300'}`}
                           >
                             Automático {currentLevel === -1 && '✓'}
                           </button>
                           {hlsLevels.map((lvl) => (
                             <button 
                               key={lvl.index}
                               onClick={() => changeQuality(lvl.index)}
                               className={`px-5 py-2.5 text-left text-sm font-bold transition-colors hover:bg-white/10 ${currentLevel === lvl.index ? 'text-[var(--color-rider-blue)]' : 'text-white'}`}
                             >
                               {lvl.name} {currentLevel === lvl.index && '✓'}
                             </button>
                           ))}
                         </>
                       )}
                     </div>
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button 
                onClick={toggleFullscreen}
                className="text-white hover:text-[var(--color-rider-blue)] transition-colors ml-4 hover:scale-110 active:scale-95"
              >
                <Maximize className="w-6 h-6 drop-shadow" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

