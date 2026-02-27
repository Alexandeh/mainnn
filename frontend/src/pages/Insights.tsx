import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Sparkles, Lightbulb, Target, TrendingUp, Video, Image, RefreshCw,
  CheckCircle2, Zap, Award, BarChart2, Clock, Calendar, Brain,
  Rocket, AlertTriangle, ChevronRight, Star, Activity,
} from 'lucide-react'
import { getAIInsights } from '../lib/api'

interface PatternAnalysis {
  category: string
  insight: string
  confidence: number
  examples: string[]
  recommendation: string
}

interface AIInsights {
  generated_at: string
  channel_summary: string
  top_patterns: PatternAnalysis[]
  title_patterns: string[]
  thumbnail_recommendations: string[]
  content_recommendations: string[]
  next_video_suggestions: string[]
}

// ── helpers ──────────────────────────────────────────────────────────────────

function parseMetricFromSummary(summary: string, keywords: string[]): number | null {
  for (const kw of keywords) {
    const re = new RegExp(`${kw}[^\\d]*(\\d+(?:\\.\\d+)?)`, 'i')
    const m = summary.match(re)
    if (m) return parseFloat(m[1])
  }
  return null
}

function deriveHealthScore(insights: AIInsights): {
  total: number
  retention: number
  ctr: number
  engagement: number
  growth: number
} {
  const s = insights.channel_summary

  const retentionRaw = parseMetricFromSummary(s, ['retención', 'retention', 'watched'])
  const ctrRaw = parseMetricFromSummary(s, ['ctr', 'click-through', 'clicks'])
  const engagementRaw = parseMetricFromSummary(s, ['engagement', 'likes', 'likes rate'])
  const growthRaw = parseMetricFromSummary(s, ['subs', 'subscribers', 'crecimiento', 'growth'])

  // Normalise to 0-100 with sensible ceilings for the niche
  const retention = retentionRaw !== null ? Math.min((retentionRaw / 50) * 100, 100) : 55
  const ctr = ctrRaw !== null ? Math.min((ctrRaw / 10) * 100, 100) : 50
  const engagement = engagementRaw !== null ? Math.min((engagementRaw / 5) * 100, 100) : 45
  const growth = growthRaw !== null ? Math.min((growthRaw / 20) * 100, 100) : 40

  const highConfidence = insights.top_patterns.filter(p => p.confidence >= 0.75).length
  const patternBonus = Math.min(highConfidence * 4, 20)

  const total = Math.round(
    retention * 0.3 + ctr * 0.3 + engagement * 0.2 + growth * 0.2 + patternBonus * 0
  ) + patternBonus

  return {
    total: Math.min(total, 100),
    retention: Math.round(retention),
    ctr: Math.round(ctr),
    engagement: Math.round(engagement),
    growth: Math.round(growth),
  }
}

function scoreLabel(total: number) {
  if (total >= 80) return { icon: '🚀', text: 'Canal en excelente estado', color: 'text-green-400', bar: 'bg-green-500' }
  if (total >= 60) return { icon: '📈', text: 'Canal en crecimiento — hay margen de mejora', color: 'text-blue-400', bar: 'bg-blue-500' }
  if (total >= 40) return { icon: '⚠️', text: 'Canal con potencial — necesita optimización', color: 'text-yellow-400', bar: 'bg-yellow-500' }
  return { icon: '🔴', text: 'Canal necesita atención — revisa la estrategia', color: 'text-red-400', bar: 'bg-red-500' }
}

function confidenceBadgeColor(c: number) {
  if (c >= 0.8) return 'bg-green-500/15 text-green-300 border-green-500/30'
  if (c >= 0.6) return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
  return 'bg-gray-700 text-gray-400 border-gray-600'
}

function patternIcon(category: string) {
  const c = category.toLowerCase()
  if (c.includes('title') || c.includes('título')) return <Target size={20} className="text-purple-400" />
  if (c.includes('thumb')) return <Image size={20} className="text-pink-400" />
  if (c.includes('dur') || c.includes('length')) return <Clock size={20} className="text-blue-400" />
  if (c.includes('engag') || c.includes('inter')) return <Activity size={20} className="text-green-400" />
  if (c.includes('trend') || c.includes('crec')) return <TrendingUp size={20} className="text-orange-400" />
  return <Brain size={20} className="text-indigo-400" />
}

