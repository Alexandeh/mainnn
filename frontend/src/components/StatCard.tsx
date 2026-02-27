import { cn } from '../lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  description?: string
  icon: LucideIcon
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'pink'
  trend?: number // % change
  alert?: boolean
  className?: string
}

const colorMap = {
  blue:   'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400 hover:border-blue-400/60',
  red:    'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400 hover:border-red-400/60',
  green:  'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400 hover:border-green-400/60',
  yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400 hover:border-yellow-400/60',
  purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400 hover:border-purple-400/60',
  pink:   'from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-400 hover:border-pink-400/60',
}

/** Returns only the text-* class for icon coloring */
function iconColor(color: keyof typeof colorMap): string {
  return colorMap[color].split(' ').find(c => c.startsWith('text-')) ?? 'text-blue-400'
}

export function StatCard({
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  color = 'blue',
  trend,
  alert,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl border bg-gradient-to-br p-5 backdrop-blur-sm',
        'transition-all duration-200',
        colorMap[color],
        className
      )}
    >
      {/* Alert dot — pulsing indicator in the top-right corner */}
      {alert && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
      )}

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400 font-medium">{title}</span>
        <div className="p-2 rounded-lg bg-white/5">
          <Icon size={18} className={iconColor(color)} />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold text-white">{value}</p>

        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}

        {/* Description — extra small muted text */}
        {description && (
          <p className="text-[11px] text-gray-600 leading-snug">{description}</p>
        )}

        {/* Trend pill with animated arrow */}
        {trend !== undefined && (
          <div className="pt-0.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                trend >= 0
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-red-500/15 text-red-400'
              )}
            >
              {/* Arrow with CSS transition so it "bounces" on mount */}
              <span
                className={cn(
                  'inline-block transition-transform duration-300',
                  trend >= 0 ? 'animate-bounce-up' : 'animate-bounce-down'
                )}
                style={{
                  display: 'inline-block',
                  animation: trend >= 0
                    ? 'trendUp 0.6s ease-out'
                    : 'trendDown 0.6s ease-out',
                }}
              >
                {trend >= 0 ? '↑' : '↓'}
              </span>
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Keyframe animations injected inline (no build-step dependency) */}
      <style>{`
        @keyframes trendUp {
          0%   { transform: translateY(4px); opacity: 0; }
          60%  { transform: translateY(-2px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes trendDown {
          0%   { transform: translateY(-4px); opacity: 0; }
          60%  { transform: translateY(2px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
