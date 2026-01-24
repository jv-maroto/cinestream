import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queueApi, mediaApi } from '@/services/api'
import { RefreshCw, AlertTriangle, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

export default function Queue() {
  const queryClient = useQueryClient()

  const { data: queueStatus, isLoading } = useQuery({
    queryKey: ['queue', 'status'],
    queryFn: () => queueApi.getStatus().then((res) => res.data),
    refetchInterval: 3000,
  })

  const resetStuckMutation = useMutation({
    mutationFn: () => queueApi.resetStuck(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] })
      alert('Tareas atascadas reiniciadas')
    },
    onError: () => {
      alert('Error al reiniciar tareas')
    },
  })

  const reprocessBatchMutation = useMutation({
    mutationFn: (status: string) => mediaApi.reprocessBatch({ status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['queue'] })
      alert(`Re-procesamiento iniciado para medios con estado: ${status}`)
    },
    onError: () => {
      alert('Error al iniciar re-procesamiento')
    },
  })

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Cargando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Clock size={32} />
          Cola de Procesamiento
        </h1>

        <button
          onClick={() => resetStuckMutation.mutate()}
          disabled={resetStuckMutation.isPending}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RotateCcw size={18} className={resetStuckMutation.isPending ? 'animate-spin' : ''} />
          Reiniciar Atascados
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/20">
              <Clock className="text-yellow-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pendientes</p>
              <p className="text-2xl font-bold">{queueStatus?.pending || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <RefreshCw className="text-blue-500 animate-spin" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Procesando</p>
              <p className="text-2xl font-bold">{queueStatus?.processing || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Completados</p>
              <p className="text-2xl font-bold">{queueStatus?.completed || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/20">
              <XCircle className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Con errores</p>
              <p className="text-2xl font-bold">{queueStatus?.error || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Acciones de Lote</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => reprocessBatchMutation.mutate('error')}
            disabled={reprocessBatchMutation.isPending || !queueStatus?.error}
            className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={18} />
            Re-procesar con Errores ({queueStatus?.error || 0})
          </button>

          <button
            onClick={() => reprocessBatchMutation.mutate('pending')}
            disabled={reprocessBatchMutation.isPending || !queueStatus?.pending}
            className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={18} />
            Procesar Pendientes ({queueStatus?.pending || 0})
          </button>
        </div>
      </div>

      {/* Processing Items */}
      {queueStatus?.processing_items && queueStatus.processing_items.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <RefreshCw className="animate-spin" size={20} />
            Procesando Ahora
          </h2>
          <div className="space-y-4">
            {queueStatus.processing_items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-dark-hover rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">
                    {item.title || item.filename}
                    {item.season_number && item.episode_number && (
                      <span className="text-primary ml-2">
                        S{String(item.season_number).padStart(2, '0')}E{String(item.episode_number).padStart(2, '0')}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-400">
                    {item.processing_step || 'Iniciando...'}
                    <span className="text-gray-500 ml-2">• {item.filename}</span>
                  </p>
                </div>
                <div className="w-32">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Progreso</span>
                    <span className="text-primary">{item.processing_progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{ width: `${item.processing_progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Errors */}
      {queueStatus?.recent_errors && queueStatus.recent_errors.length > 0 && (
        <div className="card p-6 mt-6 border border-red-900/50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500">
            <AlertTriangle size={20} />
            Errores Recientes
          </h2>
          <div className="space-y-3">
            {queueStatus.recent_errors.map((item: any) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-red-900/20 rounded-lg">
                <XCircle className="text-red-500 flex-shrink-0 mt-1" size={18} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title || item.filename}</p>
                  <p className="text-sm text-red-400">{item.error_message || 'Error desconocido'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