function deriveActionables(insights: AIInsights) {
  const items: { icon: string; title: string; desc: string; priority: 'Alta' | 'Media' | 'Baja' }[] = []

  // Pull from patterns
  insights.top_patterns.slice(0, 2).forEach(p => {
    items.push({
      icon: '🎯',
      title: `Aplica patrón: ${p.category}`,
      desc: p.recommendation,
      priority: p.confidence >= 0.75 ? 'Alta' : 'Media',
    })
  })

  // Pull from content recs
  if (insights.content_recommendations.length > 0) {
    items.push({
      icon: '🎬',
      title: 'Optimiza tu próxima compilación',
      desc: insights.content_recommendations[0],
      priority: 'Alta',
    })
  }

  // Thumbnail
  if (insights.thumbnail_recommendations.length > 0) {
    items.push({
      icon: '🖼️',
      title: 'Mejora el thumbnail de tu último video',
      desc: insights.thumbnail_recommendations[0],
      priority: 'Media',
    })
  }

  // Next video
  if (insights.next_video_suggestions.length > 0) {
    items.push({
      icon: '💡',
      title: 'Idea de video accionable',
      desc: insights.next_video_suggestions[0],
      priority: 'Baja',
    })
  }

  return items.slice(0, 3)
}

// ── sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ value, colorClass, label }: { value: number; colorClass: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="font-medium text-white">{value}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: 'Alta' | 'Media' | 'Baja' }) {
  const map = {
    Alta: 'bg-red-500/15 text-red-300 border border-red-500/30',
    Media: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
    Baja: 'bg-green-500/15 text-green-300 border border-green-500/30',
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${map[priority]}`}>
      {priority}
    </span>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export function Insights() {
  const [showAllPatterns, setShowAllPatterns] = useState(false)

  const { data: insights, isLoading, refetch, isFetching } = useQuery<AIInsights>({
    queryKey: ['insights'],
    queryFn: () => getAIInsights(50, true),
    staleTime: 1000 * 60 * 30,
  })

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={24} />
            Insights & Auto-mejora
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Análisis inteligente del canal @AIrtVids — compilaciones de IA generativa
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

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400">Analizando patrones del canal...</p>
          </div>
        </div>
      ) : insights ? (
        <div className="space-y-8">

          {/* ══════════════════════════════════════════════════════════════════
              1. HEALTH SCORE
          ══════════════════════════════════════════════════════════════════ */}
          {(() => {
            const scores = deriveHealthScore(insights)
            const label = scoreLabel(scores.total)
            return (
              <section className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900 border border-gray-700/60 p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-yellow-400" />
                  <h3 className="font-semibold text-white text-base tracking-tight">Health Score del Canal</h3>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8">
                  {/* Big circle score */}
                  <div className="relative flex-shrink-0 flex items-center justify-center w-32 h-32">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#374151" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke={scores.total >= 80 ? '#22c55e' : scores.total >= 60 ? '#3b82f6' : scores.total >= 40 ? '#eab308' : '#ef4444'}
                        strokeWidth="10"
                        strokeDasharray={`${(scores.total / 100) * 326.7} 326.7`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${label.color}`}>{scores.total}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">/ 100</span>
                    </div>
                  </div>

                  {/* Sub-scores */}
                  <div className="flex-1 w-full space-y-3">
                    <p className={`text-sm font-medium ${label.color} mb-4`}>
                      {label.icon} {label.text}
                    </p>
                    <ProgressBar value={scores.retention} colorClass="bg-blue-500" label="Retención" />
                    <ProgressBar value={scores.ctr} colorClass="bg-purple-500" label="CTR" />
                    <ProgressBar value={scores.engagement} colorClass="bg-pink-500" label="Engagement" />
                    <ProgressBar value={scores.growth} colorClass="bg-green-500" label="Crecimiento de subs" />
                  </div>
                </div>

                <p className="text-[11px] text-gray-500">
                  Score calculado con base en patrones detectados en tu canal. Las métricas exactas mejoran con más datos.
                </p>
              </section>
            )
          })()}

          {/* ══════════════════════════════════════════════════════════════════
              2. RESUMEN DEL CANAL
          ══════════════════════════════════════════════════════════════════ */}
          <section className="rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-6">
            <h3 className="font-semibold text-yellow-300 mb-3 flex items-center gap-2">
              <Sparkles size={16} />
              Resumen del canal
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">{insights.channel_summary}</p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Tipo de contenido', value: 'Compilaciones IA', icon: <Video size={14} className="text-yellow-400" /> },
                { label: 'Nicho', value: 'IA Generativa', icon: <Brain size={14} className="text-purple-400" /> },
                { label: 'Patrones detectados', value: `${insights.top_patterns.length}`, icon: <BarChart2 size={14} className="text-blue-400" /> },
                { label: 'Ideas de videos', value: `${insights.next_video_suggestions.length}`, icon: <Lightbulb size={14} className="text-green-400" /> },
              ].map((m, i) => (
                <div key={i} className="bg-black/20 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">{m.icon}<span className="text-[10px] text-gray-500 uppercase tracking-wider">{m.label}</span></div>
                  <p className="text-sm font-semibold text-white">{m.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Generado: {new Date(insights.generated_at).toLocaleString('es')}
            </p>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              3. ANÁLISIS ESPECÍFICO PARA COMPILACIONES DE IA
          ══════════════════════════════════════════════════════════════════ */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-indigo-400" />
              <h3 className="font-semibold text-white text-base tracking-tight">Análisis específico para compilaciones de IA</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* 3a — Mejor momento para publicar */}
              <div className="rounded-2xl bg-gray-800/60 border border-gray-700/50 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-400" />
                  <h4 className="text-sm font-semibold text-white">Mejor momento para publicar</h4>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => {
                    const hot = i === 1 || i === 2 || i === 3
                    const warm = i === 0 || i === 4
                    return (
                      <div
                        key={i}
                        className={`rounded-md py-2 text-[11px] font-bold ${
                          hot ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' :
                          warm ? 'bg-blue-500/10 text-blue-500/60 border border-blue-500/20' :
                          'bg-gray-700/40 text-gray-600 border border-gray-700/30'
                        }`}
                      >
                        {d}
                      </div>
                    )
                  })}
                </div>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 rounded-sm bg-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-blue-300">Mar–Jue:</strong> audiencia tech activa, mayor CTR</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 rounded-sm bg-gray-600 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-gray-400">Sáb–Dom:</strong> menor engagement para contenido educativo/tech</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 italic">
                  Mapa de calor detallado disponible con 30+ videos publicados
                </p>
              </div>

              {/* 3b — Herramientas de IA */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/25 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-indigo-400" />
                  <h4 className="text-sm font-semibold text-white">Herramientas de IA más populares</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Sora', 'Kling', 'Runway', 'Pika', 'Midjourney', 'Luma', 'Stable Video'].map(tool => (
                    <span key={tool} className="text-[11px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 px-2.5 py-1 rounded-full font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                  <p className="text-xs text-indigo-200 font-medium mb-1">💡 Acción sugerida</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Añade el nombre de la herramienta (ej: "Sora", "Kling") en el <strong className="text-white">título y descripción</strong> de cada compilación para trackear qué IA genera más interés en tu audiencia.
                  </p>
                </div>
                <div className="text-[10px] text-gray-600">
                  El tracking por herramienta te permitirá saber qué IA impulsa más views y subs nuevos.
                </div>
              </div>

              {/* 3c — Compilación vs Dedicado */}
              <div className="rounded-2xl bg-gray-800/60 border border-gray-700/50 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart2 size={16} className="text-green-400" />
                  <h4 className="text-sm font-semibold text-white">Formato: Compilación vs. Dedicado</h4>
                </div>
                <div className="space-y-3">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Video size={13} className="text-green-400" />
                      <p className="text-xs font-bold text-green-300">Videos compilación</p>
                    </div>
                    <ul className="space-y-1 text-[11px] text-gray-400">
                      <li className="flex items-start gap-1.5"><ChevronRight size={10} className="mt-0.5 text-green-500 flex-shrink-0" />Mayor volumen de clips → más tiempo visto</li>
                      <li className="flex items-start gap-1.5"><ChevronRight size={10} className="mt-0.5 text-green-500 flex-shrink-0" />Algoritmo favorece retención alta por variedad</li>
                      <li className="flex items-start gap-1.5"><ChevronRight size={10} className="mt-0.5 text-green-500 flex-shrink-0" />Fácil de producir frecuentemente (consistencia)</li>
                    </ul>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Star size={13} className="text-purple-400" />
                      <p className="text-xs font-bold text-purple-300">Videos dedicados (reviews)</p>
                    </div>
                    <ul className="space-y-1 text-[11px] text-gray-400">
                      <li className="flex items-start gap-1.5"><ChevronRight size={10} className="mt-0.5 text-purple-500 flex-shrink-0" />Posicionan como autoridad en la herramienta</li>
                      <li className="flex items-start gap-1.5"><ChevronRight size={10} className="mt-0.5 text-purple-500 flex-shrink-0" />Mejor para búsquedas long-tail (SEO)</li>
                      <li className="flex items-start gap-1.5"><ChevronRight size={10} className="mt-0.5 text-purple-500 flex-shrink-0" />Mayor potencial de monetización directa</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              4. ACCIONABLES DE ESTA SEMANA
          ══════════════════════════════════════════════════════════════════ */}
          {(() => {
            const actionables = deriveActionables(insights)
            return (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Rocket size={18} className="text-orange-400" />
                  <h3 className="font-semibold text-white text-base tracking-tight">Accionables de esta semana</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {actionables.map((a, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-gray-800/60 border border-gray-700/50 p-5 flex flex-col gap-3 hover:border-gray-600/70 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-3xl leading-none">{a.icon}</span>
                        <PriorityBadge priority={a.priority} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">{a.title}</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{a.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })()}

          {/* ══════════════════════════════════════════════════════════════════
              5. PATRONES DETECTADOS
          ══════════════════════════════════════════════════════════════════ */}
          {insights.top_patterns.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-blue-400" />
                  <h3 className="font-semibold text-white text-base tracking-tight">Patrones detectados</h3>
                </div>
                {insights.top_patterns.length > 4 && (
                  <button
                    onClick={() => setShowAllPatterns(v => !v)}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {showAllPatterns ? 'Ver menos' : `Ver todos (${insights.top_patterns.length})`}
                    <ChevronRight size={12} className={`transition-transform ${showAllPatterns ? 'rotate-90' : ''}`} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(showAllPatterns ? insights.top_patterns : insights.top_patterns.slice(0, 4)).map((pattern, i) => (
                  <div key={i} className="rounded-2xl bg-gray-800/60 border border-gray-700/50 p-5 space-y-3 hover:border-gray-600/70 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-700/60 flex items-center justify-center flex-shrink-0">
                          {patternIcon(pattern.category)}
                        </div>
                        <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                          {pattern.category}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${confidenceBadgeColor(pattern.confidence)}`}>
                        {(pattern.confidence * 100).toFixed(0)}% confianza
                      </span>
                    </div>

                    {/* Confidence bar */}
                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pattern.confidence >= 0.8 ? 'bg-green-500' : pattern.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-gray-500'}`}
                        style={{ width: `${pattern.confidence * 100}%` }}
                      />
                    </div>

                    <p className="text-sm text-gray-300 leading-relaxed">{pattern.insight}</p>

                    {pattern.examples.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Ejemplos</p>
                        {pattern.examples.slice(0, 2).map((ex, j) => (
                          <p key={j} className="text-xs text-gray-400 pl-3 border-l-2 border-gray-600">
                            {ex}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <p className="text-xs text-green-300 leading-relaxed">
                        <strong>→ Acción:</strong> {pattern.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              6. PATRONES EN TÍTULOS
          ══════════════════════════════════════════════════════════════════ */}
          {insights.title_patterns.length > 0 && (
            <section className="rounded-2xl bg-gray-800/60 border border-gray-700/50 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-purple-400" />
                <h3 className="font-semibold text-white text-base tracking-tight">Patrones en títulos</h3>
              </div>
              <div className="space-y-2.5">
                {insights.title_patterns.map((pattern, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 size={11} className="text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{pattern}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              7. RECOMENDACIONES Y PRÓXIMOS VIDEOS
          ══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Thumbnails */}
            {insights.thumbnail_recommendations.length > 0 && (
              <div className="rounded-2xl bg-gray-800/60 border border-gray-700/50 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Image size={16} className="text-pink-400" />
                  <h3 className="text-sm font-semibold text-white">Thumbnails</h3>
                </div>
                <div className="space-y-3">
                  {insights.thumbnail_recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-pink-400">{i + 1}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contenido */}
            {insights.content_recommendations.length > 0 && (
              <div className="rounded-2xl bg-gray-800/60 border border-gray-700/50 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-yellow-400" />
                  <h3 className="text-sm font-semibold text-white">Contenido</h3>
                </div>
                <div className="space-y-3">
                  {insights.content_recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-yellow-400">{i + 1}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Próximos videos */}
            {insights.next_video_suggestions.length > 0 && (
              <div className="rounded-2xl bg-gray-800/60 border border-gray-700/50 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-400" />
                  <h3 className="text-sm font-semibold text-white">Ideas para el próximo video</h3>
                </div>
                <div className="space-y-3">
                  {insights.next_video_suggestions.map((sug, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-green-400">{i + 1}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{sug}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
          <AlertTriangle size={40} className="text-yellow-500/60" />
          <p className="text-gray-400 text-sm">No se pudieron generar insights.</p>
          <p className="text-gray-600 text-xs max-w-sm">
            Asegúrate de tener videos con datos de rendimiento. Los insights mejoran cuantos más videos tenga el canal.
          </p>
        </div>
      )}
    </div>
  )
}
