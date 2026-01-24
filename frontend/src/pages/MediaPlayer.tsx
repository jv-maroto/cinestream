import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mediaApi, watchHistoryApi } from '@/services/api'
import {
  RefreshCw, Star, Calendar, Clock, Film, Tv, ExternalLink,
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, RotateCcw
} from 'lucide-react'
import { useEffect, useRef, useState, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010'

export default function MediaPlayer() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const watchRecorded = useRef(false)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)

  const { data: media, isLoading } = useQuery({
    queryKey: ['media', id],
    queryFn: () => mediaApi.getById(Number(id)).then((res) => res.data),
    enabled: !!id,
    refetchInterval: (query) => {
      return query.state.data?.status === 'processing' ? 2000 : false
    },
  })

  // Check if transcoding is needed for non-native formats
  const { data: streamInfo } = useQuery({
    queryKey: ['stream-info', id],
    queryFn: () => mediaApi.getStreamInfo(Number(id)).then((res) => res.data),
    enabled: !!id,
  })

  // State for transcoding mode - auto-enable for non-native formats
  const [useTranscode, setUseTranscode] = useState(false)
  const [transcodeAutoSet, setTranscodeAutoSet] = useState(false)

  // Auto-enable transcoding for non-native formats
  useEffect(() => {
    if (streamInfo && !transcodeAutoSet) {
      if (streamInfo.needs_transcode && !streamInfo.native_playback && streamInfo.can_transcode) {
        setUseTranscode(true)
      }
      setTranscodeAutoSet(true)
    }
  }, [streamInfo, transcodeAutoSet])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('progress', handleProgress)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('progress', handleProgress)
    }
  }, [media])

  // Get saved watch progress for resume functionality
  const { data: savedProgress } = useQuery({
    queryKey: ['watch-progress', id],
    queryFn: () => watchHistoryApi.getProgress(Number(id)).then(res => res.data),
    enabled: !!id,
  })

  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [hasResumed, setHasResumed] = useState(false)

  // Show resume prompt if there's saved progress
  useEffect(() => {
    if (savedProgress && savedProgress.position > 30 && savedProgress.progress_percent < 90 && !hasResumed) {
      setShowResumePrompt(true)
    }
  }, [savedProgress, hasResumed])

  // Watch history recording
  useEffect(() => {
    if (!media || watchRecorded.current) return

    const recordWatch = async () => {
      try {
        await watchHistoryApi.recordWatch(media.id)
        watchRecorded.current = true
      } catch (error) {
        console.error('Error recording watch:', error)
      }
    }

    const videoElement = videoRef.current
    if (videoElement) {
      videoElement.addEventListener('play', recordWatch, { once: true })
      return () => videoElement.removeEventListener('play', recordWatch)
    }
  }, [media])

  // Save progress periodically and on pause/unload
  const saveProgressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !media) return

    const saveProgress = async () => {
      if (video.duration && video.currentTime > 10) {
        try {
          await watchHistoryApi.updateProgress(media.id, video.currentTime, video.duration)
        } catch (error) {
          console.error('Error saving progress:', error)
        }
      }
    }

    // Save progress every 30 seconds while playing
    saveProgressRef.current = setInterval(() => {
      if (!video.paused && video.currentTime > 0) {
        saveProgress()
      }
    }, 30000)

    // Save on pause
    video.addEventListener('pause', saveProgress)

    // Save on page unload
    const handleUnload = () => {
      if (video.currentTime > 10) {
        navigator.sendBeacon(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8010'}/api/watch-history/${media.id}/progress`,
          JSON.stringify({ position: video.currentTime, duration: video.duration })
        )
      }
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      if (saveProgressRef.current) {
        clearInterval(saveProgressRef.current)
      }
      video.removeEventListener('pause', saveProgress)
      window.removeEventListener('beforeunload', handleUnload)
      // Save final progress on unmount
      saveProgress()
    }
  }, [media])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
        case 'arrowleft':
          e.preventDefault()
          skip(-10)
          break
        case 'arrowright':
          e.preventDefault()
          skip(10)
          break
        case 'arrowup':
          e.preventDefault()
          changeVolume(0.1)
          break
        case 'arrowdown':
          e.preventDefault()
          changeVolume(-0.1)
          break
        case 'j':
          e.preventDefault()
          skip(-10)
          break
        case 'l':
          e.preventDefault()
          skip(10)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Hide controls after inactivity
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
        setShowSettings(false)
      }, 3000)
    }
  }, [isPlaying])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
    }
  }

  const changeVolume = (delta: number) => {
    if (videoRef.current) {
      const newVolume = Math.max(0, Math.min(1, videoRef.current.volume + delta))
      videoRef.current.volume = newVolume
    }
  }

  const setVideoVolume = (value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value
      videoRef.current.muted = value === 0
    }
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  const toggleFullscreen = async () => {
    if (!playerContainerRef.current) return

    if (!document.fullscreenElement) {
      await playerContainerRef.current.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const setSpeed = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const reanalyzeMutation = useMutation({
    mutationFn: (mediaId: number) => mediaApi.analyze(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', id] })
      alert('Re-análisis iniciado. Se buscará información actualizada en TMDB.')
    },
    onError: (error: any) => {
      alert(error?.response?.data?.detail || 'Error al iniciar re-análisis')
    },
  })

  const handleReanalyze = () => {
    if (window.confirm('¿Volver a buscar información de TMDB para este título?')) {
      reanalyzeMutation.mutate(Number(id))
    }
  }

  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${API_URL}${path}`
  }

  const formatRuntime = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (isLoading) {
    return <div className="text-center py-12">Cargando...</div>
  }

  if (!media) {
    return <div className="text-center py-12">Contenido no encontrado</div>
  }

  // Determine video URL - use transcode for non-native formats if available
  const getVideoUrl = () => {
    if (media.path?.startsWith('http')) return media.path

    // If needs transcoding and user chose transcode mode (or auto for non-native)
    if (streamInfo?.needs_transcode && streamInfo?.can_transcode && useTranscode) {
      return `${API_URL}/api/media/${media.id}/transcode`
    }

    return `${API_URL}/api/media/${media.id}/stream`
  }

  const videoUrl = getVideoUrl()

  // Determine video MIME type based on filename or transcode mode
  const getVideoType = () => {
    // If transcoding, always MP4
    if (useTranscode && streamInfo?.can_transcode) return 'video/mp4'

    const ext = media.filename?.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'mp4': return 'video/mp4'
      case 'webm': return 'video/webm'
      case 'mkv': return 'video/x-matroska'
      case 'avi': return 'video/x-msvideo'
      case 'mov': return 'video/quicktime'
      default: return 'video/mp4'
    }
  }

  return (
    <div>
      {/* Backdrop */}
      {media.backdrop_path && (
        <div className="absolute top-0 left-0 right-0 h-[500px] -z-10">
          <img
            src={getImageUrl(media.backdrop_path) || undefined}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent" />
        </div>
      )}

      <div className="pt-8">
        <div className="flex items-start gap-8">
          {/* Poster */}
          <div className="flex-shrink-0 w-64 hidden md:block">
            {media.poster_path ? (
              <img
                src={getImageUrl(media.poster_path) || undefined}
                alt={media.title}
                className="w-full rounded-xl shadow-2xl"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-xl bg-dark-card flex items-center justify-center">
                <Film size={64} className="text-gray-600" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {media.media_type === 'movie' ? (
                <Film size={20} className="text-blue-500" />
              ) : (
                <Tv size={20} className="text-purple-500" />
              )}
              <span className="text-gray-400 capitalize">{media.media_type}</span>
            </div>

            <h1 className="text-4xl font-bold mb-2">{media.title || media.filename}</h1>

            {media.original_title && media.original_title !== media.title && (
              <p className="text-gray-400 mb-4">{media.original_title}</p>
            )}

            {media.tagline && (
              <p className="text-lg text-gray-300 italic mb-4">"{media.tagline}"</p>
            )}

            <div className="flex items-center gap-6 mb-6">
              {media.rating && (
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-500" size={20} />
                  <span className="font-bold">{media.rating.toFixed(1)}</span>
                  {media.vote_count && (
                    <span className="text-gray-400 text-sm">({media.vote_count} votos)</span>
                  )}
                </div>
              )}
              {media.year && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={18} />
                  <span>{media.year}</span>
                </div>
              )}
              {media.runtime && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={18} />
                  <span>{formatRuntime(media.runtime)}</span>
                </div>
              )}
            </div>

            {media.genres && media.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {media.genres.map((genre: any) => (
                  <Link
                    key={genre.id}
                    to={`/library?genre=${genre.slug}`}
                    className="bg-primary/20 text-primary px-4 py-1 rounded-full text-sm hover:bg-primary/30 transition-colors"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            )}

            {media.overview && (
              <p className="text-gray-300 mb-6 max-w-3xl">{media.overview}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReanalyze}
                disabled={reanalyzeMutation.isPending || media.status === 'processing'}
                className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={18} className={reanalyzeMutation.isPending ? 'animate-spin' : ''} />
                {reanalyzeMutation.isPending ? 'Buscando...' : 'Actualizar de TMDB'}
              </button>

              {media.imdb_id && (
                <a
                  href={`https://www.imdb.com/title/${media.imdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <ExternalLink size={18} />
                  Ver en IMDB
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Processing Status */}
        {media.status === 'processing' && (
          <div className="card p-4 mt-6 bg-yellow-900/20 border border-yellow-700">
            <div className="flex items-center gap-3 mb-3">
              <RefreshCw size={20} className="animate-spin text-yellow-500" />
              <div className="flex-1">
                <p className="font-medium text-yellow-500">Procesando...</p>
                <p className="text-sm text-gray-400">
                  {media.processing_step || 'Extrayendo metadatos y buscando información en TMDB'}
                </p>
              </div>
              <span className="text-yellow-500 font-bold text-lg">
                {media.processing_progress || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-yellow-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${media.processing_progress || 0}%` }}
              />
            </div>
          </div>
        )}

        {media.status === 'error' && (
          <div className="card p-4 mt-6 bg-red-900/20 border border-red-700">
            <p className="font-medium text-red-500">Error en procesamiento</p>
            <p className="text-sm text-gray-400">{media.error_message || 'Error desconocido'}</p>
          </div>
        )}

        {/* Professional Video Player */}
        <div
          ref={playerContainerRef}
          className={`relative mt-8 bg-black rounded-xl overflow-hidden group ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
          onMouseMove={resetControlsTimeout}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          <video
            ref={videoRef}
            className="w-full aspect-video bg-black cursor-pointer"
            onClick={togglePlay}
            onDoubleClick={toggleFullscreen}
            playsInline
            preload="metadata"
          >
            <source src={videoUrl} type={getVideoType()} />
            Tu navegador no soporta la reproducción de video.
          </video>

          {/* Resume watching prompt */}
          {showResumePrompt && !isPlaying && savedProgress && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
              <div className="bg-dark-card rounded-xl p-6 max-w-md text-center shadow-2xl">
                <RotateCcw size={48} className="mx-auto text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">¿Continuar viendo?</h3>
                <p className="text-gray-400 mb-4">
                  Dejaste de ver en {formatTime(savedProgress.position)} ({Math.round(savedProgress.progress_percent)}%)
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setShowResumePrompt(false)
                      setHasResumed(true)
                      if (videoRef.current) {
                        videoRef.current.currentTime = savedProgress.position
                        videoRef.current.play()
                      }
                    }}
                    className="btn btn-primary px-6"
                  >
                    Continuar
                  </button>
                  <button
                    onClick={() => {
                      setShowResumePrompt(false)
                      setHasResumed(true)
                      if (videoRef.current) {
                        videoRef.current.play()
                      }
                    }}
                    className="btn btn-secondary px-6"
                  >
                    Desde el inicio
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Play overlay when paused */}
          {!isPlaying && !showResumePrompt && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              onClick={togglePlay}
            >
              <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors">
                <Play size={40} className="text-white ml-1" fill="white" />
              </div>
            </div>
          )}

          {/* Controls overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-4 px-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Progress bar */}
            <div className="mb-4 group/progress">
              <div
                className="relative h-1 bg-white/30 rounded-full cursor-pointer group-hover/progress:h-2 transition-all"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const percent = (e.clientX - rect.left) / rect.width
                  seekTo(percent * duration)
                }}
              >
                {/* Buffered */}
                <div
                  className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                  style={{ width: `${(buffered / duration) * 100 || 0}%` }}
                />
                {/* Progress */}
                <div
                  className="absolute top-0 left-0 h-full bg-primary rounded-full"
                  style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                />
                {/* Thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
                  style={{ left: `calc(${(currentTime / duration) * 100 || 0}% - 8px)` }}
                />
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                  {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                </button>

                {/* Skip backward */}
                <button onClick={() => skip(-10)} className="text-white hover:text-primary transition-colors">
                  <SkipBack size={24} />
                </button>

                {/* Skip forward */}
                <button onClick={() => skip(10)} className="text-white hover:text-primary transition-colors">
                  <SkipForward size={24} />
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2 group/volume">
                  <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>
                  <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVideoVolume(parseFloat(e.target.value))}
                      className="w-24 h-1 accent-primary cursor-pointer"
                    />
                  </div>
                </div>

                {/* Time */}
                <span className="text-white text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Settings */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white hover:text-primary transition-colors"
                  >
                    <Settings size={24} />
                  </button>

                  {showSettings && (
                    <div className="absolute bottom-full right-0 mb-2 bg-dark-card rounded-lg shadow-xl border border-gray-700 overflow-hidden min-w-[220px]">
                      <div className="p-3 border-b border-gray-700">
                        <p className="text-xs text-gray-400 mb-2">Velocidad de reproducción</p>
                        <div className="flex flex-wrap gap-1">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => setSpeed(rate)}
                              className={`px-2 py-1 text-xs rounded ${playbackRate === rate ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 border-b border-gray-700">
                        <p className="text-xs text-gray-400 mb-2">Calidad</p>
                        <p className="text-sm text-white">
                          {media.width && media.height ? `${media.width}x${media.height}` : 'Original'}
                        </p>
                      </div>
                      {/* Transcoding option for non-native formats */}
                      {streamInfo?.needs_transcode && (
                        <div className="p-3">
                          <p className="text-xs text-gray-400 mb-2">Formato: {streamInfo.extension}</p>
                          {streamInfo.can_transcode ? (
                            <button
                              onClick={() => {
                                setUseTranscode(!useTranscode)
                                // Reload video with new source
                                if (videoRef.current) {
                                  const currentPos = videoRef.current.currentTime
                                  videoRef.current.load()
                                  videoRef.current.currentTime = 0
                                }
                              }}
                              className={`w-full px-3 py-2 text-xs rounded ${useTranscode ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                              {useTranscode ? '✓ Transcoding activo' : 'Activar transcoding'}
                            </button>
                          ) : (
                            <p className="text-xs text-yellow-500">
                              FFmpeg no disponible para transcodificar
                            </p>
                          )}
                          {!streamInfo.native_playback && !useTranscode && (
                            <p className="text-xs text-yellow-500 mt-2">
                              Este formato puede no reproducirse correctamente
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors">
                  {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                </button>
              </div>
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className={`absolute top-4 right-4 bg-black/70 px-3 py-2 rounded text-xs text-gray-400 transition-opacity duration-300 ${showControls && !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
            <span className="font-medium text-white">Atajos:</span> Espacio/K = Play | F = Pantalla completa | M = Silenciar | ←→ = 10s
          </div>
        </div>

        {/* Cast */}
        {media.actors && media.actors.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Reparto</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {media.actors.slice(0, 12).map((actor: any) => (
                <Link
                  key={actor.id}
                  to={`/actors/${actor.id}`}
                  className="card p-4 text-center hover:bg-dark-hover transition-colors"
                >
                  {actor.photo_path ? (
                    <img
                      src={actor.photo_path}
                      alt={actor.name}
                      className="w-20 h-20 rounded-full mx-auto object-cover mb-3"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full mx-auto bg-dark-hover flex items-center justify-center mb-3">
                      <span className="text-gray-500 text-2xl">
                        {actor.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <p className="font-medium truncate">{actor.name}</p>
                  {actor.character_name && (
                    <p className="text-sm text-gray-400 truncate">{actor.character_name}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Directors */}
        {media.directors && media.directors.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Dirección</h2>
            <div className="flex flex-wrap gap-4">
              {media.directors.map((director: any) => (
                <div key={director.id} className="card p-4 flex items-center gap-3">
                  {director.photo_path ? (
                    <img
                      src={director.photo_path}
                      alt={director.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-dark-hover flex items-center justify-center">
                      <span className="text-gray-500">
                        {director.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <span className="font-medium">{director.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Technical Info */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Información Técnica</h2>
          <div className="card p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-gray-400 text-sm">Resolución</p>
                <p className="font-medium">
                  {media.width && media.height ? `${media.width}x${media.height}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">FPS</p>
                <p className="font-medium">{media.fps?.toFixed(2) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Codec Video</p>
                <p className="font-medium">{media.codec || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Codec Audio</p>
                <p className="font-medium">{media.audio_codec || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Tamaño</p>
                <p className="font-medium">
                  {media.file_size ? `${(media.file_size / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Bitrate</p>
                <p className="font-medium">
                  {media.bitrate ? `${(media.bitrate / 1000000).toFixed(2)} Mbps` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Idioma</p>
                <p className="font-medium">{media.language?.toUpperCase() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Duración</p>
                <p className="font-medium">{media.duration ? formatTime(media.duration) : 'N/A'}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
