import { useQuery } from '@tanstack/react-query'
import {
  Eye, Clock, Target, TrendingUp, Users, ThumbsUp,
  MessageSquare, Share2, RefreshCw, BarChart2, Trophy, Flame, Award
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { getChannelOverview, getVideoMetrics, clearCache } from '../lib/api'
import { StatCard } from '../components/StatCard'
import { VideoCard } from '../components/VideoCard'
import { formatNumber, formatWatchTime, formatDate } from '../lib/utils'

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

interface DashboardProps {
  onSelectVideo: (videoId: string) => void
  selectedVideoId?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: VideoMetrics }>
  label?: string
}

function CustomChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const v: VideoMetrics = payload[0].payload
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl max-w-xs">
      <p className="text-white text-xs font-semibold line-clamp-2 mb-2">{v.title}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Views</span>
          <span className="text-white font-bold">{formatNumber(v.views)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">CTR</span>
          <span className="text-yellow-400 font-bold">{v.ctr.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Retención</span>
          <span className="text-green-400 font-bold">{v.average_view_percentage.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Score</span>
          <span className="text-red-400 font-bold">{v.performance_score.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}

export function Dashboard({ onSelectVideo, selectedVideoId }: DashboardProps) {
  const analysisTime = new Date()

  const { data: channel, isLoading: channelLoading } = useQuery({
    queryKey: ['channel'],
    queryFn: getChannelOverview,
  })

  const { data: metrics, isLoading: metricsLoading, refetch } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => getVideoMetrics(50),
    staleTime: 1000 * 60 * 15,
  })

  const isLoading = channelLoading || metricsLoading

  // Aggregate stats
  const totalViews = metrics?.reduce((a, v) => a + v.views, 0) ?? 0
  const totalWatchTime = metrics?.reduce((a, v) => a + v.watch_time_minutes, 0) ?? 0
  const avgCTR = metrics && metrics.filter(v => v.ctr > 0).length > 0
    ? metrics.filter(v => v.ctr > 0).reduce((a, v) => a + v.ctr, 0) / metrics.filter(v => v.ctr > 0).length
    : 0
  const avgRetention = metrics && metrics.filter(v => v.average_view_percentage > 0).length > 0
    ? metrics.filter(v => v.average_view_percentage > 0).reduce((a, v) => a + v.average_view_percentage, 0) /
      metrics.filter(v => v.average_view_percentage > 0).length
    : 0
  const totalLikes = metrics?.reduce((a, v) => a + v.likes, 0) ?? 0
  const totalComments = metrics?.reduce((a, v) => a + v.comments, 0) ?? 0
  const totalSubs = metrics?.reduce((a, v) => a + v.net_subscribers, 0) ?? 0
  const totalShares = metrics?.reduce((a, v) => a + v.shares, 0) ?? 0

  // Chart data: last 20 videos sorted by published_at ascending
  const chartData = metrics
    ? [...metrics]
        .sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime())
        .slice(-20)
    : []

  // Destacados
  const bestPerformance = metrics && metrics.length > 0
    ? metrics.reduce((best, v) => v.performance_score > best.performance_score ? v : best, metrics[0])
    : null

  const ctrVideos = metrics ? metrics.filter(v => v.ctr > 0) : []
  const bestCTR = ctrVideos.length > 0
    ? ctrVideos.reduce((best, v) => v.ctr > best.ctr ? v : best, ctrVideos[0])
    : null

  const retentionVideos = metrics ? metrics.filter(v => v.average_view_percentage > 0) : []
  const bestRetention = retentionVideos.length > 0
    ? retentionVideos.reduce((best, v) => v.average_view_percentage > best.average_view_percentage ? v : best, retentionVideos[0])
    : null

  const handleRefresh = async () => {
    await clearCache()
    refetch()
  }

  const minutesAgo = Math.floor((Date.now() - analysisTime.getTime()) / 60000)
  const analysisLabel = minutesAgo === 0
    ? 'hace menos de 1 minuto'
    : minutesAgo === 1
    ? 'hace 1 minuto'
    : `hace ${minutesAgo} minutos`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Cargando métricas del canal...</p>
          <p className="text-xs text-gray-600">Esto puede tomar hasta 30 segundos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Channel Header */}
      {channel && (
        <div className="flex items-center gap-4 p-5 rounded-xl bg-gray-800/50 border border-gray-700/50">
          {channel.thumbnail && (
            <img src={channel.thumbnail} alt={channel.title} className="w-16 h-16 rounded-full border-2 border-red-500" />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{channel.title}</h2>
            <p className="text-gray-400 text-sm">{channel.custom_url}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Users size={14} /> <strong className="text-white">{formatNumber(channel.subscriber_count)}</strong> suscriptores
              </span>
              <span className="flex items-center gap-1">
                <Eye size={14} /> <strong className="text-white">{formatNumber(channel.view_count)}</strong> views totales
              </span>
              <span className="flex items-center gap-1">
                <BarChart2 size={14} /> <strong className="text-white">{channel.video_count}</strong> videos
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Último análisis: {analysisLabel} — {analysisTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-700"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
          Resumen — últimos 365 días ({metrics?.length ?? 0} videos analizados)
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Views totales" value={formatNumber(totalViews)} icon={Eye} color="red"
            subtitle={`${metrics?.length ?? 0} videos`} />
          <StatCard title="Watch Time" value={formatWatchTime(totalWatchTime)} icon={Clock} color="blue"
            subtitle="tiempo total visto" />
          <StatCard title="CTR promedio" value={`${avgCTR.toFixed(1)}%`} icon={Target} color="yellow"
            subtitle={avgCTR >= 5 ? 'Excelente' : avgCTR >= 3 ? 'Bueno' : 'Mejorable'} />
          <StatCard title="Retención media" value={`${avgRetention.toFixed(1)}%`} icon={TrendingUp} color="green"
            subtitle={avgRetention >= 50 ? 'Excelente' : avgRetention >= 35 ? 'Buena' : 'Mejorable'} />
          <StatCard title="Me gusta" value={formatNumber(totalLikes)} icon={ThumbsUp} color="purple" />
          <StatCard title="Comentarios" value={formatNumber(totalComments)} icon={MessageSquare} color="pink" />
          <StatCard title="Compartidos" value={formatNumber(totalShares)} icon={Share2} color="blue" />
          <StatCard title="Suscriptores netos" value={`${totalSubs >= 0 ? '+' : ''}${formatNumber(totalSubs)}`}
            icon={Users} color={totalSubs >= 0 ? 'green' : 'red'} subtitle="ganados - perdidos" />
        </div>
      </div>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-5">
            Evolución de Views por Video
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              onClick={(data) => {
                if (data && data.activePayload && data.activePayload.length > 0) {
                  const v = data.activePayload[0].payload as VideoMetrics
                  onSelectVideo(v.video_id)
                }
              }}
            >
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="published_at"
                tickFormatter={(val: string) => formatDate(val)}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val: number) => formatNumber(val)}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#viewsGradient)"
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 0, cursor: 'pointer' }}
                activeDot={{ r: 6, fill: '#f97316', strokeWidth: 0, cursor: 'pointer' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Haz clic en cualquier punto para ver el detalle del video
          </p>
        </div>
      )}

      {/* Destacados */}
      {metrics && metrics.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Destacados
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Mejor performance score */}
            {bestPerformance && (
              <button
                onClick={() => onSelectVideo(bestPerformance.video_id)}
                className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-yellow-500/30 hover:border-yellow-500/70 hover:bg-gray-800 transition-all text-left group"
              >
                <div className="shrink-0 text-yellow-400 text-xl leading-none">
                  <Trophy size={20} />
                </div>
                {bestPerformance.thumbnail_url && (
                  <img
                    src={bestPerformance.thumbnail_url}
                    alt={bestPerformance.title}
                    className="w-10 h-10 rounded object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wide mb-0.5">Mejor video</p>
                  <p className="text-white text-sm font-medium truncate">{bestPerformance.title}</p>
                  <p className="text-yellow-300 text-lg font-bold leading-tight">
                    {bestPerformance.performance_score.toFixed(0)} <span className="text-xs text-gray-400 font-normal">score</span>
                  </p>
                </div>
              </button>
            )}

            {/* Mayor CTR */}
            <button
              onClick={() => bestCTR && onSelectVideo(bestCTR.video_id)}
              className={`flex-1 flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border transition-all text-left group ${
                bestCTR
                  ? 'border-blue-500/30 hover:border-blue-500/70 hover:bg-gray-800 cursor-pointer'
                  : 'border-gray-700/50 cursor-default'
              }`}
            >
              <div className="shrink-0 text-blue-400 text-xl leading-none">
                <Award size={20} />
              </div>
              {bestCTR?.thumbnail_url && (
                <img
                  src={bestCTR.thumbnail_url}
                  alt={bestCTR.title}
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-0.5">Mayor CTR</p>
                {bestCTR ? (
                  <>
                    <p className="text-white text-sm font-medium truncate">{bestCTR.title}</p>
                    <p className="text-blue-300 text-lg font-bold leading-tight">
                      {bestCTR.ctr.toFixed(1)}% <span className="text-xs text-gray-400 font-normal">CTR</span>
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Sin datos CTR</p>
                )}
              </div>
            </button>

            {/* Mejor retención */}
            {bestRetention && (
              <button
                onClick={() => onSelectVideo(bestRetention.video_id)}
                className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-orange-500/30 hover:border-orange-500/70 hover:bg-gray-800 transition-all text-left group"
              >
                <div className="shrink-0 text-orange-400 text-xl leading-none">
                  <Flame size={20} />
                </div>
                {bestRetention.thumbnail_url && (
                  <img
                    src={bestRetention.thumbnail_url}
                    alt={bestRetention.title}
                    className="w-10 h-10 rounded object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-orange-400 font-semibold uppercase tracking-wide mb-0.5">Mejor retención</p>
                  <p className="text-white text-sm font-medium truncate">{bestRetention.title}</p>
                  <p className="text-orange-300 text-lg font-bold leading-tight">
                    {bestRetention.average_view_percentage.toFixed(1)}% <span className="text-xs text-gray-400 font-normal">retención</span>
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Videos Grid */}
      {metrics && metrics.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Tus videos (ordenados por performance score)
            </h3>
            <span className="text-xs text-gray-600">{metrics.length} videos</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {metrics.map((video, i) => (
              <VideoCard
                key={video.video_id}
                video={video}
                rank={i + 1}
                onClick={() => onSelectVideo(video.video_id)}
                selected={selectedVideoId === video.video_id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
