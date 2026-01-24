import { useQuery, useMutation } from '@tanstack/react-query'
import { Settings as SettingsIcon, Database, Film, RefreshCw, Sparkles, HardDrive, Key, ExternalLink, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { mediaApi } from '@/services/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010'

export default function Settings() {

  // Get queue status to show processing info
  const { data: queueStatus } = useQuery({
    queryKey: ['queue', 'status'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_URL}/api/queue/status`)
        return response.json()
      } catch {
        return null
      }
    },
    refetchInterval: 5000
  })

  // Check service health
  const { data: servicesHealth } = useQuery({
    queryKey: ['services', 'health'],
    queryFn: async () => {
      const checkService = async (url: string) => {
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(3000) })
          return response.ok
        } catch {
          return false
        }
      }

      const [backend, yolo, classifier] = await Promise.all([
        checkService(`${API_URL}/health`),
        checkService('http://localhost:8011/health'),
        checkService('http://localhost:8013/health'),
      ])

      return { backend, yolo, classifier }
    },
    refetchInterval: 10000
  })

  const scanMutation = useMutation({
    mutationFn: () => mediaApi.scan()
  })

  const handleScan = () => {
    scanMutation.mutate()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon size={32} className="text-primary" />
          Configuración
        </h1>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Current Status Card */}
        <div className="card p-6 bg-gradient-to-r from-primary/10 to-purple-900/10 border-primary/30">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Info size={22} className="text-primary" />
            Estado del Sistema
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-bg/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-500">{queueStatus?.pending || 0}</p>
            </div>
            <div className="bg-dark-bg/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Procesando</p>
              <p className="text-2xl font-bold text-blue-500">{queueStatus?.processing || 0}</p>
            </div>
            <div className="bg-dark-bg/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Completados</p>
              <p className="text-2xl font-bold text-green-500">{queueStatus?.completed || 0}</p>
            </div>
            <div className="bg-dark-bg/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Errores</p>
              <p className="text-2xl font-bold text-red-500">{queueStatus?.error || 0}</p>
            </div>
          </div>
        </div>

        {/* Media Path */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <HardDrive className="text-blue-500" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Fuente de Medios</h2>
                <p className="text-sm text-gray-400">Configurado: Disco D:\</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle size={18} />
              <span className="text-sm">Activo</span>
            </div>
          </div>
          <p className="text-gray-400 mb-4">
            El sistema está configurado para escanear todo el disco <strong className="text-white">D:\</strong>.
            Se buscarán películas, series, anime y documentales en todas las subcarpetas.
          </p>
          <div className="bg-dark-hover rounded-lg p-4 mb-4">
            <code className="text-sm text-green-400">MEDIA_PATH=D:/</code>
          </div>
          <button
            onClick={handleScan}
            disabled={scanMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw size={18} className={scanMutation.isPending ? 'animate-spin' : ''} />
            {scanMutation.isPending ? 'Escaneando...' : 'Iniciar Escaneo'}
          </button>
          {scanMutation.isSuccess && (
            <p className="text-green-400 text-sm mt-3">
              Escaneo iniciado correctamente. Los archivos se procesarán en segundo plano.
            </p>
          )}
        </div>

        {/* TMDB Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Database className="text-yellow-500" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold">TMDB API</h2>
              <p className="text-sm text-gray-400">Información de películas y series</p>
            </div>
          </div>
          <p className="text-gray-400 mb-4">
            La API de TMDB proporciona información detallada sobre películas, series y actores.
            Es necesaria para obtener posters, sinopsis, valoraciones y metadatos.
          </p>

          <div className="bg-dark-hover rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Key size={16} className="text-gray-400" />
              <span className="text-sm font-medium">API Key (configurar en .env)</span>
            </div>
            <code className="text-sm text-green-400 block">TMDB_API_KEY=tu_api_key_aqui</code>
          </div>

          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <ExternalLink size={16} />
            Obtener API Key en TMDB
          </a>
        </div>

        {/* Content Types */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-500/20 rounded-lg">
              <Sparkles className="text-pink-500" size={22} />
            </div>
            <h2 className="text-xl font-bold">Tipos de Contenido Detectados</h2>
          </div>
          <p className="text-gray-400 mb-4">
            El sistema detecta automáticamente el tipo de contenido basándose en el nombre del archivo
            y la estructura de carpetas.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
              <Film className="text-blue-500 mx-auto mb-2" size={24} />
              <span className="text-sm font-medium">Películas</span>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
              <Film className="text-purple-500 mx-auto mb-2" size={24} />
              <span className="text-sm font-medium">Series</span>
            </div>
            <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-3 text-center">
              <Sparkles className="text-pink-500 mx-auto mb-2" size={24} />
              <span className="text-sm font-medium">Anime</span>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
              <Film className="text-green-500 mx-auto mb-2" size={24} />
              <span className="text-sm font-medium">Documentales</span>
            </div>
          </div>
        </div>

        {/* Supported Formats */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Film className="text-purple-500" size={22} />
            </div>
            <h2 className="text-xl font-bold">Formatos Soportados</h2>
          </div>
          <p className="text-gray-400 mb-4">
            El sistema reconoce los siguientes formatos de video:
          </p>
          <div className="flex flex-wrap gap-2">
            {['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'].map((format) => (
              <span
                key={format}
                className="bg-dark-hover px-4 py-2 rounded-lg text-sm font-mono"
              >
                {format}
              </span>
            ))}
          </div>
        </div>

        {/* Naming Conventions */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <RefreshCw className="text-green-500" size={22} />
            </div>
            <h2 className="text-xl font-bold">Convenciones de Nombrado</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Para mejores resultados de detección, usa estas convenciones:
          </p>
          <div className="space-y-3">
            <div className="bg-dark-hover rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Film size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-white">Películas:</span>
              </div>
              <code className="text-sm text-green-400 block">
                Nombre de la Película (2024).mkv
              </code>
              <code className="text-sm text-green-400 block mt-1">
                The.Movie.Name.2024.1080p.BluRay.mkv
              </code>
            </div>
            <div className="bg-dark-hover rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Film size={16} className="text-purple-500" />
                <span className="text-sm font-medium text-white">Series:</span>
              </div>
              <code className="text-sm text-green-400 block">
                Nombre de la Serie S01E05.mkv
              </code>
              <code className="text-sm text-green-400 block mt-1">
                Series.Name.S01E05.720p.HDTV.mkv
              </code>
            </div>
            <div className="bg-dark-hover rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-pink-500" />
                <span className="text-sm font-medium text-white">Anime:</span>
              </div>
              <code className="text-sm text-green-400 block">
                [SubGroup] Anime Name - 01 [1080p].mkv
              </code>
              <code className="text-sm text-green-400 block mt-1">
                Anime Name - 01 (1080p).mkv
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Tip: Coloca el anime en una carpeta llamada "Anime" para mejor detección
              </p>
            </div>
          </div>
        </div>

        {/* AI Services */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Sparkles className="text-cyan-500" size={22} />
            </div>
            <h2 className="text-xl font-bold">Servicios de IA</h2>
          </div>
          <p className="text-gray-400 mb-4">
            El sistema utiliza modelos de IA para análisis avanzado de contenido.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-dark-hover rounded-lg p-4">
              <div>
                <p className="font-medium">YOLO v8 (Detección de objetos)</p>
                <p className="text-sm text-gray-400">Detecta objetos y personas en escenas</p>
              </div>
              <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                GPU Requerida
              </span>
            </div>
            <div className="flex items-center justify-between bg-dark-hover rounded-lg p-4">
              <div>
                <p className="font-medium">CLIP (Clasificación de escenas)</p>
                <p className="text-sm text-gray-400">Clasifica el tipo de escena</p>
              </div>
              <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                GPU Requerida
              </span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-yellow-500 mt-0.5" />
              <p className="text-sm text-yellow-200">
                Los servicios de IA requieren una GPU NVIDIA con CUDA. Si no tienes GPU,
                estos servicios se desactivarán automáticamente pero el resto del sistema funcionará.
              </p>
            </div>
          </div>
        </div>

        {/* Docker Info */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Database className="text-blue-500" size={22} />
            </div>
            <h2 className="text-xl font-bold">Servicios Docker</h2>
          </div>
          <p className="text-gray-400 mb-4">
            El sistema se ejecuta en contenedores Docker con los siguientes servicios:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-dark-hover rounded-lg p-3 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${servicesHealth?.backend ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <p className="font-medium text-sm">Backend API</p>
                <p className="text-xs text-gray-500">Puerto 8010</p>
              </div>
            </div>
            <div className="bg-dark-hover rounded-lg p-3 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-sm">Frontend</p>
                <p className="text-xs text-gray-500">Puerto 3001</p>
              </div>
            </div>
            <div className="bg-dark-hover rounded-lg p-3 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${servicesHealth?.yolo ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <div>
                <p className="font-medium text-sm">YOLO API</p>
                <p className="text-xs text-gray-500">Puerto 8011 (GPU)</p>
              </div>
            </div>
            <div className="bg-dark-hover rounded-lg p-3 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${servicesHealth?.classifier ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <div>
                <p className="font-medium text-sm">Classifier API</p>
                <p className="text-xs text-gray-500">Puerto 8013 (GPU)</p>
              </div>
            </div>
            <div className="bg-dark-hover rounded-lg p-3 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-sm">PostgreSQL</p>
                <p className="text-xs text-gray-500">Puerto 5433</p>
              </div>
            </div>
            <div className="bg-dark-hover rounded-lg p-3 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-sm">Redis</p>
                <p className="text-xs text-gray-500">Puerto 6380</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
