import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { genresApi } from '@/services/api'
import { Tag, Film } from 'lucide-react'

const genreColors: Record<string, string> = {
  'action': 'from-red-600 to-orange-600',
  'adventure': 'from-green-600 to-teal-600',
  'animation': 'from-pink-500 to-purple-500',
  'comedy': 'from-yellow-500 to-amber-500',
  'crime': 'from-gray-700 to-gray-900',
  'documentary': 'from-blue-600 to-cyan-600',
  'drama': 'from-purple-600 to-indigo-600',
  'family': 'from-green-400 to-emerald-500',
  'fantasy': 'from-violet-600 to-purple-600',
  'history': 'from-amber-700 to-yellow-700',
  'horror': 'from-gray-900 to-red-900',
  'music': 'from-pink-600 to-rose-600',
  'mystery': 'from-indigo-700 to-blue-900',
  'romance': 'from-rose-500 to-pink-500',
  'science-fiction': 'from-cyan-600 to-blue-600',
  'tv-movie': 'from-gray-600 to-slate-600',
  'thriller': 'from-red-800 to-gray-800',
  'war': 'from-green-800 to-gray-700',
  'western': 'from-amber-600 to-orange-700',
}

export default function Genres() {
  const { data, isLoading } = useQuery({
    queryKey: ['genres'],
    queryFn: () => genresApi.getAll().then((res) => res.data),
  })

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Cargando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Tag size={32} />
          Géneros
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data?.genres?.map((genre: any) => (
          <Link
            key={genre.id}
            to={`/library?genre=${genre.slug}`}
            className={`relative overflow-hidden rounded-xl p-6 transition-transform hover:scale-105 bg-gradient-to-br ${genreColors[genre.slug] || 'from-primary to-purple-600'}`}
          >
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">{genre.name}</h3>
              <div className="flex items-center gap-2 text-white/80">
                <Film size={16} />
                <span>
                  {genre.media_count || 0} {genre.media_count === 1 ? 'título' : 'títulos'}
                </span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-20">
              <Tag size={128} />
            </div>
          </Link>
        ))}
      </div>

      {data?.genres?.length === 0 && (
        <div className="card p-8 text-center text-gray-400">
          No hay géneros disponibles. Escanea tu biblioteca para comenzar.
        </div>
      )}
    </div>
  )
}
