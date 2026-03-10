import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { animeApi } from '@/services/api'
import { Play, Star, Clock, Calendar, Sparkles, ChevronDown, ChevronUp, Music } from 'lucide-react'
import { useState } from 'react'
import { getImageUrl } from '@/utils/imageUrl'

export default function AnimeDetail() {
  const { tmdbId } = useParams<{ tmdbId: string }>()
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set(['1']))

  const { data: anime, isLoading, error } = useQuery({
    queryKey: ['anime', tmdbId],
    queryFn: () => animeApi.getByTmdb(Number(tmdbId)).then((res) => res.data),
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (error || !anime) {
    return (
      <div className="text-center py-12">
        <Sparkles size={64} className="mx-auto text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Anime no encontrado</h2>
        <p className="text-gray-400">No se pudo cargar la informacion de este anime.</p>
        <Link to="/library?type=anime" className="btn btn-primary mt-4">
          Volver a Anime
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Backdrop */}
      {anime.backdrop_path && (
        <div className="absolute top-0 left-0 right-0 h-[500px] -z-10">
          <img
            src={getImageUrl(anime.backdrop_path) || undefined}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent" />
        </div>
      )}

      <div className="pt-8">
        {/* Anime Info Header */}
        <div className="flex items-start gap-8 mb-8">
          {/* Poster */}
          <div className="flex-shrink-0 w-64 hidden md:block">
            {anime.poster_path ? (
              <img
                src={getImageUrl(anime.poster_path) || undefined}
                alt={anime.title}
                className="w-full rounded-xl shadow-2xl"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-xl bg-dark-card flex items-center justify-center">
                <Sparkles size={64} className="text-gray-600" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles size={20} className="text-pink-500" />
              <span className="text-gray-400">Anime</span>
            </div>

            <h1 className="text-4xl font-bold mb-4">{anime.title}</h1>

            <div className="flex items-center gap-6 mb-6 flex-wrap">
              {anime.rating && (
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-500" size={20} fill="currentColor" />
                  <span className="font-bold text-lg">{anime.rating.toFixed(1)}</span>
                  {anime.vote_count && (
                    <span className="text-gray-400 text-sm">({anime.vote_count} votos)</span>
                  )}
                </div>
              )}
              {anime.year && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={18} />
                  <span>{anime.year}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-400">
                <Sparkles size={18} />
                <span>{anime.total_seasons} {anime.total_seasons === 1 ? 'Temporada' : 'Temporadas'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Play size={18} />
                <span>{anime.total_episodes} Episodios</span>
              </div>
              {anime.total_duration && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={18} />
                  <span>{formatDuration(anime.total_duration)} total</span>
                </div>
              )}
            </div>

            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {anime.genres.map((genre: any) => (
                  <Link
                    key={genre.id}
                    to={`/library?genre=${genre.slug}&type=anime`}
                    className="bg-pink-500/20 text-pink-400 px-4 py-1 rounded-full text-sm hover:bg-pink-500/30 transition-colors"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            )}

            {anime.overview && (
              <p className="text-gray-300 max-w-3xl leading-relaxed">{anime.overview}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              {/* Ver Opening Button */}
              {anime.openings && anime.openings.length > 0 && (
                <Link
                  to={`/media/${anime.openings[0].id}`}
                  className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-full font-medium transition-all hover:scale-105"
                >
                  <Music size={20} />
                  Ver Opening
                  {anime.openings.length > 1 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1">
                      +{anime.openings.length - 1}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Openings Section */}
        {anime.openings && anime.openings.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Music className="text-pink-500" size={24} />
              Openings & Extras
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {anime.openings.map((opening: any) => (
                <Link
                  key={opening.id}
                  to={`/media/${opening.id}`}
                  className="card overflow-hidden group hover:ring-2 ring-pink-500 transition-all"
                >
                  <div className="aspect-video bg-dark-card relative">
                    {opening.thumbnail_path ? (
                      <img
                        src={getImageUrl(opening.thumbnail_path) || undefined}
                        alt={opening.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-purple-600/20">
                        <Music size={32} className="text-pink-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center">
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
        {anime.actors && anime.actors.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">Reparto / Voces</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {anime.actors.map((actor: any) => (
                <Link
                  key={actor.id}
                  to={`/actors/${actor.id}`}
                  className="flex-shrink-0 text-center group"
                >
                  {actor.photo_path ? (
                    <img
                      src={actor.photo_path}
                      alt={actor.name}
                      className="w-20 h-20 rounded-full object-cover mb-2 group-hover:ring-2 ring-pink-500 transition-all"
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
            {Object.entries(anime.seasons || {}).sort(([a], [b]) => Number(a) - Number(b)).map(([seasonNum, episodes]: [string, any]) => (
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
                          <span className="text-lg font-bold text-pink-500">{ep.episode_number || index + 1}</span>
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
                          <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500 transition-colors">
                            <Play size={18} className="text-pink-500 group-hover:text-white ml-0.5" />
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
