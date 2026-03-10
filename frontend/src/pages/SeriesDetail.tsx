import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { seriesApi } from '@/services/api'
import { Play, Star, Clock, Calendar, Film, ChevronDown, ChevronUp, Music } from 'lucide-react'
import { useState } from 'react'
import { getImageUrl } from '@/utils/imageUrl'

export default function SeriesDetail() {
  const { tmdbId } = useParams<{ tmdbId: string }>()
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set(['1']))

  const { data: series, isLoading, error } = useQuery({
    queryKey: ['series', tmdbId],
    queryFn: () => seriesApi.getByTmdb(Number(tmdbId)).then((res) => res.data),
    enabled: !!tmdbId,
  })

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const toggleSeason = (season: string) => {
    const newExpanded = new Set(expandedSeasons)
    if (newExpanded.has(season)) {
      newExpanded.delete(season)
    } else {
      newExpanded.add(season)
    }
    setExpandedSeasons(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !series) {
    return (
      <div className="text-center py-12">
        <Film size={64} className="mx-auto text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Serie no encontrada</h2>
        <p className="text-gray-400">No se pudo cargar la información de esta serie.</p>
        <Link to="/library?type=series" className="btn btn-primary mt-4">
          Volver a Series
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Backdrop */}
      {series.backdrop_path && (
        <div className="absolute top-0 left-0 right-0 h-[500px] -z-10">
          <img
            src={getImageUrl(series.backdrop_path) || undefined}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent" />
        </div>
      )}

      <div className="pt-8">
        {/* Series Info Header */}
        <div className="flex items-start gap-8 mb-8">
          {/* Poster */}
          <div className="flex-shrink-0 w-64 hidden md:block">
            {series.poster_path ? (
              <img
                src={getImageUrl(series.poster_path) || undefined}
                alt={series.title}
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
              <Film size={20} className="text-purple-500" />
              <span className="text-gray-400">Serie</span>
            </div>

            <h1 className="text-4xl font-bold mb-4">{series.title}</h1>

            <div className="flex items-center gap-6 mb-6 flex-wrap">
              {series.rating && (
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-500" size={20} fill="currentColor" />
                  <span className="font-bold text-lg">{series.rating.toFixed(1)}</span>
                  {series.vote_count && (
                    <span className="text-gray-400 text-sm">({series.vote_count} votos)</span>
                  )}
                </div>
              )}
              {series.year && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={18} />
                  <span>{series.year}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-400">
                <Film size={18} />
                <span>{series.total_seasons} {series.total_seasons === 1 ? 'Temporada' : 'Temporadas'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Play size={18} />
                <span>{series.total_episodes} Episodios</span>
              </div>
              {series.total_duration && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={18} />
                  <span>{formatDuration(series.total_duration)} total</span>
                </div>
              )}
            </div>

            {series.genres && series.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {series.genres.map((genre: any) => (
                  <Link
                    key={genre.id}
                    to={`/library?genre=${genre.slug}&type=series`}
                    className="bg-primary/20 text-primary px-4 py-1 rounded-full text-sm hover:bg-primary/30 transition-colors"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            )}

            {series.overview && (
              <p className="text-gray-300 max-w-3xl leading-relaxed">{series.overview}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              {/* Ver Opening Button */}
              {series.openings && series.openings.length > 0 && (
                <Link
                  to={`/media/${series.openings[0].id}`}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-full font-medium transition-all hover:scale-105"
                >
                  <Music size={20} />
                  Ver Opening
                  {series.openings.length > 1 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1">
                      +{series.openings.length - 1}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Openings Section */}
        {series.openings && series.openings.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Music className="text-purple-500" size={24} />
              Openings & Extras
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {series.openings.map((opening: any) => (
                <Link
                  key={opening.id}
                  to={`/media/${opening.id}`}
                  className="card overflow-hidden group hover:ring-2 ring-purple-500 transition-all"
                >
                  <div className="aspect-video bg-dark-card relative">
                    {opening.thumbnail_path ? (
                      <img
                        src={getImageUrl(opening.thumbnail_path) || undefined}
                        alt={opening.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-600/20">
                        <Music size={32} className="text-purple-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                        <Play size={20} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{opening.title}</p>
                    {opening.duration && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        {formatDuration(opening.duration)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cast */}
        {series.actors && series.actors.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">Reparto</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {series.actors.map((actor: any) => (
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

        {/* Episodes by Season */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Episodios</h2>

          <div className="space-y-4">
            {Object.entries(series.seasons || {}).sort(([a], [b]) => Number(a) - Number(b)).map(([seasonNum, episodes]: [string, any]) => (
              <div key={seasonNum} className="card overflow-hidden">
                {/* Season Header */}
                <button
                  onClick={() => toggleSeason(seasonNum)}
                  className="w-full p-4 flex items-center justify-between hover:bg-dark-hover transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold">Temporada {seasonNum}</span>
                    <span className="text-gray-400">{episodes.length} episodios</span>
                  </div>
                  {expandedSeasons.has(seasonNum) ? (
                    <ChevronUp size={24} />
                  ) : (
                    <ChevronDown size={24} />
                  )}
                </button>

                {/* Episodes List */}
                {expandedSeasons.has(seasonNum) && (
                  <div className="border-t border-gray-800">
                    {episodes.map((ep: any, index: number) => (
                      <Link
                        key={ep.id}
                        to={`/media/${ep.id}`}
                        className={`flex items-center gap-4 p-4 hover:bg-dark-hover transition-colors ${
                          index !== episodes.length - 1 ? 'border-b border-gray-800/50' : ''
                        }`}
                      >
                        {/* Episode Number */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-dark-hover flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{ep.episode_number || index + 1}</span>
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
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary transition-colors">
                            <Play size={18} className="text-primary group-hover:text-white ml-0.5" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
