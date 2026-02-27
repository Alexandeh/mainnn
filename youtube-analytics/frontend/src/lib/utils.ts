import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('es')
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatWatchTime(minutes: number): string {
  if (minutes >= 60) return `${(minutes / 60).toFixed(1)}h`
  return `${Math.round(minutes)}min`
}

export function getScoreColor(score: number, max: number = 100): string {
  const pct = (score / max) * 100
  if (pct >= 70) return 'text-green-400'
  if (pct >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

export function getRetentionColor(pct: number): string {
  if (pct >= 50) return 'text-green-400'
  if (pct >= 35) return 'text-yellow-400'
  return 'text-red-400'
}

export function getCTRColor(ctr: number): string {
  if (ctr >= 5) return 'text-green-400'
  if (ctr >= 3) return 'text-yellow-400'
  return 'text-red-400'
}
