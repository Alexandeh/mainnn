import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Eye, Clock, Target, TrendingUp, Users, ThumbsUp, MessageSquare, ExternalLink } from 'lucide-react'
import { getVideoMetrics, getVideoRetention, getVideoTraffic } from '../lib/api'
import { RetentionChart } from '../components/RetentionChart'
import { TrafficChart } from '../components/TrafficChart'
import { StatCard } from '../components/StatCard'
import { formatNumber, formatDate, formatDuration, formatWatchTime } from '../lib/utils'

interface VideoDetailProps {
  videoId: string
  onBack: () => void
}

export function VideoDetail({ videoId, onBack }: VideoDetailProps) {
  const { data: allMetrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => getVideoMetrics(50),
    staleTime: 1000 * 60 * 15,
  })

  const video = allMetrics?.find(v => v.video_id === videoId)

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
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Métricas principales</h3>
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
            color={video.average_view_percentage >= 50 ? 'green' : video.average_view_percentage >= 35 ? 'yellow' : 'red'}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Me gusta" value={formatNumber(video.likes)} icon={ThumbsUp} color="purple" />
        <StatCard title="Comentarios" value={formatNumber(video.comments)} icon={MessageSquare} color="pink" />
        <StatCard title="Engagement" value={`${video.engagement_rate.toFixed(2)}%`} icon={TrendingUp} color="yellow"
          subtitle="(likes+comments+shares)/views" />
        <StatCard
          title="Suscriptores netos"
          value={`${video.net_subscribers >= 0 ? '+' : ''}${video.net_subscribers}`}
          icon={Users}
          color={video.net_subscribers >= 0 ? 'green' : 'red'}
          subtitle={`+${video.subscribers_gained} / -${video.subscribers_lost}`}
        />
      </div>

      {/* Retention */}
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

      {/* Traffic Sources */}
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
    </div>
  )
}
