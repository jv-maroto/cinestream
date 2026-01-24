import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { actorsApi } from '@/services/api'
import { Calendar, MapPin, Film, ExternalLink } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010'

export default function ActorDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: actor, isLoading } = useQuery({
    queryKey: ['actor', id],
    queryFn: () => actorsApi.getById(Number(id)).then((res) => res.data),
    enabled: !!id,
  })

  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${API_URL}${path}`
  }

  if (isLoading) {
    return <div className="text-center py-12">Cargando...</div>
  }

  if (!actor) {
    return <div className="text-center py-12">Actor no encontrado</div>
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Photo */}
        <div className="flex-shrink-0">
          {actor.photo_path ? (
            <img
              src={actor.photo_path}
              alt={actor.name}
              className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover mx-auto md:mx-0"
            />
          ) : (
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-dark-card flex items-center justify-center mx-auto md:mx-0">
              <span className="text-gray-500 text-6xl">
                {actor.name?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-bold mb-4">{actor.name}</h1>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
            {actor.birth_date && (
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={18} />
                <span>{new Date(actor.birth_date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            )}
            {actor.birth_place && (
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin size={18} />
                <span>{actor.birth_place}</span>
              </div>
            )}
          </div>

          {actor.biography && (
            <p className="text-gray-300 mb-6 max-w-3xl">{actor.biography}</p>
          )}

          {actor.external_url && (
            <a
              href={actor.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <ExternalLink size={18} />
              Ver en TMDB
            </a>
          )}
        </div>
      </div>

      {/* Filmography */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Film size={24} />
          Filmografía ({actor.media?.length || 0})
        </h2>

        {actor.media && actor.media.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {actor.media.map((item: any) => (
              <Link
                key={item.id}
                to={`/media/${item.id}`}
                className="group"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-dark-card">
                  {item.poster_path ? (
                    <img
                      src={getImageUrl(item.poster_path) || undefined}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-dark-hover">
                      <Film size={32} className="text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      {item.character_name && (
                        <p className="text-xs text-gray-400">como {item.character_name}</p>
                      )}
                      <p className="text-xs text-gray-400">{item.year}</p>
                    </div>
                  </div>
                  {item.rating && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                      {item.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-gray-400">
            No hay películas o series registradas para este actor
          </div>
        )}
      </section>
    </div>
  )
}
