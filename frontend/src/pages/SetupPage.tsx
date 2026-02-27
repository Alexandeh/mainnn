import { ExternalLink, Key, CheckCircle2, Copy, Youtube } from 'lucide-react'
import { useState } from 'react'

interface SetupPageProps {
  authUrl?: string
}

export function SetupPage({ authUrl }: SetupPageProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const steps = [
    {
      number: '01',
      title: 'Crear proyecto en Google Cloud Console',
      color: 'blue',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>Ve a <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer"
            className="text-blue-400 hover:underline inline-flex items-center gap-1">
            console.cloud.google.com <ExternalLink size={12} />
          </a></p>
          <ol className="space-y-2 list-none">
            {[
              'Haz clic en "Select a project" → "New Project"',
              'Nombre: "YouTube Analytics Dashboard" → CREATE',
              'Espera a que se cree y selecciónalo',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 font-bold flex-shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )
    },
    {
      number: '02',
      title: 'Activar YouTube APIs',
      color: 'red',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>En Google Cloud Console, ve a <strong>APIs & Services → Library</strong></p>
          <p>Busca y activa estas dos APIs:</p>
          <div className="space-y-2">
            {[
              { name: 'YouTube Data API v3', desc: 'Para leer títulos, thumbnails, metadatos' },
              { name: 'YouTube Analytics API', desc: 'Para retención, CTR, fuentes de tráfico' },
            ].map((api, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-900/50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-white font-medium text-sm">{api.name}</p>
                  <p className="text-gray-500 text-xs">{api.desc}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(api.name, `api-${i}`)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {copied === `api-${i}` ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      number: '03',
      title: 'Crear credenciales OAuth2',
      color: 'green',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>Ve a <strong>APIs & Services → Credentials</strong></p>
          <ol className="space-y-2 list-none">
            {[
              'Click "Create Credentials" → "OAuth client ID"',
              'Configure consent screen: External → nombre de tu app → guarda',
              'Application type: "Web application"',
              'Name: "YouTube Analytics Dashboard"',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-400 font-bold flex-shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
          <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs">
            <p className="text-gray-500 mb-1">Authorized redirect URIs — añade exactamente:</p>
            <div className="flex items-center justify-between">
              <code className="text-green-400">http://localhost:8000/auth/callback</code>
              <button onClick={() => copyToClipboard('http://localhost:8000/auth/callback', 'redirect')}>
                {copied === 'redirect' ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-500" />}
              </button>
            </div>
          </div>
          <p>Descarga el JSON o copia el <strong>Client ID</strong> y <strong>Client Secret</strong></p>
        </div>
      )
    },
    {
      number: '04',
      title: 'Configurar el .env',
      color: 'yellow',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>En la carpeta <code className="text-yellow-400 bg-gray-900 px-1 rounded">backend/</code>, copia el archivo:</p>
          <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs space-y-1">
            <div className="flex items-center justify-between">
              <code className="text-gray-400">cp .env.example .env</code>
              <button onClick={() => copyToClipboard('cp .env.example .env', 'cp')}>
                {copied === 'cp' ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-500" />}
              </button>
            </div>
          </div>
          <p>Edita el <code className="text-yellow-400 bg-gray-900 px-1 rounded">.env</code> con tus credenciales:</p>
          <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs space-y-1">
            <p><span className="text-gray-500">GOOGLE_CLIENT_ID=</span><span className="text-green-400">tu_client_id_aqui</span></p>
            <p><span className="text-gray-500">GOOGLE_CLIENT_SECRET=</span><span className="text-green-400">tu_client_secret_aqui</span></p>
          </div>
        </div>
      )
    },
    {
      number: '05',
      title: 'Conectar tu canal de YouTube',
      color: 'red',
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>Con el backend corriendo, haz clic en el botón de abajo para autorizar acceso a tu canal <strong>@AIrtVids</strong>.</p>
          <p className="text-yellow-400 text-xs">
            Nota: Al ser una app en modo "testing", necesitas agregar tu email de Google como usuario de prueba en la consent screen.
          </p>
          <ol className="space-y-2 list-none text-xs">
            {[
              'En Cloud Console → APIs & Services → OAuth consent screen',
              'Scroll hasta "Test users" → Add Users',
              'Añade el email de tu cuenta de YouTube',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-400 font-bold flex-shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )
    },
  ]

  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/30 bg-blue-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    green: 'border-green-500/30 bg-green-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
  }

  const numberColorMap: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10',
    red: 'text-red-400 bg-red-500/10',
    green: 'text-green-400 bg-green-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <Youtube size={40} className="text-red-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white">YouTube Analytics Dashboard</h1>
        <p className="text-gray-400">
          Para <strong className="text-white">@AIrtVids</strong> — Sigue estos pasos para conectar tu canal
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.number} className={`rounded-xl border p-5 ${colorMap[step.color]}`}>
            <div className="flex items-start gap-4">
              <div className={`text-2xl font-black rounded-xl px-3 py-1 flex-shrink-0 ${numberColorMap[step.color]}`}>
                {step.number}
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="font-semibold text-white text-base">{step.title}</h3>
                {step.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Auth button */}
      <div className="text-center space-y-4">
        <div className="h-px bg-gray-700" />
        {authUrl ? (
          <a
            href={authUrl}
            className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg"
          >
            <Key size={20} />
            Conectar con Google / YouTube
          </a>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-500 text-sm">
              El backend no está configurado todavía. Completa los pasos anteriores y reinicia el servidor.
            </p>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-left max-w-md mx-auto">
              <p className="text-gray-400 mb-2"># Iniciar el backend:</p>
              <p className="text-green-400">cd backend</p>
              <p className="text-green-400">pip install -r requirements.txt</p>
              <p className="text-green-400">uvicorn app.main:app --reload</p>
            </div>
          </div>
        )}
        <p className="text-xs text-gray-600">
          Solo se piden permisos de lectura — nunca se modificarán tus videos
        </p>
      </div>
    </div>
  )
}
