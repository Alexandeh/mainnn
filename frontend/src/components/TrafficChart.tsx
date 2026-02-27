import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import type { VideoTraffic } from '../types'
import { formatNumber } from '../lib/utils'

interface TrafficChartProps {
  data: VideoTraffic
  view?: 'pie' | 'bar'
}

const COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
]

export function TrafficChart({ data, view = 'pie' }: TrafficChartProps) {
  if (!data.sources.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No hay datos de fuentes de tráfico disponibles
      </div>
    )
  }

  const chartData = data.sources.slice(0, 8).map((s, i) => ({
    name: s.source_label,
    value: s.views,
    percentage: s.percentage,
    watch_time: s.watch_time_minutes,
    fill: COLORS[i % COLORS.length],
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm">
          <p className="text-white font-medium mb-1">{d.name}</p>
          <p className="text-gray-300">{formatNumber(d.value)} views ({d.percentage}%)</p>
          <p className="text-gray-400">{Math.round(d.watch_time)} min de watch time</p>
        </div>
      )
    }
    return null
  }

  if (view === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={formatNumber} />
          <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={130} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-1.5">
        {chartData.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
            <span className="text-gray-400 truncate">{d.name}</span>
            <span className="text-gray-500 ml-auto">{d.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
