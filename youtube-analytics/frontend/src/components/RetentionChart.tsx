import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import type { RetentionData } from '../types'

interface RetentionChartProps {
  data: RetentionData
}

export function RetentionChart({ data }: RetentionChartProps) {
  if (!data.elapsed_video_time_ratio.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos de retención disponibles para este video
      </div>
    )
  }

  const chartData = data.elapsed_video_time_ratio.map((ratio, i) => ({
    time: `${(ratio * 100).toFixed(0)}%`,
    audiencia: data.audience_watch_ratio[i] !== undefined
      ? parseFloat(data.audience_watch_ratio[i].toFixed(1))
      : 0,
    relativo: data.relative_retention_performance[i] !== undefined
      ? parseFloat(data.relative_retention_performance[i].toFixed(1))
      : 0,
  }))

  // Encontrar caídas bruscas (drops > 5%)
  const drops: number[] = []
  for (let i = 1; i < chartData.length; i++) {
    const drop = chartData[i - 1].audiencia - chartData[i].audiencia
    if (drop > 5) drops.push(i)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm">
          <p className="text-gray-400 mb-1">Posición: {label}</p>
          {payload.map((p: any) => (
            <p key={p.dataKey} style={{ color: p.color }}>
              {p.name}: {p.value}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-red-500" />
          <span>% Audiencia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-blue-400" />
          <span>Rendimiento relativo vs videos similares</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickLine={false}
            interval={Math.floor(chartData.length / 10)}
          />
          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={50} stroke="#4B5563" strokeDasharray="4 4" label={{ value: '50%', fill: '#6B7280', fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="audiencia"
            stroke="#EF4444"
            strokeWidth={2.5}
            dot={false}
            name="% Audiencia"
          />
          <Line
            type="monotone"
            dataKey="relativo"
            stroke="#60A5FA"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="5 3"
            name="Rendimiento relativo"
          />
        </LineChart>
      </ResponsiveContainer>

      {drops.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-xs text-yellow-400 font-medium">
            Caídas detectadas en: {drops.slice(0, 3).map(i =>
              `${chartData[i].time} del video`
            ).join(', ')}
            {drops.length > 3 ? ` y ${drops.length - 3} más` : ''}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Revisa qué ocurre en esos momentos: pueden ser secciones aburridas, saltos de tema, o transiciones bruscas.
          </p>
        </div>
      )}
    </div>
  )
}
