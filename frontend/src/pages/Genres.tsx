import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { genresApi } from '@/services/api'
import {
  Tag, Film, Sword, Mountain, Laugh, Theater, Rocket, Ghost,
  Palette, Crosshair, Heart, Wand2, BookOpen, Search as SearchIcon,
  Shield, Sparkles, Brain,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'

interface GenreStyle {
  icon: LucideIcon
  gradient: string
  glow: string
}

const genreStyles: Record<string, GenreStyle> = {
  'accion': { icon: Sword, gradient: 'from-red-600/90 to-orange-700/90', glow: 'hover:shadow-red-500/30' },
  'action': { icon: Sword, gradient: 'from-red-600/90 to-orange-700/90', glow: 'hover:shadow-red-500/30' },
  'aventura': { icon: Mountain, gradient: 'from-emerald-600/90 to-teal-700/90', glow: 'hover:shadow-emerald-500/30' },
  'adventure': { icon: Mountain, gradient: 'from-emerald-600/90 to-teal-700/90', glow: 'hover:shadow-emerald-500/30' },
  'comedia': { icon: Laugh, gradient: 'from-yellow-500/90 to-amber-600/90', glow: 'hover:shadow-yellow-500/30' },
  'comedy': { icon: Laugh, gradient: 'from-yellow-500/90 to-amber-600/90', glow: 'hover:shadow-yellow-500/30' },
  'drama': { icon: Theater, gradient: 'from-purple-600/90 to-indigo-700/90', glow: 'hover:shadow-purple-500/30' },
  'ciencia-ficcion': { icon: Rocket, gradient: 'from-cyan-500/90 to-blue-700/90', glow: 'hover:shadow-cyan-500/30' },
  'science-fiction': { icon: Rocket, gradient: 'from-cyan-500/90 to-blue-700/90', glow: 'hover:shadow-cyan-500/30' },
  'terror': { icon: Ghost, gradient: 'from-gray-800/90 to-red-950/90', glow: 'hover:shadow-red-900/30' },
  'horror': { icon: Ghost, gradient: 'from-gray-800/90 to-red-950/90', glow: 'hover:shadow-red-900/30' },
  'animacion': { icon: Palette, gradient: 'from-pink-500/90 to-violet-600/90', glow: 'hover:shadow-pink-500/30' },
  'animation': { icon: Palette, gradient: 'from-pink-500/90 to-violet-600/90', glow: 'hover:shadow-pink-500/30' },
  'thriller': { icon: Crosshair, gradient: 'from-red-800/90 to-slate-800/90', glow: 'hover:shadow-red-800/30' },
  'romance': { icon: Heart, gradient: 'from-rose-500/90 to-pink-600/90', glow: 'hover:shadow-rose-500/30' },
  'fantasia': { icon: Wand2, gradient: 'from-violet-600/90 to-purple-800/90', glow: 'hover:shadow-violet-500/30' },
  'fantasy': { icon: Wand2, gradient: 'from-violet-600/90 to-purple-800/90', glow: 'hover:shadow-violet-500/30' },
  'documental': { icon: BookOpen, gradient: 'from-blue-600/90 to-sky-700/90', glow: 'hover:shadow-blue-500/30' },
  'documentary': { icon: BookOpen, gradient: 'from-blue-600/90 to-sky-700/90', glow: 'hover:shadow-blue-500/30' },
  'crimen': { icon: SearchIcon, gradient: 'from-slate-700/90 to-zinc-800/90', glow: 'hover:shadow-slate-500/30' },
  'crime': { icon: SearchIcon, gradient: 'from-slate-700/90 to-zinc-800/90', glow: 'hover:shadow-slate-500/30' },
  'misterio': { icon: Brain, gradient: 'from-indigo-700/90 to-blue-900/90', glow: 'hover:shadow-indigo-500/30' },
  'mystery': { icon: Brain, gradient: 'from-indigo-700/90 to-blue-900/90', glow: 'hover:shadow-indigo-500/30' },
  'guerra': { icon: Shield, gradient: 'from-green-800/90 to-stone-700/90', glow: 'hover:shadow-green-800/30' },
  'war': { icon: Shield, gradient: 'from-green-800/90 to-stone-700/90', glow: 'hover:shadow-green-800/30' },
  'shonen': { icon: Sparkles, gradient: 'from-orange-500/90 to-red-600/90', glow: 'hover:shadow-orange-500/30' },
  'seinen': { icon: Crosshair, gradient: 'from-slate-600/90 to-indigo-800/90', glow: 'hover:shadow-slate-500/30' },
}

const defaultStyle: GenreStyle = {
  icon: Tag,
  gradient: 'from-primary/90 to-purple-700/90',
  glow: 'hover:shadow-primary/30',
}

export default function Genres() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['genres'],
    queryFn: () => genresApi.getAll().then((res) => res.data),
  })

  const genres = data?.genres?.filter((g: { name: string }) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  const totalMedia = data?.genres?.reduce((sum: number, g: { media_count?: number }) => sum + (g.media_count || 0), 0) || 0

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Tag size={28} className="text-primary" />
            </div>
            Géneros
          </h1>
          <p className="text-gray-500 mt-1 ml-14">
            {data?.genres?.length || 0} géneros &middot; {totalMedia} títulos en total
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Buscar género..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-card/50 border border-dark-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-dark-card animate-pulse" />
          ))}
        </div>
      )}

      {/* Grid */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {genres.map((genre: { id: number; name: string; slug: string; media_count?: number }) => {
            const style = genreStyles[genre.slug] || defaultStyle
            const Icon = style.icon

            return (
              <Link
                key={genre.id}
                to={`/library?genre=${genre.slug}`}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${style.gradient} transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${style.glow}`}
              >
                <div className="relative z-10 p-6 flex flex-col justify-between h-36">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm group-hover:bg-white/25 transition-colors">
                      <Icon size={24} className="text-white" />
                    </div>
                    {(genre.media_count || 0) > 0 && (
                      <span className="text-white/70 text-sm font-medium bg-black/20 px-2.5 py-1 rounded-lg">
                        {genre.media_count}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-white/90 transition-colors">
                      {genre.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/60 text-xs mt-0.5">
                      <Film size={12} />
                      <span>
                        {genre.media_count || 0} {genre.media_count === 1 ? 'título' : 'títulos'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Decorative background icon */}
                <Icon
                  size={120}
                  className="absolute -bottom-4 -right-4 text-white/[0.06] group-hover:text-white/[0.1] transition-colors duration-500 rotate-12 group-hover:rotate-6"
                />
              </Link>
            )
          })}
        </div>
      )}

      {/* Empty: search no results */}
      {!isLoading && genres.length === 0 && search && (
        <div className="text-center py-16">
          <SearchIcon size={48} className="mx-auto text-gray-700 mb-4" />
          <h3 className="text-xl font-bold mb-2">Sin resultados</h3>
          <p className="text-gray-400">No se encontraron géneros para "{search}"</p>
        </div>
      )}

      {/* Empty: no genres at all */}
      {!isLoading && data?.genres?.length === 0 && (
        <div className="text-center py-16">
          <Tag size={48} className="mx-auto text-gray-700 mb-4" />
          <h3 className="text-xl font-bold mb-2">Sin géneros</h3>
          <p className="text-gray-400">Escanea tu biblioteca para descubrir géneros.</p>
        </div>
      )}
    </div>
  )
}
