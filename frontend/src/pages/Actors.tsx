import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { actorsApi } from '@/services/api'
import { Search, Users } from 'lucide-react'

interface ActorFilters {
  page: number
  limit: number
  search?: string
  sort_by?: string
}

export default function Actors() {
  const [filters, setFilters] = useState<ActorFilters>({
    page: 1,
    limit: 48,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['actors', filters],
    queryFn: () => actorsApi.getAll(filters).then((res) => res.data),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users size={32} />
          Actores
        </h1>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10" size={20} />
          <input
            type="text"
            placeholder="Buscar actores..."
            className="w-full bg-dark-card/50 border border-dark-border/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, page: 1, search: e.target.value }))
            }
          />
        </div>

        <select
          className="bg-dark-card/50 border border-dark-border/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
          value={filters.sort_by || 'popularity'}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, page: 1, sort_by: e.target.value }))
          }
        >
          <option value="popularity">Por popularidad</option>
          <option value="name">Por nombre</option>
          <option value="media_count">Por filmografía</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {data?.actors?.map((actor: any) => (
              <Link
                key={actor.id}
                to={`/actors/${actor.id}`}
                className="card p-4 text-center hover:bg-dark-hover transition-colors group"
              >
                {actor.photo_path ? (
                  <img
                    src={actor.photo_path}
                    alt={actor.name}
                    className="w-24 h-24 rounded-full mx-auto object-cover mb-3 group-hover:ring-4 group-hover:ring-primary/50 transition-all"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full mx-auto bg-dark-hover flex items-center justify-center mb-3 group-hover:ring-4 group-hover:ring-primary/50 transition-all">
                    <span className="text-gray-500 text-3xl">
                      {actor.name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <p className="font-medium truncate">{actor.name}</p>
                {actor.media_count > 0 && (
                  <p className="text-sm text-gray-400">
                    {actor.media_count} {actor.media_count === 1 ? 'título' : 'títulos'}
                  </p>
                )}
              </Link>
            ))}
          </div>

          {data?.actors?.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No se encontraron actores
            </div>
          )}

          {data && data.total > filters.limit && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))
                }
                disabled={filters.page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Anterior
              </button>

              <span className="flex items-center px-4">
                Página {filters.page} de {Math.ceil(data.total / filters.limit)}
              </span>

              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
                }
                disabled={filters.page >= Math.ceil(data.total / filters.limit)}
                className="btn btn-secondary disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
