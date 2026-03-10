import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Film, Tv, Users, List, Settings, Sparkles, FileVideo, Search, Bell, X, ChevronRight, Command } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queueApi } from '@/services/api'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { data: queueStatus } = useQuery({
    queryKey: ['queue-status'],
    queryFn: () => queueApi.getStatus().then(res => res.data),
    refetchInterval: 5000,
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        searchInputRef.current?.blur()
        setSearchFocused(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path
    }
    return location.pathname === path && !location.search
  }

  const isLibrarySection = location.pathname === '/library'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/library?search=${encodeURIComponent(searchQuery)}`)
      searchInputRef.current?.blur()
    }
  }

  const processingCount = queueStatus?.processing || 0
  const errorCount = queueStatus?.error || 0

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Top Header */}
      <header className="fixed top-0 left-60 right-0 h-14 bg-dark-surface/80 backdrop-blur-xl z-40 flex items-center px-6 gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative group">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? 'text-primary' : 'text-gray-600'}`} size={16} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Buscar contenido..."
              className="w-full bg-dark-bg/60 border border-dark-border/40 rounded-lg pl-10 pr-16 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-dark-bg transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-600 pointer-events-none">
              <kbd className="text-[10px] bg-dark-bg/80 border border-dark-border/50 rounded px-1.5 py-0.5 font-mono">
                <Command size={10} className="inline -mt-0.5" />K
              </kbd>
            </div>
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-dark-hover text-white' : 'text-gray-500 hover:bg-dark-hover hover:text-gray-300'}`}
              aria-label="Notificaciones"
            >
              <Bell size={18} />
              {processingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-dark-surface" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-dark-surface border border-dark-border/50 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">Notificaciones</span>
                  <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-dark-hover rounded-lg">
                    <X size={14} className="text-gray-500" />
                  </button>
                </div>
                <div className="border-t border-dark-border/30">
                  {processingCount > 0 ? (
                    <div className="px-4 py-3 hover:bg-dark-hover/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                          <Film size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-white">Procesando archivos</p>
                          <p className="text-xs text-gray-500">{processingCount} en cola</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Bell size={24} className="mx-auto mb-2 text-gray-700" />
                      <p className="text-xs text-gray-600">Todo al día</p>
                    </div>
                  )}
                </div>
                <Link
                  to="/queue"
                  onClick={() => setShowNotifications(false)}
                  className="block px-4 py-2.5 text-center text-xs text-primary hover:bg-dark-hover/50 border-t border-dark-border/30 transition-colors"
                >
                  Ver cola completa
                </Link>
              </div>
            )}
          </div>

          {/* Settings shortcut */}
          <Link
            to="/settings"
            className={`p-2 rounded-lg transition-colors ${isActive('/settings') ? 'bg-dark-hover text-white' : 'text-gray-500 hover:bg-dark-hover hover:text-gray-300'}`}
            aria-label="Ajustes"
          >
            <Settings size={18} />
          </Link>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center text-xs font-bold ml-1 cursor-default">
            U
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-dark-surface z-50 flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-dark-border/30">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-pink-600 rounded-lg flex items-center justify-center">
              <Film size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">CineStream</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-4">
          {/* Main */}
          <div className="space-y-0.5 mb-5">
            <Link
              to="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive('/')
                  ? 'bg-white/[0.08] text-white'
                  : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
              }`}
            >
              <Home size={18} />
              <span className="text-sm font-medium">Inicio</span>
            </Link>

            <Link
              to="/library"
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                isLibrarySection && !location.search
                  ? 'bg-white/[0.08] text-white'
                  : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Film size={18} />
                <span className="text-sm font-medium">Biblioteca</span>
              </div>
              <ChevronRight size={14} className="opacity-30" />
            </Link>
          </div>

          {/* Categories - indented */}
          <div className="ml-5 pl-3 border-l border-dark-border/30 mb-5 space-y-0.5">
            {[
              { path: '/library?type=movie', icon: Film, label: 'Películas', dot: 'bg-blue-400' },
              { path: '/library?type=series', icon: Tv, label: 'Series', dot: 'bg-purple-400' },
              { path: '/library?type=anime', icon: Sparkles, label: 'Anime', dot: 'bg-pink-400' },
              { path: '/library?type=documentary', icon: FileVideo, label: 'Documentales', dot: 'bg-green-400' },
            ].map((item) => {
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all text-[13px] ${
                    active
                      ? 'text-white bg-white/[0.06]'
                      : 'text-gray-600 hover:text-gray-400 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${active ? item.dot : 'bg-gray-700'}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Secondary */}
          <div className="space-y-0.5">
            <Link
              to="/actors"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                location.pathname.startsWith('/actors')
                  ? 'bg-white/[0.08] text-white'
                  : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
              }`}
            >
              <Users size={18} />
              <span className="text-sm font-medium">Actores</span>
            </Link>

            <Link
              to="/queue"
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                isActive('/queue')
                  ? 'bg-white/[0.08] text-white'
                  : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <List size={18} />
                <span className="text-sm font-medium">Cola</span>
              </div>
              {processingCount > 0 && (
                <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                  {processingCount}
                </span>
              )}
              {errorCount > 0 && processingCount === 0 && (
                <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                  {errorCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-dark-border/20">
          <p className="text-[10px] text-gray-700">CineStream v1.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-60 pt-14 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
