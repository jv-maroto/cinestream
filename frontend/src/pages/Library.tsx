import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { mediaApi, genresApi, seriesApi, animeApi, documentariesApi } from '@/services/api'
import { Search, Scan, Film, Tv, Grid, List, Play, Star, Sparkles, FileVideo, X, SlidersHorizontal } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010'

interface MediaFilters {
  page: number
  limit: number
  search?: string
  genre?: string
  media_type?: string
  status?: string
  sort_by?: string
}

const CATEGORY_CONFIG: Record<string, { title: string; icon: React.ReactNode; color: string; types: string[] }> = {
  movie: {
    title: 'Películas',
    icon: <Film size={24} className="text-blue-500" />,
    color: 'blue',
    types: ['movie']
  },
  series: {
    title: 'Series',
    icon: <Tv size={24} className="text-purple-500" />,
    color: 'purple',
    types: ['series', 'episode']
  },
  anime: {
    title: 'Anime',
    icon: <Sparkles size={24} className="text-pink-500" />,
    color: 'pink',
    types: ['anime', 'anime_series', 'anime_movie']
  },
  documentary: {
    title: 'Documentales',
    icon: <FileVideo size={24} className="text-green-500" />,
    color: 'green',
    types: ['documentary']
  }
}

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const categoryType = searchParams.get('type') || undefined
  const searchQuery = searchParams.get('search') || undefined
  const categoryConfig = categoryType ? CATEGORY_CONFIG[categoryType] : null

  const [filters, setFilters] = useState<MediaFilters>({
    page: 1,
    limit: 30,
    genre: searchParams.get('genre') || undefined,
    media_type: categoryType,
    search: searchQuery,
    sort_by: searchParams.get('sort_by') || 'created_at',
    status: 'completed'
  })

  useEffect(() => {
    const typeFromUrl = searchParams.get('type')
    const genreFromUrl = searchParams.get('genre')
    const searchFromUrl = searchParams.get('search')
    const sortFromUrl = searchParams.get('sort_by')

    setFilters(prev => ({
      ...prev,
      media_type: typeFromUrl || undefined,
      genre: genreFromUrl || undefined,
      search: searchFromUrl || undefined,
      sort_by: sortFromUrl || 'created_at',
      page: 1
    }))
  }, [searchParams])

  // Use grouped endpoints for series and anime, regular endpoint for others
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['library', filters],
    queryFn: async () => {
      const { media_type, page, limit, search, genre } = filters

      // For series: use grouped endpoint
      if (media_type === 'series') {
        const res = await seriesApi.getAll({ page, limit, search, genre })
        return {
          media: res.data.series?.map((s: any) => ({
            ...s,
            media_type: 'series',
            _linkType: 'series'
          })) || [],
          total: res.data.total,
          page: res.data.page,
          pages: res.data.pages
        }
      }

      // For anime: use grouped endpoint
      if (media_type === 'anime') {
        const res = await animeApi.getAll({ page, limit, search, genre })
        return {
          media: res.data.anime?.map((a: any) => ({
            ...a,
            media_type: 'anime',
            _linkType: 'anime'
          })) || [],
          total: res.data.total,
          page: res.data.page,
          pages: res.data.pages
        }
      }

      // For movies only
      if (media_type === 'movie') {
        const res = await mediaApi.getAll({ ...filters, media_type: 'movie' })
        return res.data
      }

      // For documentaries: use grouped endpoint
      if (media_type === 'documentary') {
        const res = await documentariesApi.getAll({ page, limit, search, genre })
        return {
          media: res.data.documentaries?.map((d: any) => ({
            ...d,
            media_type: 'documentary',
            _linkType: 'documentary'
          })) || [],
          total: res.data.total,
          page: res.data.page,
          pages: res.data.pages
        }
      }

      // NO TYPE FILTER: Combine movies, grouped series, grouped anime, and grouped documentaries
      // Fetch all four in parallel
      const [moviesRes, seriesRes, animeRes, docsRes] = await Promise.all([
        mediaApi.getAll({ page: 1, limit: 100, search, genre, media_type: 'movie', status: 'completed' }),
        seriesApi.getAll({ page: 1, limit: 100, search, genre }),
        animeApi.getAll({ page: 1, limit: 100, search, genre }),
        documentariesApi.getAll({ page: 1, limit: 100, search, genre })
      ])

      // Combine all results - filter out items without posters
      const movies = (moviesRes.data.media || [])
        .filter((m: any) => m.poster_path)
        .map((m: any) => ({
          ...m,
          _linkType: 'movie'
        }))

      const series = (seriesRes.data.series || []).map((s: any) => ({
        ...s,
        media_type: 'series',
        _linkType: 'series'
      }))

      const anime = (animeRes.data.anime || []).map((a: any) => ({
        ...a,
        media_type: 'anime',
        _linkType: 'anime'
      }))

      const docs = (docsRes.data.documentaries || []).map((d: any) => ({
        ...d,
        media_type: 'documentary',
        _linkType: 'documentary'
      }))

      // Combine and sort by title
      const allMedia = [...movies, ...series, ...anime, ...docs].sort((a, b) =>
        (a.title || '').localeCompare(b.title || '')
      )

      // Manual pagination
      const total = allMedia.length
      const start = (page - 1) * limit
      const paginatedMedia = allMedia.slice(start, start + limit)

      return {
        media: paginatedMedia,
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    },
  })

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => genresApi.getAll().then((res) => res.data),
  })

  const scanMutation = useMutation({
    mutationFn: () => mediaApi.scan(),
    onSuccess: () => {
      refetch()
    }
  })

  const getThumbnailUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${API_URL}${path}`
  }

  const handleScan = async () => {
    scanMutation.mutate()
  }

  const updateFilter = (key: string, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value, page: 1 }
    setFilters(newFilters)

    // Update URL params
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key === 'media_type' ? 'type' : key, value)
    } else {
      params.delete(key === 'media_type' ? 'type' : key)
    }
    setSearchParams(params)
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 30,
      sort_by: 'created_at',
      status: 'completed'
    })
    setSearchParams({})
  }

  const getMediaTypeLabel = (type: string) => {
    switch (type) {
      case 'movie': return 'Película'
      case 'series': return 'Serie'
      case 'episode': return 'Episodio'
      case 'anime': return 'Anime'
      case 'anime_series': return 'Anime'
      case 'anime_movie': return 'Anime (Película)'
      case 'documentary': return 'Documental'
      default: return type
    }
  }

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'movie':
        return <Film size={14} className="text-blue-500" />
      case 'series':
      case 'episode':
        return <Tv size={14} className="text-purple-500" />
      case 'anime':
      case 'anime_series':
      case 'anime_movie':
        return <Sparkles size={14} className="text-pink-500" />
      case 'documentary':
        return <FileVideo size={14} className="text-green-500" />
      default:
        return <Film size={14} />
    }
  }

  const hasActiveFilters = filters.genre || filters.media_type || filters.search

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {categoryConfig ? (
            <>
              {categoryConfig.icon}
              <h1 className="text-3xl font-bold">{categoryConfig.title}</h1>
            </>
          ) : (
            <h1 className="text-3xl font-bold">Biblioteca</h1>
          )}
          {data?.total && (
            <span className="text-gray-500 text-lg">({data.total} títulos)</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-dark-card rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-dark-hover text-gray-400'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-dark-hover text-gray-400'}`}
            >
              <List size={18} />
            </button>
          </div>

          <button
            onClick={handleScan}
            disabled={scanMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <Scan size={18} className={scanMutation.isPending ? 'animate-spin' : ''} />
            {scanMutation.isPending ? 'Escaneando...' : 'Escanear D:\\'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={filters.search || ''}
              className="w-full bg-dark-card/50 border border-dark-border/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              onChange={(e) => updateFilter('search', e.target.value || undefined)}
            />
            {filters.search && (
              <button
                onClick={() => updateFilter('search', undefined)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn flex items-center gap-2 ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <SlidersHorizontal size={18} />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary rounded-full"></span>
            )}
          </button>
        </div>

        {/* Active Filters Pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.media_type && (
              <span className="bg-dark-card px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                {getMediaTypeIcon(filters.media_type)}
                {getMediaTypeLabel(filters.media_type)}
                <button onClick={() => updateFilter('media_type', undefined)} className="hover:text-primary">
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.genre && (
              <span className="bg-dark-card px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                Género: {genresData?.genres?.find((g: any) => g.slug === filters.genre)?.name || filters.genre}
                <button onClick={() => updateFilter('genre', undefined)} className="hover:text-primary">
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.search && (
              <span className="bg-dark-card px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                Búsqueda: "{filters.search}"
                <button onClick={() => updateFilter('search', undefined)} className="hover:text-primary">
                  <X size={14} />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-primary transition-colors"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Expanded Filters */}
        {showFilters && (
          <div className="card p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Tipo de contenido</label>
              <select
                className="w-full bg-dark-bg border border-dark-border/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                value={filters.media_type || ''}
                onChange={(e) => updateFilter('media_type', e.target.value || undefined)}
              >
                <option value="">Todos los tipos</option>
                <option value="movie">Películas</option>
                <option value="series">Series</option>
                <option value="anime">Anime</option>
                <option value="documentary">Documentales</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Género</label>
              <select
                className="w-full bg-dark-bg border border-dark-border/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                value={filters.genre || ''}
                onChange={(e) => updateFilter('genre', e.target.value || undefined)}
              >
                <option value="">Todos los géneros</option>
                {genresData?.genres?.map((genre: any) => (
                  <option key={genre.slug} value={genre.slug}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Estado</label>
              <select
                className="w-full bg-dark-bg border border-dark-border/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                value={filters.status || 'completed'}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              >
                <option value="completed">Procesados</option>
                <option value="pending">Pendientes</option>
                <option value="processing">Procesando</option>
                <option value="error">Con errores</option>
                <option value="all">Todos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Ordenar por</label>
              <select
                className="w-full bg-dark-bg border border-dark-border/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                value={filters.sort_by || 'created_at'}
                onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value, page: 1 }))}
              >
                <option value="created_at">Fecha añadido</option>
                <option value="title">Título (A-Z)</option>
                <option value="year">Año (más reciente)</option>
                <option value="rating">Puntuación</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Scan Status */}
      {scanMutation.isPending && (
        <div className="card p-4 mb-6 bg-blue-900/20 border border-blue-700/50">
          <div className="flex items-center gap-3">
            <Scan size={20} className="animate-spin text-blue-500" />
            <div>
              <p className="font-medium text-blue-400">Escaneando disco D:\</p>
              <p className="text-sm text-gray-400">Buscando películas, series y anime...</p>
            </div>
          </div>
        </div>
      )}

      {scanMutation.isSuccess && (
        <div className="card p-4 mb-6 bg-green-900/20 border border-green-700/50">
          <p className="text-green-400">Escaneo completado. Nuevos archivos están siendo procesados.</p>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-dark-card animate-pulse" />
          ))}
        </div>
      ) : data?.media?.length === 0 ? (
        <div className="text-center py-16">
          <Film size={64} className="mx-auto text-gray-700 mb-4" />
          <h3 className="text-xl font-bold mb-2">No se encontró contenido</h3>
          <p className="text-gray-400 mb-6">
            {hasActiveFilters
              ? 'Intenta ajustar los filtros o hacer una búsqueda diferente.'
              : 'Escanea tu disco D:\\ para comenzar a añadir contenido.'}
          </p>
          {!hasActiveFilters && (
            <button onClick={handleScan} className="btn btn-primary">
              <Scan size={18} className="mr-2" />
              Escanear ahora
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {data?.media?.map((item: any, index: number) => {
            // Determine link based on content type
            const linkTo = item._linkType === 'series'
              ? `/series/${item.tmdb_id}`
              : item._linkType === 'anime'
                ? `/anime/${item.tmdb_id}`
                : item._linkType === 'documentary' && item.episode_count > 1
                  ? `/documentary/${item.tmdb_id}`
                  : `/media/${item.id || item.first_episode_id}`

            return (
            <Link
              key={item.id || `${item.title}-${index}`}
              to={linkTo}
              className="group perspective-1000"
            >
              <div className="media-card relative aspect-[2/3] glow-hover">
                {item.poster_path ? (
                  <img
                    src={getThumbnailUrl(item.poster_path) || undefined}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-dark-card to-dark-hover">
                    {getMediaTypeIcon(item.media_type)}
                    <p className="text-xs text-gray-500 mt-2 px-2 text-center truncate w-full">{item.title || 'Sin titulo'}</p>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-primary rounded-full p-4 transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-100 pulse-glow shadow-lg shadow-primary/50">
                      <Play size={28} fill="white" className="text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-base font-bold truncate drop-shadow-lg">{item.title || item.filename}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-200 mt-2">
                      {item.year && <span className="font-medium">{item.year}</span>}
                      {item.runtime && <span>{item.runtime} min</span>}
                    </div>
                    {item.overview && (
                      <p className="text-xs text-gray-300 mt-2 line-clamp-2">{item.overview}</p>
                    )}
                  </div>
                </div>

                {/* Rating badge */}
                {item.rating && (
                  <div className="absolute top-2 right-2 glass px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 z-30">
                    <Star size={12} className="text-yellow-400" fill="currentColor" />
                    {item.rating.toFixed(1)}
                  </div>
                )}

                {/* Type badge */}
                <div className={`absolute top-2 left-2 glass px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 z-30 ${
                  item.media_type === 'anime' || item.media_type === 'anime_series' ? 'text-pink-400' :
                  item.media_type === 'movie' ? 'text-blue-400' :
                  item.media_type === 'series' || item.media_type === 'episode' ? 'text-purple-400' :
                  item.media_type === 'documentary' ? 'text-green-400' : 'text-white'
                }`}>
                  {getMediaTypeIcon(item.media_type)}
                  <span className="uppercase tracking-wide">{getMediaTypeLabel(item.media_type)}</span>
                </div>

                {/* Processing indicator */}
                {item.status === 'processing' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-yellow-500/30 z-30">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all shimmer"
                      style={{ width: `${item.processing_progress || 0}%` }}
                    />
                  </div>
                )}

                {/* Episode count badge */}
                {item.episode_count && (
                  <div className="absolute bottom-2 left-2 bg-gradient-to-r from-purple-600 to-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-bold z-30 shadow-lg">
                    {item.episode_count} eps
                  </div>
                )}
              </div>
            </Link>
          )})}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.media?.map((item: any, index: number) => {
            const linkTo = item._linkType === 'series'
              ? `/series/${item.tmdb_id}`
              : item._linkType === 'anime'
                ? `/anime/${item.tmdb_id}`
                : item._linkType === 'documentary' && item.episode_count > 1
                  ? `/documentary/${item.tmdb_id}`
                  : `/media/${item.id || item.first_episode_id}`

            return (
            <Link
              key={item.id || `${item.title}-${index}`}
              to={linkTo}
              className="card p-4 flex items-center gap-4 hover:bg-dark-hover transition-colors group"
            >
              <div className="w-16 h-24 rounded-lg overflow-hidden bg-dark-hover flex-shrink-0">
                {item.poster_path ? (
                  <img
                    src={getThumbnailUrl(item.poster_path) || undefined}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getMediaTypeIcon(item.media_type)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                  {item.title || item.filename}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  {getMediaTypeIcon(item.media_type)}
                  <span>{getMediaTypeLabel(item.media_type)}</span>
                  {item.year && <span>• {item.year}</span>}
                  {item.runtime && <span>• {item.runtime} min</span>}
                </div>
                {item.genres && item.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.genres.slice(0, 3).map((g: any) => (
                      <span key={g.id} className="text-xs bg-dark-bg px-2 py-0.5 rounded">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {item.rating && (
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <Star size={16} fill="currentColor" />
                  {item.rating.toFixed(1)}
                </div>
              )}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-primary rounded-full p-2">
                  <Play size={16} fill="white" className="text-white" />
                </div>
              </div>
            </Link>
          )})}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > filters.limit && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
            disabled={filters.page === 1}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <div className="flex items-center gap-2">
            {[...Array(Math.min(5, Math.ceil(data.total / filters.limit)))].map((_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => setFilters((prev) => ({ ...prev, page: pageNum }))}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    filters.page === pageNum
                      ? 'bg-primary text-white'
                      : 'bg-dark-card hover:bg-dark-hover'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            {Math.ceil(data.total / filters.limit) > 5 && (
              <>
                <span className="text-gray-500">...</span>
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, page: Math.ceil(data.total / filters.limit) }))}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    filters.page === Math.ceil(data.total / filters.limit)
                      ? 'bg-primary text-white'
                      : 'bg-dark-card hover:bg-dark-hover'
                  }`}
                >
                  {Math.ceil(data.total / filters.limit)}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
            disabled={filters.page >= Math.ceil(data.total / filters.limit)}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
