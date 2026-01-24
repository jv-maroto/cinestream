import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { statsApi, mediaApi, seriesApi, animeApi, watchHistoryApi } from '@/services/api'
import { Film, Tv, Users, Clock, Play, Star, ChevronLeft, ChevronRight, Sparkles, FileVideo, HardDrive, RotateCcw, Info, Plus } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010'

// Continue Watching Row
function ContinueWatchingRow({ items }: { items: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    const ref = scrollRef.current
    if (ref) {
      ref.addEventListener('scroll', checkScroll)
      checkScroll()
    }
    return () => ref?.removeEventListener('scroll', checkScroll)
  }, [items])

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -400 : 400
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }

  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${API_URL}${path}`
  }

  if (!items?.length) return null

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
        <RotateCcw size={22} className="text-orange-500" />
        Continuar Viendo
      </h2>

      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 w-12 bg-black/70 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={32} />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 w-12 bg-black/70 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={32} />
          </button>
        )}

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {items.map((item: any) => (
            <Link
              key={item.media_id}
              to={`/media/${item.media_id}`}
              className="flex-shrink-0 w-72 group/card"
            >
              <div className="relative aspect-video rounded-lg overflow-hidden bg-dark-card">
                {item.backdrop_path || item.poster_path ? (
                  <img
                    src={getImageUrl(item.backdrop_path || item.poster_path) || ''}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-dark-hover">
                    <Film size={40} className="text-gray-600" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                    <Play size={28} fill="black" className="text-black ml-1" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                  <div className="h-full bg-primary" style={{ width: `${item.progress_percent || 0}%` }} />
                </div>

                {/* Info */}
                <div className="absolute bottom-1 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                  <p className="font-semibold truncate text-sm">{item.title}</p>
                  {item.episode_title && (
                    <p className="text-xs text-gray-300">S{item.season_number}E{item.episode_number}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// Media Row Component
function MediaRow({ title, icon, items, viewAllLink }: {
  title: string
  icon: React.ReactNode
  items: any[]
  viewAllLink: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    const ref = scrollRef.current
    if (ref) {
      ref.addEventListener('scroll', checkScroll)
      checkScroll()
    }
    return () => ref?.removeEventListener('scroll', checkScroll)
  }, [items])

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -400 : 400
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }

  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${API_URL}${path}`
  }

  if (!items?.length) return null

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <Link to={viewAllLink} className="text-sm text-gray-400 hover:text-primary flex items-center gap-1">
          Ver todo <ChevronRight size={16} />
        </Link>
      </div>

      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 w-12 bg-black/70 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-l-lg"
          >
            <ChevronLeft size={32} />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 w-12 bg-black/70 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-r-lg"
          >
            <ChevronRight size={32} />
          </button>
        )}

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {items.map((item: any, idx: number) => {
            const isSeries = item.media_type === 'series' && item.tmdb_id
            const isAnime = item.media_type === 'anime' && item.tmdb_id
            const linkTo = isSeries
              ? `/series/${item.tmdb_id}`
              : isAnime
                ? `/anime/${item.tmdb_id}`
                : `/media/${item.id || item.first_episode_id}`

            const typeColor =
              item.media_type === 'anime' ? 'text-pink-400' :
              item.media_type === 'movie' ? 'text-blue-400' :
              item.media_type === 'series' ? 'text-purple-400' :
              item.media_type === 'documentary' ? 'text-green-400' : 'text-white'

            return (
              <Link
                key={item.id || `${item.title}-${idx}`}
                to={linkTo}
                className="flex-shrink-0 w-40 group/card"
              >
                <div className="media-card aspect-[2/3]">
                  {item.poster_path ? (
                    <img
                      src={getImageUrl(item.poster_path) || ''}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-dark-hover p-2">
                      <Film size={40} className="text-gray-600 mb-2" />
                      <p className="text-xs text-gray-500 text-center truncate w-full">{item.title}</p>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <div className="flex gap-2 mb-2">
                      <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform">
                        <Play size={16} fill="black" className="text-black ml-0.5" />
                      </button>
                      <button className="w-8 h-8 rounded-full bg-dark-card border border-gray-600 flex items-center justify-center hover:border-white transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="font-semibold text-sm truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                      {item.year && <span>{item.year}</span>}
                      {item.rating && (
                        <span className="flex items-center gap-0.5">
                          <Star size={10} className="text-yellow-500" fill="currentColor" />
                          {item.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating badge */}
                  {item.rating && (
                    <div className="absolute top-2 right-2 glass px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                      <Star size={10} className="text-yellow-500" fill="currentColor" />
                      {item.rating.toFixed(1)}
                    </div>
                  )}

                  {/* Type badge */}
                  <div className={`absolute top-2 left-2 glass px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${typeColor}`}>
                    {item.media_type === 'anime' ? 'Anime' :
                     item.media_type === 'movie' ? 'Película' :
                     item.media_type === 'series' ? 'Serie' :
                     item.media_type === 'documentary' ? 'Doc' : item.media_type}
                  </div>

                  {/* Episode count */}
                  {item.episode_count && (
                    <div className="absolute bottom-2 left-2 glass px-2 py-0.5 rounded text-[10px] font-bold">
                      {item.episode_count} eps
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Hero Section
function HeroSection({ item }: { item: any }) {
  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${API_URL}${path}`
  }

  if (!item) return null

  return (
    <div className="relative h-[60vh] min-h-[400px] -mx-6 -mt-6 mb-8 overflow-hidden">
      <img
        src={getImageUrl(item.backdrop_path) || ''}
        alt={item.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-8">
        <div className="max-w-xl">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider mb-2 block">
            {item.media_type === 'movie' ? 'Película Destacada' :
             item.media_type === 'anime' ? 'Anime Destacado' : 'Serie Destacada'}
          </span>
          <h1 className="text-4xl font-bold mb-3">{item.title}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-300 mb-3">
            {item.year && <span>{item.year}</span>}
            {item.runtime && <span>{Math.floor(item.runtime / 60)}h {item.runtime % 60}m</span>}
            {item.rating && (
              <span className="flex items-center gap-1">
                <Star size={14} className="text-yellow-500" fill="currentColor" />
                {item.rating.toFixed(1)}
              </span>
            )}
          </div>
          {item.overview && (
            <p className="text-gray-300 text-sm line-clamp-2 mb-4">{item.overview}</p>
          )}
          <div className="flex gap-3">
            <Link to={`/media/${item.id}`} className="btn btn-primary flex items-center gap-2 px-6">
              <Play size={20} fill="white" />
              Reproducir
            </Link>
            <Link to={`/media/${item.id}`} className="btn btn-secondary flex items-center gap-2">
              <Info size={20} />
              Más Info
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { data: stats } = useQuery({
    queryKey: ['stats', 'general'],
    queryFn: () => statsApi.getGeneral().then(res => res.data),
  })

  const { data: recentData } = useQuery({
    queryKey: ['stats', 'recent'],
    queryFn: () => statsApi.getRecent(20).then(res => res.data),
  })

  const { data: moviesData } = useQuery({
    queryKey: ['media', 'movies'],
    queryFn: () => mediaApi.getAll({ media_type: 'movie', limit: 20, status: 'completed' }).then(res => res.data),
  })

  const { data: seriesData } = useQuery({
    queryKey: ['series', 'grouped'],
    queryFn: () => seriesApi.getAll({ limit: 20 }).then(res => res.data),
  })

  const { data: animeData } = useQuery({
    queryKey: ['anime', 'grouped'],
    queryFn: () => animeApi.getAll({ limit: 20 }).then(res => res.data),
  })

  const { data: topRatedData } = useQuery({
    queryKey: ['media', 'top-rated'],
    queryFn: () => mediaApi.getAll({ sort_by: 'rating', limit: 20, status: 'completed' }).then(res => res.data),
  })

  const { data: continueWatchingData } = useQuery({
    queryKey: ['watch-history', 'continue-watching'],
    queryFn: () => watchHistoryApi.getContinueWatching(10).then(res => res.data),
  })

  const featuredItem = recentData?.media?.find((item: any) => item.backdrop_path)

  return (
    <div>
      {/* Hero */}
      {featuredItem && <HeroSection item={featuredItem} />}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <div className="card p-4 bg-gradient-to-br from-blue-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Film size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Películas</p>
              <p className="text-xl font-bold">{stats?.movies || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Tv size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Series</p>
              <p className="text-xl font-bold">{stats?.series || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-pink-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/20">
              <Sparkles size={20} className="text-pink-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Anime</p>
              <p className="text-xl font-bold">{stats?.anime || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-green-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <FileVideo size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Documentales</p>
              <p className="text-xl font-bold">{stats?.documentaries || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-yellow-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Clock size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Horas</p>
              <p className="text-xl font-bold">{stats?.total_hours || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-cyan-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <HardDrive size={20} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Total GB</p>
              <p className="text-xl font-bold">{stats?.total_size_gb?.toFixed(0) || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Watching */}
      {continueWatchingData?.length > 0 && (
        <ContinueWatchingRow items={continueWatchingData} />
      )}

      {/* Content Rows */}
      <MediaRow
        title="Añadidos Recientemente"
        icon={<Clock size={22} className="text-primary" />}
        items={recentData?.media || []}
        viewAllLink="/library?sort_by=created_at"
      />

      <MediaRow
        title="Películas"
        icon={<Film size={22} className="text-blue-400" />}
        items={moviesData?.media || []}
        viewAllLink="/library?type=movie"
      />

      <MediaRow
        title="Series"
        icon={<Tv size={22} className="text-purple-400" />}
        items={seriesData?.series || []}
        viewAllLink="/library?type=series"
      />

      <MediaRow
        title="Anime"
        icon={<Sparkles size={22} className="text-pink-400" />}
        items={animeData?.anime || []}
        viewAllLink="/library?type=anime"
      />

      <MediaRow
        title="Mejor Valorados"
        icon={<Star size={22} className="text-yellow-500" />}
        items={topRatedData?.media || []}
        viewAllLink="/library?sort_by=rating"
      />

      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Link to="/library" className="card p-5 hover:bg-dark-hover transition-all border-l-4 border-l-primary">
          <div className="flex items-center gap-4">
            <Film size={28} className="text-primary" />
            <div>
              <h3 className="font-bold">Explorar Biblioteca</h3>
              <p className="text-sm text-gray-500">Navega por toda tu colección</p>
            </div>
          </div>
        </Link>
        <Link to="/actors" className="card p-5 hover:bg-dark-hover transition-all border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <Users size={28} className="text-green-500" />
            <div>
              <h3 className="font-bold">Ver Actores</h3>
              <p className="text-sm text-gray-500">Descubre filmografías</p>
            </div>
          </div>
        </Link>
        <Link to="/queue" className="card p-5 hover:bg-dark-hover transition-all border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-4">
            <Clock size={28} className="text-yellow-500" />
            <div>
              <h3 className="font-bold">Cola de Procesamiento</h3>
              <p className="text-sm text-gray-500">Monitorea el análisis</p>
            </div>
          </div>
        </Link>
      </section>
    </div>
  )
}
