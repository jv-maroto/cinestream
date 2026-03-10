import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Film, Tv, Users, List, Settings, Sparkles, FileVideo, Search, Bell, X, ChevronRight } from 'lucide-react'
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
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

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
    }
  }

  const processingCount = queueStatus?.processing || 0
  const errorCount = queueStatus?.error || 0

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Top Header */}
      <header className="fixed top-0 left-60 right-0 h-16 bg-dark-bg/90 backdrop-blur-md border-b border-dark-border z-40 flex items-center px-6">
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar películas, series, anime..."
              className="w-full bg-dark-card border border-dark-border rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </form>

        <div className="flex items-center gap-3 ml-6">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-dark-hover rounded-full transition-colors"
              aria-label="Notificaciones"
            >
              <Bell size={20} className="text-gray-400 hover:text-white" />
              {processingCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-dark-border flex items-center justify-between">
                  <h3 className="font-semibold">Notificaciones</h3>
                  <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-dark-hover rounded-full">
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {processingCount > 0 ? (
                    <div className="p-4 border-b border-dark-border hover:bg-dark-hover">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Film size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Procesando archivos</p>
                          <p className="text-xs text-gray-400">{processingCount} en cola</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sin notificaciones</p>
                    </div>
                  )}
                </div>
                <Link
                  to="/queue"
                  onClick={() => setShowNotifications(false)}
                  className="block p-3 text-center text-sm text-primary hover:bg-dark-hover border-t border-dark-border"
                >
                  Ver cola completa
                </Link>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center text-sm font-bold">
            U
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-dark-surface border-r border-dark-border z-50 flex flex-col">
        {/* Logo */}
        <div className="p-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Film size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">CineStream</h1>
              <p className="text-[10px] text-gray-500 -mt-0.5">Tu cine en casa</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {/* Home */}
          <div className="mb-1">
            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive('/')
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <Home size={20} />
              <span className="font-medium">Inicio</span>
            </Link>
          </div>

          {/* Biblioteca section */}
          <div className="mb-1">
            <Link
              to="/library"
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                isLibrarySection && !location.search
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Film size={20} />
                <span className="font-medium">Biblioteca</span>
              </div>
              <ChevronRight size={16} className="opacity-40" />
            </Link>
          </div>

          {/* Category quick filters */}
          <div className="ml-4 pl-4 border-l border-dark-border/50 mb-6 space-y-0.5">
            {[
              { path: '/library?type=movie', icon: Film, label: 'Películas', color: 'text-blue-400', activeBg: 'bg-blue-500/10' },
              { path: '/library?type=series', icon: Tv, label: 'Series', color: 'text-purple-400', activeBg: 'bg-purple-500/10' },
              { path: '/library?type=anime', icon: Sparkles, label: 'Anime', color: 'text-pink-400', activeBg: 'bg-pink-500/10' },
              { path: '/library?type=documentary', icon: FileVideo, label: 'Documentales', color: 'text-green-400', activeBg: 'bg-green-500/10' },
            ].map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                    active
                      ? `${item.activeBg} ${item.color}`
                      : 'text-gray-500 hover:bg-dark-hover hover:text-gray-300'
                  }`}
                >
                  <Icon size={15} className={active ? item.color : ''} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-dark-border/50 mx-3 mb-4" />

          {/* Secondary items */}
          <div className="space-y-0.5">
            <Link
              to="/actors"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                location.pathname.startsWith('/actors')
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <Users size={18} />
              <span className="text-sm">Actores</span>
            </Link>

            <Link
              to="/queue"
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                isActive('/queue')
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <List size={18} />
                <span className="text-sm">Cola</span>
              </div>
              {processingCount > 0 && (
                <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {processingCount}
                </span>
              )}
              {errorCount > 0 && processingCount === 0 && (
                <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                  {errorCount}
                </span>
              )}
            </Link>

            <Link
              to="/settings"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive('/settings')
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <Settings size={18} />
              <span className="text-sm">Ajustes</span>
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3">
          <div className="rounded-xl bg-dark-card/50 px-4 py-3">
            <div className="flex items-center justify-between text-[11px] text-gray-600">
              <span>TMDB + AI</span>
              <span>v1.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-60 pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
