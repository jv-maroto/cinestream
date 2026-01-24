import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { documentariesApi } from '@/services/api'
import { Play, Star, Clock, Calendar, FileVideo } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010'

export default function DocumentaryDetail() {
  const { tmdbId } = useParams<{ tmdbId: string }>()

  const { data: documentary, isLoading, error } = useQuery({
    queryKey: ['documentary', tmdbId],
    queryFn: () => documentariesApi.getByTmdb(Number(tmdbId)).then((res) => res.data),
    enabled: !!tmdbId,
  })

  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${API_URL}${path}`
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !documentary) {
    return (
      <div className="text-center py-12">
        <FileVideo size={64} className="mx-auto text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Documental no encontrado</h2>
        <p className="text-gray-400">No se pudo cargar la informacion de este documental.</p>
        <Link to="/library?type=documentary" className="btn btn-primary mt-4">
          Volver a Documentales
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Backdrop */}
      {documentary.backdrop_path && (
        <div className="absolute top-0 left-0 right-0 h-[500px] -z-10">
          <img
            src={getImageUrl(documentary.backdrop_path) || undefined}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent" />
        </div>
      )}

      <div className="pt-8">
        {/* Documentary Info Header */}
        <div className="flex items-start gap-8 mb-8">
          {/* Poster */}
          <div className="flex-shrink-0 w-64 hidden md:block">
            {documentary.poster_path ? (
              <img
                src={getImageUrl(documentary.poster_path) || undefined}
                alt={documentary.title}
                className="w-full rounded-xl shadow-2xl"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-xl bg-dark-card flex items-center justify-center">
                <FileVideo size={64} className="text-gray-600" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileVideo size={20} className="text-green-500" />
              <span className="text-gray-400">Documental</span>
            </div>

            <h1 className="text-4xl font-bold mb-4">{documentary.title}</h1>

            <div className="flex items-center gap-6 mb-6 flex-wrap">
              {documentary.rating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-500" size={20} fill="currentColor" />
                  <span className="font-bold text-lg">{documentary.rating.toFixed(1)}</span>
                  {documentary.vote_count && (
                    <span className="text-gray-400 text-sm">({documentary.vote_count} votos)</span>
                  )}
                </div>
              )}
              {documentary.year && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={18} />
                  <span>{documentary.year}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-400">
                <Play size={18} />
                <span>{documentary.total_episodes} {documentary.total_episodes === 1 ? 'Episodio' : 'Episodios'}</span>
              </div>
              {documentary.total_duration && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={18} />
                  <span>{formatDuration(documentary.total_duration)} total</span>
                </div>
              )}
            </div>

            {documentary.genres && documentary.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {documentary.genres.map((genre: any) => (
                  <Link
                    key={genre.id}
                    to={`/library?genre=${genre.slug}&type=documentary`}
                    className="bg-green-500/20 text-green-400 px-4 py-1 rounded-full text-sm hover:bg-green-500/30 transition-colors"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            )}

            {documentary.overview && (
              <p className="text-gray-300 max-w-3xl leading-relaxed">{documentary.overview}</p>
            )}
          </div>
        </div>

        {/* Cast */}
        {documentary.actors && documentary.actors.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">Presentadores / Reparto</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {documentary.actors.map((actor: any) => (
                <Link
                  key={actor.id}
                  to={`/actors/${actor.id}`}
                  className="flex-shrink-0 text-center group"
                >
                  {actor.photo_path ? (
                    <img
                      src={actor.photo_path}
                      alt={actor.name}
                      className="w-20 h-20 rounded-full object-cover mb-2 group-hover:ring-2 ring-primary transition-all"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-dark-card flex items-center justify-center mb-2">
                      <span className="text-2xl text-gray-500">{actor.name?.charAt(0)}</span>
                    </div>
                  )}
                  <p className="text-sm font-medium truncate w-20">{actor.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Episodes */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Episodios</h2>

          <div className="space-y-2">
            {(documentary.episodes || []).map((ep: any, index: number) => (
              <Link
                key={ep.id}
                to={`/media/${ep.id}`}
                className="card flex items-center gap-4 p-4 hover:bg-dark-hover transition-colors group"
              >
                {/* Episode Number */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-dark-hover flex items-center justify-center">
                  <span className="text-lg font-bold text-green-500">{ep.episode_number || index + 1}</span>
                </div>

                {/* Thumbnail */}
                <div className="flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden bg-dark-card">
                  {ep.thumbnail_path ? (
                    <img
                      src={getImageUrl(ep.thumbnail_path) || undefined}
                      alt={`Episodio ${ep.episode_number}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={24} className="text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Episode Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {ep.episode_title || `Episodio ${ep.episode_number || index + 1}`}
                  </p>
                  {ep.overview && (
                    <p className="text-sm text-gray-400 line-clamp-2 mt-1">{ep.overview}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {ep.duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDuration(ep.duration)}
                      </span>
                    )}
                    {ep.rating && (
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-500" />
                        {ep.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Play Button */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                    <Play size={18} className="text-green-500 group-hover:text-white ml-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
