import { Eye, ThumbsUp, MessageSquare, Clock, TrendingUp, Target, Users, Flame } from 'lucide-react'
import type { VideoMetrics } from '../types'
import { formatNumber, formatDate, formatDuration, formatWatchTime, getCTRColor, getRetentionColor, cn } from '../lib/utils'

interface VideoCardProps {
  video: VideoMetrics
  rank?: number
  onClick?: () => void
  selected?: boolean
}

function getPerformanceBarColor(score: number): string {
  if (score > 70) return 'bg-green-500'
  if (score > 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

function isNewVideo(publishedAt: string): boolean {
  const published = new Date(publishedAt)
  const now = new Date()
  const diffDays = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays < 14
}

function formatWatchTimeHM(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function VideoCard({ video, rank, onClick, selected }: VideoCardProps) {
  const retentionColor = getRetentionColor(video.average_view_percentage)
  const ctrColor = getCTRColor(video.ctr)
  const isTrending = isNewVideo(video.published_at) && video.performance_score > 50
  const performanceBarColor = getPerformanceBarColor(video.performance_score)

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden',
        selected
          ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
          : 'border-gray-700/50 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800 hover:shadow-md hover:shadow-black/30'
      )}
    >
      {rank && (
        <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md">
          #{rank}
        </div>
      )}

      {/* Thumbnail — fixed aspect ratio to avoid layout shifts */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 */ }}>
        <div className="absolute inset-0 bg-gray-900 overflow-hidden">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <span className="text-gray-600 text-4xl">▶</span>
            </div>
          )}

          {/* Performance score badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono">
            Score: {video.performance_score.toFixed(0)}
          </div>

          {/* Trending / New badge */}
          {isTrending && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-orange-500/90 text-white text-xs font-bold px-2 py-1 rounded">
              <Flame size={11} />
              Nuevo
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight">
            {video.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{formatDate(video.published_at)}</p>

          {/* Performance progress bar */}
          <div className="mt-2 h-1 w-full bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', performanceBarColor)}
              style={{ width: `${Math.min(100, Math.max(0, video.performance_score))}%` }}
            />
          </div>
        </div>

        {/* Primary metrics */}
        <div className="grid grid-cols-2 gap-2">
          <MetricBadge icon={Eye} label="Views" value={formatNumber(video.views)} />
          <MetricBadge
            icon={Clock}
            label="Retención"
            value={video.average_view_percentage > 0 ? `${video.average_view_percentage.toFixed(1)}%` : '—'}
            valueClass={retentionColor}
          />
          <MetricBadge
            icon={Target}
            label="CTR"
            value={video.ctr === 0 ? 'N/A' : `${video.ctr.toFixed(1)}%`}
            valueClass={video.ctr === 0 ? 'text-gray-500' : ctrColor}
            tooltip={video.ctr === 0 ? 'Sin datos aún' : undefined}
          />
          <MetricBadge
            icon={TrendingUp}
            label="Engagement"
            value={video.engagement_rate > 0 ? `${video.engagement_rate.toFixed(2)}%` : '—'}
          />
        </div>

        {/* Secondary metrics */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-700/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ThumbsUp size={11} /> {formatNumber(video.likes)}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={11} /> {formatNumber(video.comments)}
            </span>
            {video.watch_time_minutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={11} /> {formatWatchTimeHM(video.watch_time_minutes)}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Users size={11} />
            <span className={video.net_subscribers >= 0 ? 'text-green-400' : 'text-red-400'}>
              {video.net_subscribers >= 0 ? '+' : ''}{video.net_subscribers} subs
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

function MetricBadge({
  icon: Icon,
  label,
  value,
  valueClass = 'text-white',
  tooltip,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
  valueClass?: string
  tooltip?: string
}) {
  return (
    <div
      className="bg-gray-900/50 rounded-lg px-3 py-2"
      title={tooltip}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <Icon size={10} className="text-gray-500" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <span className={cn('text-sm font-bold', valueClass)}>{value}</span>
    </div>
  )
}
