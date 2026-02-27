import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Eye, Clock, Target, TrendingUp, Users, ThumbsUp, MessageSquare,
  ExternalLink, Award, BarChart2, Star, Zap,
} from 'lucide-react'
import { getVideoMetrics, getVideoRetention, getVideoTraffic } from '../lib/api'
import { RetentionChart } from '../components/RetentionChart'
import { TrafficChart } from '../components/TrafficChart'
import { StatCard } from '../components/StatCard'
import { formatNumber, formatDate, formatDuration, formatWatchTime } from '../lib/utils'

interface VideoMetrics {
  video_id: string
  title: string
  published_at: string
  thumbnail_url: string
  views: number
  watch_time_minutes: number
  average_view_duration_seconds: number
  average_view_percentage: number
  likes: number
  dislikes: number
  comments: number
  shares: number
  impressions: number
  ctr: number
  subscribers_gained: number
  subscribers_lost: number
  net_subscribers: number
  engagement_rate: number
  performance_score: number
}

interface VideoDetailProps {
  videoId: string
  onBack: () => void
  onSelectVideo?: (id: string) => void
}

function calcAvg(metrics: VideoMetrics[], field: keyof VideoMetrics): number {
  if (!metrics.length) return 0
  const sum = metrics.reduce((acc, v) => acc + (v[field] as number), 0)
  return sum / metrics.length
}

