import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, BarChart2, Sparkles, Settings, LogOut, Youtube, AlertCircle } from 'lucide-react'
import { getAuthStatus, logout } from './lib/api'
import { Dashboard } from './pages/Dashboard'
import { VideoDetail } from './pages/VideoDetail'
import { Comparison } from './pages/Comparison'
import { Insights } from './pages/Insights'
import { SetupPage } from './pages/SetupPage'
import { cn } from './lib/utils'

type Tab = 'dashboard' | 'comparison' | 'insights' | 'setup'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)

  // Check for auth success from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, '', '/')
      refetchAuth()
    }
  }, [])

  const { data: authStatus, isLoading: authLoading, refetch: refetchAuth } = useQuery({
    queryKey: ['authStatus'],
    queryFn: getAuthStatus,
    refetchInterval: 30000,
  })

  const handleLogout = async () => {
    await logout()
    refetchAuth()
  }

  const handleSelectVideo = (videoId: string) => {
    setSelectedVideoId(videoId)
  }

  const handleBackFromVideo = () => {
    setSelectedVideoId(null)
  }

  const navItems = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'comparison' as Tab, label: 'Comparación', icon: BarChart2 },
    { id: 'insights' as Tab, label: 'Insights IA', icon: Sparkles },
    { id: 'setup' as Tab, label: 'Configuración', icon: Settings },
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-10">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <Youtube size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">YT Analytics</p>
              <p className="text-xs text-gray-500">@AIrtVids</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id)
                if (id !== 'dashboard') setSelectedVideoId(null)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === id
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon size={18} />
              {label}
              {id === 'insights' && (
                <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-mono">
                  IA
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Auth status */}
        <div className="p-3 border-t border-gray-800">
          {authStatus?.authenticated ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-green-300 truncate">Conectado</p>
                  {authStatus.channel_title && (
                    <p className="text-xs text-gray-500 truncate">{authStatus.channel_title}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800"
              >
                <LogOut size={14} />
                Desconectar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-300">No conectado</p>
                <button
                  onClick={() => setActiveTab('setup')}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  Ver configuración →
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {!authStatus?.authenticated && activeTab !== 'setup' ? (
          <SetupPage authUrl={authStatus?.auth_url} />
        ) : (
          <>
            {activeTab === 'dashboard' && !selectedVideoId && (
              <Dashboard onSelectVideo={handleSelectVideo} selectedVideoId={selectedVideoId ?? undefined} />
            )}
            {activeTab === 'dashboard' && selectedVideoId && (
              <VideoDetail videoId={selectedVideoId} onBack={handleBackFromVideo} />
            )}
            {activeTab === 'comparison' && (
              <Comparison onSelectVideo={(id) => { setSelectedVideoId(id); setActiveTab('dashboard') }} />
            )}
            {activeTab === 'insights' && <Insights />}
            {activeTab === 'setup' && <SetupPage authUrl={authStatus?.auth_url} />}
          </>
        )}
      </main>
    </div>
  )
}
