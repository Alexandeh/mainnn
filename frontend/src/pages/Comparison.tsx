import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Trophy, Target, TrendingUp, Zap } from 'lucide-react'
import { getVideoMetrics } from '../lib/api'
import { MetricsScatterChart } from '../components/MetricsScatterChart'
import { formatNumber } from '../lib/utils'

interface ComparisonProps {
  onSelectVideo: (id: string) => void
}

export function Comparison({ onSelectVideo }: ComparisonProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => getVideoMetrics(50),
    staleTime: 1000 * 60 * 15,
  })

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const top10Views = [...metrics].sort((a, b) => b.views - a.views).slice(0, 10)
  const top10CTR = [...metrics].filter(v => v.ctr > 0).sort((a, b) => b.ctr - a.ctr).slice(0, 10)
  const top10Retention = [...metrics].filter(v => v.average_view_percentage > 0)
    .sort((a, b) => b.average_view_percentage - a.average_view_percentage).slice(0, 10)

  const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6',
    '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#84CC16']

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div
          className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs max-w-xs cursor-pointer"
          onClick={() => onSelectVideo(d.id)}
        >
          <p className="text-white font-medium mb-1 line-clamp-2">{d.name}</p>
          <p className="text-red-400">{payload[0].name}: {
            typeof payload[0].value === 'number' && payload[0].value % 1 !== 0
              ? `${payload[0].value.toFixed(1)}%`
              : formatNumber(payload[0].value)
          }</p>
          <p className="text-gray-500 mt-1">Click para ver detalle</p>
        </div>
      )
    }
    return null
  }

  const makeChartData = (vids: typeof metrics, key: keyof typeof metrics[0]) =>
    vids.map((v, i) => ({
      name: v.title.length > 30 ? v.title.slice(0, 28) + '…' : v.title,
      value: v[key] as number,
      id: v.video_id,
      fill: COLORS[i % COLORS.length],
    }))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Comparación de Videos</h2>
        <p className="text-gray-400 text-sm mt-1">
          Análisis comparativo de {metrics.length} videos — identifica qué funciona mejor
        </p>
      </div>

      {/* Scatter plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            <Target size={16} className="text-yellow-400" />
            CTR vs Retención
          </h3>
          <p className="text-xs text-gray-500 mb-4">Videos en la esquina superior derecha son los más optimizados</p>
          <MetricsScatterChart
            videos={metrics}
            xKey="ctr"
            yKey="average_view_percentage"
            xLabel="CTR (%)"
            yLabel="Retención (%)"
          />
        </div>

        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" />
            Views vs Engagement
          </h3>
          <p className="text-xs text-gray-500 mb-4">El tamaño del punto = views. ¿Más views = más engagement?</p>
          <MetricsScatterChart
            videos={metrics}
            xKey="views"
            yKey="engagement_rate"
            xLabel="Views"
            yLabel="Engagement (%)"
          />
        </div>
      </div>

      {/* Bar charts rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top by views */}
        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            <Trophy size={16} className="text-yellow-400" />
            Top por Views
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={makeChartData(top10Views, 'views')} layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={formatNumber} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 9 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Views" radius={[0, 4, 4, 0]}>
                {makeChartData(top10Views, 'views').map((e, i) => (
                  <Cell key={i} fill={e.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top by CTR */}
        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            <Target size={16} className="text-yellow-400" />
            Top por CTR
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={makeChartData(top10CTR, 'ctr')} layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 9 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="CTR (%)" radius={[0, 4, 4, 0]}>
                {makeChartData(top10CTR, 'ctr').map((e, i) => (
                  <Cell key={i} fill={e.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top by Retention */}
        <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            <Zap size={16} className="text-green-400" />
            Top por Retención
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={makeChartData(top10Retention, 'average_view_percentage')} layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 9 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Retención (%)" radius={[0, 4, 4, 0]}>
                {makeChartData(top10Retention, 'average_view_percentage').map((e, i) => (
                  <Cell key={i} fill={e.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
