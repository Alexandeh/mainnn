import { useQuery } from '@tanstack/react-query'
import {
  Eye, Clock, Target, TrendingUp, Users, ThumbsUp,
  MessageSquare, Share2, RefreshCw, BarChart2
} from 'lucide-react'
import { getChannelOverview, getVideoMetrics, clearCache } from '../lib/api'
import { StatCard } from '../components/StatCard'
import { VideoCard } from '../components/VideoCard'
import { formatNumber, formatWatchTime } from '../lib/utils'

interface DashboardProps {
  onSelectVideo: (videoId: string) => void
  selectedVideoId?: string
}

export function Dashboard({ onSelectVideo, selectedVideoId }: DashboardProps) {
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

  const handleRefresh = async () => {
    await clearCache()
    refetch()
  }

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

      {/* Top Videos */}
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
