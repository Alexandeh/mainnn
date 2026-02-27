import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Trophy, Target, TrendingUp, Zap, Info, ChevronUp, ChevronDown, BarChart2, Users, Eye,
} from 'lucide-react'
import { getVideoMetrics } from '../lib/api'
import { MetricsScatterChart } from '../components/MetricsScatterChart'
import { formatNumber, formatDate } from '../lib/utils'
import type { VideoMetrics } from '../types'

interface ComparisonProps {
  onSelectVideo: (id: string) => void
}

type SortKey =
  | 'rank'
  | 'title'
  | 'published_at'
  | 'views'
  | 'ctr'
  | 'average_view_percentage'
  | 'engagement_rate'
  | 'net_subscribers'
  | 'performance_score'

type SortDir = 'asc' | 'desc'

const BAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#84CC16',
]

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: string
  subtitle: string
  accentClass: string
}

function KPICard({ icon, label, value, subtitle, accentClass }: KPICardProps) {
  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={accentClass}>{icon}</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accentClass}`}>{value}</p>
      <p className="text-xs text-gray-500 truncate" title={subtitle}>{subtitle}</p>
    </div>
  )
}

// ─── No-data panel ────────────────────────────────────────────────────────────
function NoDataPanel({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
      <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center flex-shrink-0">
        <Info size={20} className="text-blue-400" />
      </div>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">{message}</p>
    </div>
  )
}

// ─── Performance score badge ──────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const s = Math.round(score)
  const colorClass =
    s >= 70
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : s >= 40
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
      {s}
    </span>
  )
}

// ─── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey
  sortKey: SortKey
  sortDir: SortDir
}) {
  if (col !== sortKey)
    return <ChevronDown size={12} className="text-gray-600 opacity-50" />
  return sortDir === 'asc' ? (
    <ChevronUp size={12} className="text-red-400" />
  ) : (
    <ChevronDown size={12} className="text-red-400" />
  )
}

// ─── Custom bar tooltip ───────────────────────────────────────────────────────
function BarTooltip({ active, payload, onSelectVideo }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const val: number = payload[0].value
  const formatted =
    typeof val === 'number' && val % 1 !== 0
      ? `${val.toFixed(2)}%`
      : formatNumber(val)
  return (
    <div
      className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs max-w-xs cursor-pointer"
      onClick={() => onSelectVideo(d.id)}
    >
      <p className="text-white font-medium mb-1 line-clamp-2">{d.name}</p>
      <p className="text-red-400">
        {payload[0].name}: {formatted}
      </p>
      <p className="text-gray-500 mt-1">Click para ver detalle</p>
    </div>
  )
}

// ─── Horizontal bar chart section ─────────────────────────────────────────────
interface RankingBarProps {
  title: string
  icon: React.ReactNode
  data: { name: string; value: number; id: string }[]
  valueFormatter: (v: number) => string
  noDataMessage?: string
  onSelectVideo: (id: string) => void
}

function RankingBar({
  title,
  icon,
  data,
  valueFormatter,
  noDataMessage,
  onSelectVideo,
}: RankingBarProps) {
  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {noDataMessage || data.length < 3 ? (
        <NoDataPanel
          message={
            noDataMessage ||
            'No hay suficientes datos para mostrar este ranking.'
          }
        />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data.map((d, i) => ({ ...d, fill: BAR_COLORS[i % BAR_COLORS.length] }))}
            layout="vertical"
            margin={{ top: 0, right: 50, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              tickLine={false}
              tickFormatter={valueFormatter}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 9 }}
              width={110}
            />
            <Tooltip content={<BarTooltip onSelectVideo={onSelectVideo} />} />
            <Bar dataKey="value" name={title} radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Insights panel ───────────────────────────────────────────────────────────
interface InsightCardProps {
  icon: React.ReactNode
  title: string
  body: string
  accentClass: string
}

function InsightCard({ icon, title, body, accentClass }: InsightCardProps) {
  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-4 flex gap-3">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accentClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
        <p className="text-xs text-gray-400 leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Comparison({ onSelectVideo }: ComparisonProps) {
  const [sortKey, setSortKey] = useState<SortKey>('performance_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => getVideoMetrics(50),
    staleTime: 1000 * 60 * 15,
  })

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const videosWithCTR = metrics.filter((v) => v.ctr > 0)
  const videosWithRetention = metrics.filter((v) => v.average_view_percentage > 0)
  const hasCTR = videosWithCTR.length >= 3

  const avgCTR =
    videosWithCTR.length > 0
      ? videosWithCTR.reduce((s, v) => s + v.ctr, 0) / videosWithCTR.length
      : null

  const avgRetention =
    videosWithRetention.length > 0
      ? videosWithRetention.reduce((s, v) => s + v.average_view_percentage, 0) /
        videosWithRetention.length
      : null

  const avgEngagement =
    metrics.filter((v) => v.engagement_rate > 0).length > 0
      ? metrics
          .filter((v) => v.engagement_rate > 0)
          .reduce((s, v) => s + v.engagement_rate, 0) /
        metrics.filter((v) => v.engagement_rate > 0).length
      : null

  // ── Rankings ───────────────────────────────────────────────────────────────
  const truncName = (s: string, n = 28) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

  const top10Views = [...metrics]
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
    .map((v) => ({ name: truncName(v.title), value: v.views, id: v.video_id }))

  const top10CTR = videosWithCTR
    .sort((a, b) => b.ctr - a.ctr)
    .slice(0, 10)
    .map((v) => ({ name: truncName(v.title), value: v.ctr, id: v.video_id }))

  const top10Retention = videosWithRetention
    .sort((a, b) => b.average_view_percentage - a.average_view_percentage)
    .slice(0, 10)
    .map((v) => ({
      name: truncName(v.title),
      value: v.average_view_percentage,
      id: v.video_id,
    }))

  // ── Table sort ─────────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const rankedIds = [...metrics]
    .sort((a, b) => b.performance_score - a.performance_score)
    .map((v, i) => [v.video_id, i + 1] as [string, number])
  const rankMap = Object.fromEntries(rankedIds)

  const sortedMetrics = [...metrics].sort((a, b) => {
    let aVal: number | string
    let bVal: number | string
    if (sortKey === 'rank') {
      aVal = rankMap[a.video_id]
      bVal = rankMap[b.video_id]
    } else if (sortKey === 'title') {
      aVal = a.title.toLowerCase()
      bVal = b.title.toLowerCase()
    } else {
      aVal = a[sortKey] as number
      bVal = b[sortKey] as number
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  // ── Pattern insights ───────────────────────────────────────────────────────
  const withNumbers = metrics.filter((v) => /\d/.test(v.title))
  const withoutNumbers = metrics.filter((v) => !/\d/.test(v.title))

  const avgCTRNumbers =
    withNumbers.filter((v) => v.ctr > 0).length > 0
      ? withNumbers.filter((v) => v.ctr > 0).reduce((s, v) => s + v.ctr, 0) /
        withNumbers.filter((v) => v.ctr > 0).length
      : null
  const avgCTRNoNumbers =
    withoutNumbers.filter((v) => v.ctr > 0).length > 0
      ? withoutNumbers.filter((v) => v.ctr > 0).reduce((s, v) => s + v.ctr, 0) /
        withoutNumbers.filter((v) => v.ctr > 0).length
      : null

  const sorted = [...metrics].sort((a, b) => b.performance_score - a.performance_score)
  const top5 = sorted.slice(0, 5)
  const bottom5 = sorted.slice(-5)

  const avgDurationTop5 =
    top5.length > 0
      ? top5.reduce((s, v) => s + v.average_view_duration_seconds, 0) / top5.length
      : 0
  const avgDurationBottom5 =
    bottom5.length > 0
      ? bottom5.reduce((s, v) => s + v.average_view_duration_seconds, 0) / bottom5.length
      : 0

  const fmtSecs = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}m ${sec}s`
  }

  // ── Column headers config ──────────────────────────────────────────────────
  const columns: { key: SortKey; label: string }[] = [
    { key: 'rank', label: '#' },
    { key: 'title', label: 'Título' },
    { key: 'published_at', label: 'Fecha' },
    { key: 'views', label: 'Views' },
    { key: 'ctr', label: 'CTR' },
    { key: 'average_view_percentage', label: 'Retención' },
    { key: 'engagement_rate', label: 'Engagement' },
    { key: 'net_subscribers', label: 'Subs netos' },
    { key: 'performance_score', label: 'Score' },
  ]

  const thClass =
    'px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap'
  const tdClass = 'px-3 py-2.5 text-sm'

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-bold text-white">Comparación de Videos</h2>
        <p className="text-gray-400 text-sm mt-1">
          Análisis comparativo de {metrics.length} videos — identifica qué funciona mejor
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<BarChart2 size={16} />}
          label="Total analizados"
          value={String(metrics.length)}
          subtitle={`${metrics.length} videos en el análisis`}
          accentClass="text-blue-400"
        />
        <KPICard
          icon={<Target size={16} />}
          label="CTR promedio"
          value={avgCTR !== null ? `${avgCTR.toFixed(2)}%` : 'Sin datos de CTR'}
          subtitle={
            avgCTR !== null
              ? `Basado en ${videosWithCTR.length} videos con CTR`
              : 'YouTube tarda días en reportar esta métrica'
          }
          accentClass="text-yellow-400"
        />
        <KPICard
          icon={<Zap size={16} />}
          label="Retención promedio"
          value={avgRetention !== null ? `${avgRetention.toFixed(1)}%` : 'N/A'}
          subtitle={
            avgRetention !== null
              ? `Basado en ${videosWithRetention.length} videos con retención`
              : 'Sin datos de retención'
          }
          accentClass="text-green-400"
        />
        <KPICard
          icon={<TrendingUp size={16} />}
          label="Engagement promedio"
          value={avgEngagement !== null ? `${avgEngagement.toFixed(2)}%` : 'N/A'}
          subtitle={
            avgEngagement !== null
              ? `Likes + comentarios + shares / views`
              : 'Sin datos de engagement'
          }
          accentClass="text-red-400"
        />
      </div>

      {/* ── Scatter Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CTR vs Retención */}
        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            <Target size={16} className="text-yellow-400" />
            CTR vs Retención
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Cuadrante superior derecho = videos más optimizados
          </p>
          {!hasCTR ? (
            <NoDataPanel message="Los datos de CTR aún no están disponibles para suficientes videos. YouTube tarda algunos días en reportar esta métrica." />
          ) : (
            <MetricsScatterChart
              videos={metrics}
              xKey="ctr"
              yKey="average_view_percentage"
              xLabel="CTR (%)"
              yLabel="Retención (%)"
            />
          )}
        </div>

        {/* Views vs Engagement */}
        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            <Eye size={16} className="text-blue-400" />
            Views vs Engagement
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            El tamaño del punto indica views. Las líneas muestran la media.
          </p>
          <MetricsScatterChart
            videos={metrics}
            xKey="views"
            yKey="engagement_rate"
            xLabel="Views"
            yLabel="Engagement (%)"
          />
        </div>
      </div>

      {/* ── Bar Rankings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RankingBar
          title="Top 10 por Views"
          icon={<Trophy size={16} className="text-yellow-400" />}
          data={top10Views}
          valueFormatter={formatNumber}
          onSelectVideo={onSelectVideo}
        />
        <RankingBar
          title="Top 10 por CTR"
          icon={<Target size={16} className="text-yellow-400" />}
          data={top10CTR}
          valueFormatter={(v) => `${v.toFixed(1)}%`}
          noDataMessage={
            !hasCTR
              ? 'CTR no disponible aún. YouTube tarda algunos días en reportar esta métrica.'
              : undefined
          }
          onSelectVideo={onSelectVideo}
        />
        <RankingBar
          title="Top 10 por Retención"
          icon={<Zap size={16} className="text-green-400" />}
          data={top10Retention}
          valueFormatter={(v) => `${v.toFixed(1)}%`}
          noDataMessage={
            videosWithRetention.length < 3
              ? 'Datos de retención no disponibles para suficientes videos aún.'
              : undefined
          }
          onSelectVideo={onSelectVideo}
        />
      </div>

      {/* ── Full Data Table ── */}
      <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 overflow-hidden">
        <div className="p-5 border-b border-gray-700/50 flex items-center gap-3">
          <Users size={18} className="text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-white">Tabla completa de videos</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Click en columna para ordenar · Click en fila para ver detalle
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-900">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={thClass}
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedMetrics.map((v, i) => (
                  <tr
                    key={v.video_id}
                    onClick={() => onSelectVideo(v.video_id)}
                    className={`cursor-pointer border-b border-gray-700/30 transition-colors hover:bg-red-900/10 ${
                      i % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-900/20'
                    }`}
                  >
                    {/* Rank */}
                    <td className={`${tdClass} w-10 text-gray-500 font-mono text-xs`}>
                      #{rankMap[v.video_id]}
                    </td>

                    {/* Thumbnail + Title */}
                    <td className={`${tdClass} max-w-xs`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {v.thumbnail_url ? (
                          <img
                            src={v.thumbnail_url}
                            alt=""
                            className="w-10 h-7 object-cover rounded flex-shrink-0 bg-gray-700"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-7 rounded bg-gray-700 flex-shrink-0" />
                        )}
                        <span
                          className="text-white text-xs line-clamp-2 hover:text-red-300 transition-colors"
                          title={v.title}
                        >
                          {v.title}
                        </span>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className={`${tdClass} text-gray-400 text-xs whitespace-nowrap`}>
                      {v.published_at ? formatDate(v.published_at) : '—'}
                    </td>

                    {/* Views */}
                    <td className={`${tdClass} text-blue-300 font-medium whitespace-nowrap`}>
                      {formatNumber(v.views)}
                    </td>

                    {/* CTR */}
                    <td className={`${tdClass} font-medium whitespace-nowrap`}>
                      {v.ctr > 0 ? (
                        <span
                          className={
                            v.ctr >= 5
                              ? 'text-green-400'
                              : v.ctr >= 3
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }
                        >
                          {v.ctr.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>

                    {/* Retención */}
                    <td className={`${tdClass} font-medium whitespace-nowrap`}>
                      {v.average_view_percentage > 0 ? (
                        <span
                          className={
                            v.average_view_percentage >= 50
                              ? 'text-green-400'
                              : v.average_view_percentage >= 35
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }
                        >
                          {v.average_view_percentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>

                    {/* Engagement */}
                    <td className={`${tdClass} whitespace-nowrap`}>
                      {v.engagement_rate > 0 ? (
                        <span className="text-purple-300">{v.engagement_rate.toFixed(2)}%</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>

                    {/* Subs netos */}
                    <td className={`${tdClass} font-medium whitespace-nowrap`}>
                      {v.net_subscribers !== 0 ? (
                        <span
                          className={v.net_subscribers > 0 ? 'text-green-400' : 'text-red-400'}
                        >
                          {v.net_subscribers > 0 ? '+' : ''}
                          {v.net_subscribers}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>

                    {/* Score */}
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <ScoreBadge score={v.performance_score} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Patrones detectados ── */}
      <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-red-400" />
          Patrones detectados
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Números en títulos vs CTR */}
          {avgCTRNumbers !== null && avgCTRNoNumbers !== null ? (
            <InsightCard
              icon={<Target size={16} className="text-yellow-300" />}
              accentClass="bg-yellow-500/10"
              title="Números en títulos"
              body={
                avgCTRNumbers > avgCTRNoNumbers
                  ? `Los títulos con números tienen CTR ${(avgCTRNumbers - avgCTRNoNumbers).toFixed(2)}pp mayor (${avgCTRNumbers.toFixed(2)}% vs ${avgCTRNoNumbers.toFixed(2)}%).`
                  : `Los títulos sin números tienen CTR ${(avgCTRNoNumbers - avgCTRNumbers).toFixed(2)}pp mayor (${avgCTRNoNumbers.toFixed(2)}% vs ${avgCTRNumbers.toFixed(2)}%).`
              }
            />
          ) : (
            <InsightCard
              icon={<Target size={16} className="text-yellow-300" />}
              accentClass="bg-yellow-500/10"
              title="Números en títulos"
              body="Datos de CTR insuficientes para comparar el impacto de números en títulos."
            />
          )}

          {/* Duración top 5 vs bottom 5 */}
          <InsightCard
            icon={<Zap size={16} className="text-green-300" />}
            accentClass="bg-green-500/10"
            title="Duración media vista"
            body={
              avgDurationTop5 > 0 && avgDurationBottom5 > 0
                ? `Top 5: ${fmtSecs(avgDurationTop5)} · Bottom 5: ${fmtSecs(avgDurationBottom5)}. Los mejores tienen ${Math.abs(avgDurationTop5 - avgDurationBottom5 / 60).toFixed(1)}m más de retención.`
                : 'No hay suficientes datos de duración para comparar top y bottom performers.'
            }
          />

          {/* Videos con CTR disponible */}
          <InsightCard
            icon={<Info size={16} className="text-blue-300" />}
            accentClass="bg-blue-500/10"
            title="Cobertura de CTR"
            body={`${videosWithCTR.length} de ${metrics.length} videos tienen datos de CTR (${Math.round((videosWithCTR.length / metrics.length) * 100)}%). YouTube puede tardar hasta 48h por video reciente.`}
          />

          {/* Engagement promedio top vs general */}
          {top5.length > 0 && (
            <InsightCard
              icon={<Users size={16} className="text-red-300" />}
              accentClass="bg-red-500/10"
              title="Engagement top 5"
              body={(() => {
                const topEng =
                  top5.filter((v) => v.engagement_rate > 0).reduce((s, v) => s + v.engagement_rate, 0) /
                  (top5.filter((v) => v.engagement_rate > 0).length || 1)
                return avgEngagement !== null
                  ? `El top 5 genera ${topEng.toFixed(2)}% de engagement vs ${avgEngagement.toFixed(2)}% de promedio general.`
                  : `El top 5 genera ${topEng.toFixed(2)}% de engagement promedio.`
              })()}
            />
          )}
        </div>
      </div>
    </div>
  )
}
