import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queueApi, mediaApi } from '@/services/api'
import { RefreshCw, AlertTriangle, Clock, CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react'

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
    },
  })

  const reprocessBatchMutation = useMutation({
    mutationFn: (status: string) => mediaApi.reprocessBatch({ status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    },
  })

  const pending = queueStatus?.pending || 0
  const processing = queueStatus?.processing || 0
  const completed = queueStatus?.completed || 0
  const errors = queueStatus?.error || 0
  const total = pending + processing + completed + errors

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-600" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Cola de Procesamiento</h1>
          <p className="text-sm text-gray-500 mt-1">{total} archivos en total</p>
        </div>
        <button
          onClick={() => resetStuckMutation.mutate()}
          disabled={resetStuckMutation.isPending}
          className="text-sm text-gray-500 hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-hover transition-colors disabled:opacity-50"
        >
          <RotateCcw size={14} className={resetStuckMutation.isPending ? 'animate-spin' : ''} />
          Reiniciar atascados
        </button>
      </div>

      {/* Stats bar */}
      <div className="mb-8">
        {/* Progress bar */}
        {total > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden bg-dark-card mb-4">
            {completed > 0 && (
              <div className="bg-green-500 transition-all" style={{ width: `${(completed / total) * 100}%` }} />
            )}
            {processing > 0 && (
              <div className="bg-blue-500 animate-pulse transition-all" style={{ width: `${(processing / total) * 100}%` }} />
            )}
            {pending > 0 && (
              <div className="bg-yellow-500/60 transition-all" style={{ width: `${(pending / total) * 100}%` }} />
            )}
            {errors > 0 && (
              <div className="bg-red-500 transition-all" style={{ width: `${(errors / total) * 100}%` }} />
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-sm text-gray-400">Completados</span>
            <span className="text-sm font-bold text-white">{completed}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-400">Procesando</span>
            <span className="text-sm font-bold text-white">{processing}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="text-sm text-gray-400">Pendientes</span>
            <span className="text-sm font-bold text-white">{pending}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-sm text-gray-400">Errores</span>
            <span className="text-sm font-bold text-white">{errors}</span>
          </div>
        </div>
      </div>

      {/* Processing items */}
      {queueStatus?.processing_items && queueStatus.processing_items.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Procesando ahora</h2>
          <div className="space-y-2">
            {queueStatus.processing_items.map((item: { id: number; title?: string; filename: string; season_number?: number; episode_number?: number; processing_step?: string; processing_progress?: number }) => (
              <div key={item.id} className="bg-dark-card/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Loader2 size={14} className="text-blue-400 animate-spin flex-shrink-0" />
                    <span className="text-sm font-medium text-white truncate">
                      {item.title || item.filename}
                    </span>
                    {item.season_number && item.episode_number && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        S{String(item.season_number).padStart(2, '0')}E{String(item.episode_number).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-blue-400 ml-3">{item.processing_progress || 0}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-dark-hover rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${item.processing_progress || 0}%` }}
                    />
                  </div>
                </div>
                {item.processing_step && (
                  <p className="text-[11px] text-gray-600 mt-1.5">{item.processing_step}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Errors */}
      {queueStatus?.recent_errors && queueStatus.recent_errors.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              Errores recientes
            </h2>
            {errors > 0 && (
              <button
                onClick={() => reprocessBatchMutation.mutate('error')}
                disabled={reprocessBatchMutation.isPending}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={reprocessBatchMutation.isPending ? 'animate-spin' : ''} />
                Re-procesar todos
              </button>
            )}
          </div>
          <div className="space-y-1">
            {queueStatus.recent_errors.map((item: { id: number; title?: string; filename: string; error_message?: string }) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-red-500/[0.06] rounded-lg border border-red-500/10">
                <XCircle size={14} className="text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.title || item.filename}</p>
                  <p className="text-xs text-red-400/70">{item.error_message || 'Error desconocido'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      {(pending > 0 || errors > 0) && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Acciones</h2>
          <div className="flex flex-wrap gap-2">
            {errors > 0 && (
              <button
                onClick={() => reprocessBatchMutation.mutate('error')}
                disabled={reprocessBatchMutation.isPending}
                className="text-sm bg-dark-card/50 text-gray-300 hover:text-white hover:bg-dark-card px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} />
                Re-procesar errores ({errors})
              </button>
            )}
            {pending > 0 && (
              <button
                onClick={() => reprocessBatchMutation.mutate('pending')}
                disabled={reprocessBatchMutation.isPending}
                className="text-sm bg-dark-card/50 text-gray-300 hover:text-white hover:bg-dark-card px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Clock size={14} />
                Procesar pendientes ({pending})
              </button>
            )}
          </div>
        </section>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div className="text-center py-16">
          <CheckCircle size={40} className="mx-auto text-gray-800 mb-3" />
          <p className="text-gray-500 text-sm">No hay archivos en la cola</p>
        </div>
      )}
    </div>
  )
}
