"use client"

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { useRouter } from 'next/navigation'
import { X, Play, Pause, Volume2, VolumeX, Maximize, MonitorX, Settings, AlertCircle, ExternalLink } from 'lucide-react'

import { Capacitor } from '@capacitor/core'
import { VideoPlayer as CapacitorVideoPlayer } from '@capgo/capacitor-video-player'
import { App } from '@capacitor/app'

interface VideoPlayerProps {
  streamUrl: string
  isLive?: boolean
  onClose?: () => void
  logoUrl?: string // Added logo prop
}

const upgradeToHttps = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://')) return url.replace('http://', 'https://');
  return url;
};

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
      
      const activeElement = document.activeElement;
      const isNavFocus = activeElement?.classList.contains('nav-item');

      if (e.key.toLowerCase() === 'm') {
        e.preventDefault()
        videoRef.current.muted = !videoRef.current.muted
        setIsMuted(videoRef.current.muted)
        if (!videoRef.current.muted && videoRef.current.volume === 0) setVolume(1)
        return;
      }

      if (isNavFocus) return;

      if (e.key === 'Enter') {
        e.preventDefault()
        if (videoRef.current.paused) {
          const p = videoRef.current.play()
          if (p !== undefined) p.catch(err => { if (err.name !== 'AbortError') console.error(err) })
        }
        else videoRef.current.pause()
        setShowControls(true);
      }

      if (!isLive) {
        if (e.key === 'ArrowRight') {
          videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration || Infinity)
          setShowControls(true);
        }
        if (e.key === 'ArrowLeft') {
          videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0)
          setShowControls(true);
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isLive])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) return
    
    const getRawUrl = (url: string): string => {
      if (typeof url !== 'string') return url;
      if (url.includes('_capacitor_http_interceptor_')) {
        try {
          const urlObj = new URL(url);
          const raw = urlObj.searchParams.get('url');
          if (raw) return decodeURIComponent(raw);
        } catch (e) {
          console.error("Error decodificando URL de Capacitor:", e);
        }
      }
      return url;
    };

    let safeUrl = getRawUrl(streamUrl);
    setErrorMsg(null)
    setHasFatalError(false)
    setHlsLevels([])
    setCurrentLevel(-1)

    const isNativePlatform = Capacitor.isNativePlatform();

    let backListener: any = null;
    const setupBackListener = async () => {
      backListener = await App.addListener('backButton', () => {
        if (isNativePlatform) {
          CapacitorVideoPlayer.stopAllPlayers().catch(() => {});
        }
        if (onClose) {
          onClose();
        } else {
          window.location.href = '/catalog.html';
        }
      });
    };
    setupBackListener();

    if (typeof window !== 'undefined' && isNativePlatform) {
      let isExiting = false;

      const initNative = async () => {
        setLoadingNative(true);
        try {
          if ((CapacitorVideoPlayer as any).addListener) {
            ;(CapacitorVideoPlayer as any).removeAllListeners?.().catch(() => {});
            
            ;(CapacitorVideoPlayer as any).addListener('jeepCapVideoPlayerExit', () => {
              if (isExiting) return;
              isExiting = true;
              if (onClose) onClose();
              else window.location.href = '/catalog.html';
            });

            ;(CapacitorVideoPlayer as any).addListener('jeepCapVideoPlayerEnded', () => {
              if (isExiting) return;
              isExiting = true;
              if (onClose) onClose();
              else window.location.href = '/catalog.html';
            });
            
            ;(CapacitorVideoPlayer as any).addListener('jeepCapVideoPlayerError', (data: any) => {
              console.error("Native Player Error Signal:", data);
              setErrorMsg("Error fatal en el motor nativo. Reintentando...");
              setHasFatalError(true);
              CapacitorVideoPlayer.stopAllPlayers().catch(() => {});
              setTimeout(() => {
                if (onClose) onClose();
                else window.location.href = '/catalog.html';
              }, 2000);
            });
          }

          const rawUrl = getRawUrl(safeUrl);

          await CapacitorVideoPlayer.initPlayer({
            mode: 'fullscreen',
            url: rawUrl,
            playerId: 'rider-fullscreen',
            componentTag: 'capacitor-video-player',
            chromecast: false,
            volume: 1.0,
            isMuted: false,
            headers: {
              'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
              'Referer': rawUrl.split('/').slice(0, 3).join('/')
            }
          } as any);
          
          setLoadingNative(false);
        } catch (err) {
          setErrorMsg("No se pudo iniciar el motor nativo. Regresando...");
          setHasFatalError(true);
          setLoadingNative(false);
          CapacitorVideoPlayer.stopAllPlayers().catch(() => {});
          setTimeout(() => router.push('/catalog'), 2500);
        }
      };

      initNative();

      return () => {
        isExiting = true;
        if (backListener) backListener.remove();
        if ((CapacitorVideoPlayer as any).removeAllListeners) {
          ;(CapacitorVideoPlayer as any).removeAllListeners().catch(() => {});
        }
        CapacitorVideoPlayer.stopAllPlayers().catch(() => {});
      };
    }

    if (isNativePlatform) return;

    const webVideo = videoRef.current
    if (!webVideo) return

    let hls: Hls

    const playVideo = () => {
      webVideo.play().then(() => setIsPlaying(true)).catch(error => {
        if (error.name === 'NotAllowedError' || (error.message && error.message.includes('interact'))) {
          setRequiresInteraction(true)
          setIsPlaying(false)
        }
      })
    }

    const handleVideoError = () => {
      setErrorMsg(`Error nativo de reproducción. Código: ${webVideo.error?.code || 'Desconocido'}`)
    }
    webVideo.addEventListener('error', handleVideoError)
    
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
        hls = new Hls({
          maxBufferSize: 0,
          maxBufferLength: 30,
          enableWorker: true,
          lowLatencyMode: true,
        })
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            hls.destroy()
            setErrorMsg('Error al cargar el stream.')
            setHasFatalError(true)
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
  }, [streamUrl, router])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  const changeQuality = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex
      setCurrentLevel(levelIndex)
      setShowSettings(false)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause()
      else videoRef.current.play().catch(() => {})
    }
  }

  const toggleMute = () => setIsMuted(!isMuted)

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value)
    setVolume(newVol)
    if (newVol > 0 && isMuted) setIsMuted(false)
    if (newVol === 0) setIsMuted(true)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) containerRef.current.requestFullscreen().catch(() => {})
    else document.exitFullscreen()
  }

  const toggleSpeed = () => {
    const nextSpeed = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 2 : 1
    if (videoRef.current) videoRef.current.playbackRate = nextSpeed
    setPlaybackRate(nextSpeed)
  }

  const isNativePlatform = typeof window !== 'undefined' && Capacitor?.isNativePlatform();

  if (isNativePlatform && loadingNative && !hasFatalError) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-[100] animate-in fade-in duration-500">
        <button onClick={() => { if (onClose) onClose(); else window.location.href = '/catalog.html'; }} className="absolute top-10 right-10 z-[110] p-5 bg-zinc-900/90 rounded-full border border-white/20 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all">
          <X className="w-10 h-10" />
        </button>
        <div className="relative">
          <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-rose-500 mb-8 shadow-[0_0_30px_rgba(244,63,94,0.4)]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <Play className="w-8 h-8 text-rose-500 animate-pulse" fill="currentColor" />
          </div>
        </div>
        <p className="font-black tracking-[0.3em] text-2xl uppercase animate-pulse bg-clip-text text-transparent bg-gradient-to-r from-zinc-200 to-zinc-500">
          Sintonizando...
        </p>
        <p className="text-zinc-600 text-sm mt-4 font-bold tracking-widest uppercase opacity-50">Motor Nativo Rider TV</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden ${!showControls && isPlaying ? 'cursor-none' : 'cursor-default'}`}>
      {!requiresInteraction && (
        <button onClick={() => { if (onClose) onClose(); else window.location.href = '/catalog.html'; }} className={`nav-item absolute top-4 right-4 z-[60] p-2 md:p-3 bg-black/40 hover:bg-black/80 backdrop-blur-md rounded-full text-white border border-white/10 shadow-lg transition-all hover:scale-110 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      )}

      {requiresInteraction && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer" onClick={() => { if (videoRef.current) { videoRef.current.play(); setRequiresInteraction(false); setIsPlaying(true); } }}>
          <button className="flex flex-col items-center justify-center group">
             <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[var(--color-rider-blue)]/20 border border-[var(--color-rider-blue)]/50 shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:scale-105 transition-transform backdrop-blur-md mb-4">
               <Play className="w-10 h-10 ml-2 text-white" fill="currentColor" />
             </div>
             <span className="text-white font-bold tracking-widest text-sm uppercase opacity-80 group-hover:opacity-100">Click para Iniciar Sonido</span>
          </button>
        </div>
      )}

      {hasFatalError ? (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-xl p-4">
           <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl w-full max-w-xs text-center backdrop-blur-2xl">
             <MonitorX className="w-16 h-16 text-rose-500 mb-4 animate-pulse" />
             <h3 className="text-xl font-black text-white mb-2">Señal Interrumpida</h3>
             <p className="text-zinc-400 text-sm mb-6">Este contenido no está transmitiendo en este momento.</p>
             <button onClick={() => { if (onClose) onClose(); else window.location.href = '/catalog.html'; }} className="bg-white text-black font-bold w-full py-3 rounded-xl hover:scale-105 transition-transform">Ver otro canal</button>
           </div>
        </div>
      ) : errorMsg && !hasFatalError ? (
        <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-zinc-950 px-4 text-center z-50">{errorMsg}</div>
      ) : !streamUrl ? (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 z-50">Selecciona un canal</div>
      ) : (
        <>
          {!isNativePlatform && (
            <video ref={videoRef} onClick={togglePlay} className="w-full h-full object-contain relative z-[40]" autoPlay playsInline muted={isMuted} />
          )}

          <div className={`absolute bottom-0 left-0 right-0 pt-16 pb-4 px-8 bg-gradient-to-t from-black via-black/40 to-transparent z-[60] transition-opacity duration-300 flex flex-col justify-end ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
            <ProgressBar videoRef={videoRef} isLive={isLive} />

            <div className="flex items-center gap-6 mt-4 w-full">
              {!isNativePlatform && (
                <button onClick={togglePlay} className="nav-item text-white hover:text-[var(--color-rider-blue)] transition-colors">
                  {isPlaying ? <Pause className="w-10 h-10 sm:w-14 sm:h-14 fill-current" /> : <Play className="w-10 h-10 sm:w-14 sm:h-14 fill-current" />}
                </button>
              )}

              <div className="hidden lg:flex items-center gap-4">
                <button onClick={toggleMute} className="text-white hover:text-[var(--color-rider-blue)] transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-24 accent-[var(--color-rider-blue)] cursor-pointer" />
              </div>

              <div className="text-lg sm:text-2xl"><TimeDisplay videoRef={videoRef} isLive={isLive} /></div>
              <div className="flex-1"></div>

              {!isLive && (
                <div className="flex items-center gap-2 mr-2">
                  <div className="group relative">
                    <button className="nav-item text-zinc-400 hover:text-white p-2 outline-none">
                      <AlertCircle className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-4 w-64 bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100]">
                      Si no hay audio, usa <b className="text-white">"Ver en externo"</b>.
                    </div>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); if (videoRef.current) videoRef.current.pause(); setIsPlaying(false); const m3u = "#EXTM3U\n#EXTINF:-1, Rider VOD\n" + streamUrl; const blob = new Blob([m3u], { type: 'application/vnd.apple.mpegurl' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'play.m3u'; a.click(); URL.revokeObjectURL(url); }} className="nav-item text-white hover:text-[var(--color-rider-blue)] p-2 transition-colors relative" title="Ver en Reproductor Externo">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              )}

              {!isLive && <button onClick={toggleSpeed} className="nav-item text-white font-black text-sm tracking-widest px-2">{playbackRate}x</button>}

              <div className="relative">
                <button onClick={() => setShowSettings(!showSettings)} className={`nav-item text-white hover:text-[var(--color-rider-blue)] transition-colors p-1.5 rounded-full ${showSettings ? 'rotate-90 bg-white/10' : ''}`}><Settings className="w-5 h-5" /></button>
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-4 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl w-48 z-[80]">
                     <div className="px-4 py-3 bg-white/5 border-b border-white/5"><span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Calidad</span></div>
                     <div className="flex flex-col py-2">
                       {hlsLevels.length <= 1 ? <div className="px-5 py-3 text-sm text-zinc-500 italic">Original</div> : (
                          <>
                            <button onClick={() => changeQuality(-1)} className={`nav-item px-5 py-2 text-left text-sm font-bold ${currentLevel === -1 ? 'text-[var(--color-rider-blue)]' : 'text-zinc-300'}`}>Automático</button>
                            {hlsLevels.map((lvl) => <button key={lvl.index} onClick={() => changeQuality(lvl.index)} className={`nav-item px-5 py-2 text-left text-sm font-bold ${currentLevel === lvl.index ? 'text-[var(--color-rider-blue)]' : 'text-white'}`}>{lvl.name}</button>)}
                          </>
                       )}
                     </div>
                  </div>
                )}
              </div>

              <button onClick={toggleFullscreen} className="nav-item text-white hover:text-[var(--color-rider-blue)] transition-colors ml-4"><Maximize className="w-6 h-6" /></button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
