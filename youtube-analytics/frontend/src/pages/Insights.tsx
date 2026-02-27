import { useQuery } from '@tanstack/react-query'
import { Sparkles, Lightbulb, Target, TrendingUp, Video, Image, RefreshCw, CheckCircle2 } from 'lucide-react'
import { getAIInsights } from '../lib/api'

export function Insights() {
  const { data: insights, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['insights'],
    queryFn: () => getAIInsights(50, true),
    staleTime: 1000 * 60 * 30,
  })

  const confidenceColor = (c: number) => {
    if (c >= 0.8) return 'text-green-400'
    if (c >= 0.6) return 'text-yellow-400'
    return 'text-gray-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={24} />
            Insights & Auto-mejora
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Análisis inteligente de patrones en tu canal para saber por qué triunfan tus mejores videos
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          Regenerar
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400">Analizando patrones de tu canal...</p>
          </div>
        </div>
      ) : insights ? (
        <div className="space-y-6">
          {/* Channel summary */}
          <div className="rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-5">
            <h3 className="font-semibold text-yellow-300 mb-2 flex items-center gap-2">
              <Sparkles size={16} />
              Resumen del canal
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">{insights.channel_summary}</p>
            <p className="text-xs text-gray-500 mt-3">
              Generado: {new Date(insights.generated_at).toLocaleString('es')}
            </p>
          </div>

          {/* Pattern cards */}
          {insights.top_patterns.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                Patrones detectados
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {insights.top_patterns.map((pattern, i) => (
                  <div key={i} className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-400/10 px-2 py-1 rounded">
                        {pattern.category}
                      </span>
                      <span className={`text-xs font-medium ${confidenceColor(pattern.confidence)}`}>
                        {(pattern.confidence * 100).toFixed(0)}% confianza
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{pattern.insight}</p>
                    {pattern.examples.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 font-medium">Ejemplos:</p>
                        {pattern.examples.slice(0, 2).map((ex, j) => (
                          <p key={j} className="text-xs text-gray-400 pl-2 border-l-2 border-gray-600">
                            {ex}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-xs text-green-300">
                        <strong>Acción:</strong> {pattern.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Title patterns */}
          {insights.title_patterns.length > 0 && (
            <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Target size={16} className="text-purple-400" />
                Patrones en títulos
              </h3>
              <div className="space-y-2">
                {insights.title_patterns.map((pattern, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300">{pattern}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Thumbnail recommendations */}
            <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Image size={16} className="text-pink-400" />
                Thumbnails
              </h3>
              <div className="space-y-3">
                {insights.thumbnail_recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-pink-400 text-xs font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <p className="text-xs text-gray-300">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Content recommendations */}
            <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Lightbulb size={16} className="text-yellow-400" />
                Contenido
              </h3>
              <div className="space-y-3">
                {insights.content_recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-yellow-400 text-xs font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <p className="text-xs text-gray-300">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next video ideas */}
            <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Video size={16} className="text-green-400" />
                Ideas para el próximo video
              </h3>
              <div className="space-y-3">
                {insights.next_video_suggestions.map((sug, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-green-400 text-xs font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <p className="text-xs text-gray-300">{sug}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No se pudieron generar insights. Asegúrate de tener videos con datos.
        </div>
      )}
    </div>
  )
}