function DeltaBadge({ value, avg }: { value: number; avg: number }) {
  if (value === 0 || avg === 0) {
    return <span className="text-gray-500 text-sm font-medium">—</span>
  }
  const pct = ((value - avg) / Math.abs(avg)) * 100
  const positive = pct >= 0
  return (
    <span
      className={`text-sm font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}
    >
      {positive ? '+' : ''}{pct.toFixed(0)}% {positive ? '↑' : '↓'}
    </span>
  )
}

export function VideoDetail({ videoId, onBack, onSelectVideo }: VideoDetailProps) {
  const { data: allMetrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => getVideoMetrics(50),
    staleTime: 1000 * 60 * 15,
  })

  const video = allMetrics?.find((v) => v.video_id === videoId)

  const { data: retention, isLoading: retLoading } = useQuery({
    queryKey: ['retention', videoId],
    queryFn: () => getVideoRetention(videoId),
    enabled: !!videoId,
  })

  const { data: traffic, isLoading: trafficLoading } = useQuery({
    queryKey: ['traffic', videoId],
    queryFn: () => getVideoTraffic(videoId),
    enabled: !!videoId,
  })

  if (!video) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Badges de header ──────────────────────────────────────────────────────
  const otherVideos = allMetrics ?? []
  const sortedByScore = [...otherVideos].sort((a, b) => b.performance_score - a.performance_score)
  const top10Index = Math.ceil(sortedByScore.length * 0.1)
  const isTop10 = sortedByScore.slice(0, top10Index).some((v) => v.video_id === videoId)
  const maxCtr = Math.max(...otherVideos.map((v) => v.ctr))
  const isBestCtr = video.ctr > 0 && video.ctr === maxCtr
  const maxRetention = Math.max(...otherVideos.map((v) => v.average_view_percentage))
  const isBestRetention = video.average_view_percentage > 0 && video.average_view_percentage === maxRetention

  // ── Promedios del canal (sin el video actual) ─────────────────────────────
  const channelVideos = otherVideos.filter((v) => v.video_id !== videoId)

  const avgViews = calcAvg(channelVideos, 'views')
  const avgCtr = calcAvg(channelVideos, 'ctr')
  const avgRetention = calcAvg(channelVideos, 'average_view_percentage')
  const avgEngagement = calcAvg(channelVideos, 'engagement_rate')
  const avgNetSubs = calcAvg(channelVideos, 'net_subscribers')

  // ── Videos relacionados (top 4 por performance_score, excluyendo actual) ──
  const relatedVideos = [...channelVideos]
    .sort((a, b) => b.performance_score - a.performance_score)
    .slice(0, 4)

  const benchmarkRows: {
    label: string
    videoVal: number
    avgVal: number
    format: (n: number) => string
  }[] = [
    {
      label: 'Views',
      videoVal: video.views,
      avgVal: avgViews,
      format: formatNumber,
    },
    {
      label: 'CTR',
      videoVal: video.ctr,
      avgVal: avgCtr,
      format: (n) => (n > 0 ? `${n.toFixed(1)}%` : 'N/A'),
    },
    {
      label: 'Retención',
      videoVal: video.average_view_percentage,
      avgVal: avgRetention,
      format: (n) => (n > 0 ? `${n.toFixed(1)}%` : 'N/A'),
    },
    {
      label: 'Engagement',
      videoVal: video.engagement_rate,
      avgVal: avgEngagement,
      format: (n) => (n > 0 ? `${n.toFixed(2)}%` : 'N/A'),
    },
    {
      label: 'Subs netos',
      videoVal: video.net_subscribers,
      avgVal: avgNetSubs,
      format: (n) => (n >= 0 ? `+${Math.round(n)}` : `${Math.round(n)}`),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        <span>Volver al dashboard</span>
      </button>

      {/* Video header */}
      <div className="flex gap-4 p-5 rounded-xl bg-gray-800/50 border border-gray-700/50">
        {video.thumbnail_url && (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-48 h-27 object-cover rounded-lg flex-shrink-0 hidden sm:block"
          />
        )}
        <div className="flex-1 space-y-2">
          <h2 className="text-xl font-bold text-white">{video.title}</h2>
          <p className="text-gray-400 text-sm">{formatDate(video.published_at)}</p>

          {/* Achievement badges */}
          <div className="flex flex-wrap items-center gap-2">
            {isTop10 && (
              <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-1 rounded-full font-medium">
                <Star size={11} />
                Top 10% del canal
              </span>
            )}
            {isBestCtr && (
              <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-1 rounded-full font-medium">
                <Zap size={11} />
                Mejor CTR
              </span>
            )}
            {isBestRetention && (
              <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-full font-medium">
                <Award size={11} />
                Mejor retención
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <ExternalLink size={14} />
              Ver en YouTube
            </a>
            <a
              href={`https://studio.youtube.com/video/${videoId}/analytics`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink size={14} />
              YouTube Studio
            </a>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
              Score: {video.performance_score.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
          Métricas principales
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Views" value={formatNumber(video.views)} icon={Eye} color="red" />
          <StatCard
            title="Watch Time"
            value={formatWatchTime(video.watch_time_minutes)}
            icon={Clock}
            color="blue"
            subtitle={`${formatDuration(video.average_view_duration_seconds)} promedio`}
          />
          <StatCard
            title="CTR"
            value={video.ctr > 0 ? `${video.ctr.toFixed(1)}%` : 'N/A'}
            icon={Target}
            color={video.ctr >= 5 ? 'green' : video.ctr >= 3 ? 'yellow' : 'red'}
            subtitle={`${formatNumber(video.impressions)} impresiones`}
          />
          <StatCard
            title="Retención"
            value={video.average_view_percentage > 0 ? `${video.average_view_percentage.toFixed(1)}%` : 'N/A'}
            icon={TrendingUp}
            color={
              video.average_view_percentage >= 50
                ? 'green'
                : video.average_view_percentage >= 35
                ? 'yellow'
                : 'red'
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Me gusta" value={formatNumber(video.likes)} icon={ThumbsUp} color="purple" />
        <StatCard
          title="Comentarios"
          value={formatNumber(video.comments)}
          icon={MessageSquare}
          color="pink"
        />
        <StatCard
          title="Engagement"
          value={`${video.engagement_rate.toFixed(2)}%`}
          icon={TrendingUp}
          color="yellow"
          subtitle="(likes+comments+shares)/views"
        />
        <StatCard
          title="Suscriptores netos"
          value={`${video.net_subscribers >= 0 ? '+' : ''}${video.net_subscribers}`}
          icon={Users}
          color={video.net_subscribers >= 0 ? 'green' : 'red'}
          subtitle={`+${video.subscribers_gained} / -${video.subscribers_lost}`}
        />
      </div>

      {/* ── Benchmark vs canal ─────────────────────────────────────────────── */}
      {channelVideos.length > 0 && (
        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-purple-400" />
            📊 Benchmark vs Promedio del Canal
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/60">
                  <th className="text-left text-gray-400 font-medium pb-3 pr-4">Métrica</th>
                  <th className="text-right text-gray-400 font-medium pb-3 px-4">Este video</th>
                  <th className="text-right text-gray-400 font-medium pb-3 px-4">Promedio canal</th>
                  <th className="text-right text-gray-400 font-medium pb-3 pl-4">vs Promedio</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkRows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-gray-700/30 ${
                      i % 2 === 0 ? 'bg-gray-700/10' : ''
                    }`}
                  >
                    <td className="text-gray-300 py-3 pr-4 font-medium">{row.label}</td>
                    <td className="text-white text-right py-3 px-4 tabular-nums">
                      {row.videoVal === 0 ? (
                        <span className="text-gray-500">N/A</span>
                      ) : (
                        row.format(row.videoVal)
                      )}
                    </td>
                    <td className="text-gray-400 text-right py-3 px-4 tabular-nums">
                      {row.avgVal === 0 ? (
                        <span className="text-gray-500">N/A</span>
                      ) : (
                        row.format(row.avgVal)
                      )}
                    </td>
                    <td className="text-right py-3 pl-4">
                      <DeltaBadge value={row.videoVal} avg={row.avgVal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Retención ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-red-400" />
          Curva de retención de audiencia
        </h3>
        {retLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : retention ? (
          <RetentionChart data={retention} />
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">
            Datos de retención no disponibles
          </p>
        )}
      </div>

      {/* ── Fuentes de tráfico ─────────────────────────────────────────────── */}
      <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Eye size={18} className="text-blue-400" />
          Fuentes de tráfico
        </h3>
        {trafficLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : traffic && traffic.sources.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrafficChart data={traffic} view="pie" />
            <TrafficChart data={traffic} view="bar" />
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">
            Datos de fuentes de tráfico no disponibles
          </p>
        )}
      </div>

      {/* ── Videos relacionados ────────────────────────────────────────────── */}
      {relatedVideos.length > 0 && (
        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Star size={18} className="text-yellow-400" />
            Videos relacionados
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {relatedVideos.map((v) => (
              <button
                key={v.video_id}
                onClick={() => {
                  if (onSelectVideo) {
                    onSelectVideo(v.video_id)
                  }
                }}
                className="group flex flex-col gap-2 p-3 rounded-lg bg-gray-700/40 border border-gray-600/40
                           hover:bg-gray-700/70 hover:border-gray-500/60 transition-all text-left"
              >
                {v.thumbnail_url ? (
                  <img
                    src={v.thumbnail_url}
                    alt={v.title}
                    className="w-full aspect-video object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full aspect-video bg-gray-600/50 rounded-md flex items-center justify-center">
                    <Eye size={20} className="text-gray-500" />
                  </div>
                )}
                <p className="text-white text-xs font-medium line-clamp-2 leading-snug group-hover:text-red-300 transition-colors">
                  {v.title}
                </p>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="flex items-center gap-1 text-gray-400 text-xs">
                    <Eye size={11} />
                    {formatNumber(v.views)}
                  </span>
                  <span className="text-xs bg-gray-600/60 text-gray-300 px-1.5 py-0.5 rounded">
                    {v.performance_score.toFixed(0)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
