import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ZAxis
} from 'recharts'
import type { VideoMetrics } from '../types'
import { formatNumber } from '../lib/utils'

interface MetricsScatterChartProps {
  videos: VideoMetrics[]
  xKey: keyof VideoMetrics
  yKey: keyof VideoMetrics
  xLabel: string
  yLabel: string
}

export function MetricsScatterChart({ videos, xKey, yKey, xLabel, yLabel }: MetricsScatterChartProps) {
  const chartData = videos
    .filter(v => (v[xKey] as number) > 0 && (v[yKey] as number) > 0)
    .map(v => ({
      x: v[xKey] as number,
      y: v[yKey] as number,
      z: v.views,
      name: v.title,
    }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs max-w-xs">
          <p className="text-white font-medium mb-2 line-clamp-2">{d.name}</p>
          <p className="text-gray-300">{xLabel}: {typeof d.x === 'number' && d.x % 1 !== 0 ? d.x.toFixed(2) : formatNumber(d.x)}</p>
          <p className="text-gray-300">{yLabel}: {typeof d.y === 'number' && d.y % 1 !== 0 ? d.y.toFixed(2) : formatNumber(d.y)}</p>
          <p className="text-gray-400">Views: {formatNumber(d.z)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickLine={false}
          tickFormatter={(v) => v % 1 !== 0 ? `${v.toFixed(1)}` : formatNumber(v)}
          label={{ value: xLabel, position: 'insideBottom', offset: -10, fill: '#6B7280', fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickLine={false}
          tickFormatter={(v) => v % 1 !== 0 ? `${v.toFixed(1)}` : formatNumber(v)}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 11 }}
        />
        <ZAxis type="number" dataKey="z" range={[30, 200]} />
        <Tooltip content={<CustomTooltip />} />
        <Scatter
          data={chartData}
          fill="#EF4444"
          fillOpacity={0.7}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
