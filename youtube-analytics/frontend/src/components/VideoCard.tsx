import { Eye, ThumbsUp, MessageSquare, Clock, TrendingUp, Target, Users } from 'lucide-react'
import type { VideoMetrics } from '../types'
import { formatNumber, formatDate, formatDuration, getCTRColor, getRetentionColor } from '../lib/utils'

interface VideoCardProps {
  video: VideoMetrics
  rank?: number
  onClick?: () => void
  selected?: boolean
}

export function VideoCard({ video, rank, onClick, selected }: VideoCardProps) {
  const retentionColor = getRetentionColor(video.average_view_percentage)
  const ctrColor = getCTRColor(video.ctr)

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden
        ${selected
          ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
          : 'border-gray-700/50 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
        }
      `}
    >
      {rank && (
        <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md">
          #{rank}
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
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
        {/* Performance badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono">
          Score: {video.performance_score.toFixed(0)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight">
            {video.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{formatDate(video.published_at)}</p>
        </div>

        {/* Primary metrics */}
        <div className="grid grid-cols-2 gap-2">
          <MetricBadge icon={Eye} label="Views" value={formatNumber(video.views)} />
          <MetricBadge icon={Clock} label="Retención"
            value={video.average_view_percentage > 0 ? `${video.average_view_percentage.toFixed(1)}%` : '—'}
            valueClass={retentionColor}
          />
          <MetricBadge icon={Target} label="CTR"
            value={video.ctr > 0 ? `${video.ctr.toFixed(1)}%` : '—'}
            valueClass={ctrColor}
          />
          <MetricBadge icon={TrendingUp} label="Engagement"
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
  valueClass = 'text-white'
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="bg-gray-900/50 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon size={10} className="text-gray-500" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <span className={`text-sm font-bold ${valueClass}`}>{value}</span>
    </div>
  )
}
