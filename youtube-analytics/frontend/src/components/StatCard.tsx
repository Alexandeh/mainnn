import { cn } from '../lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'pink'
  trend?: number // % change
  className?: string
}

const colorMap = {
  blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
  red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
  green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
  yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
  purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
  pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-400',
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend, className }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-xl border bg-gradient-to-br p-5 backdrop-blur-sm',
      colorMap[color],
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400 font-medium">{title}</span>
        <div className={cn('p-2 rounded-lg bg-white/5')}>
          <Icon size={18} className={colorMap[color].split(' ').pop()} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        {trend !== undefined && (
          <p className={cn('text-xs font-medium', trend >= 0 ? 'text-green-400' : 'text-red-400')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  )
}
