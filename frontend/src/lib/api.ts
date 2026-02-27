import axios from 'axios'
import type {
  AuthStatus, ChannelOverview, VideoSummary, VideoMetrics,
  RetentionData, VideoTraffic, AIInsights, VideoComparison
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

// Auth
export const getAuthStatus = () => api.get<AuthStatus>('/auth/status').then(r => r.data)
export const logout = () => api.post('/auth/logout').then(r => r.data)
export const clearCache = () => api.delete('/cache').then(r => r.data)

// Channel
export const getChannelOverview = () => api.get<ChannelOverview>('/channel/overview').then(r => r.data)

// Videos
export const getVideos = (maxVideos = 50) =>
  api.get<VideoSummary[]>('/videos', { params: { max_videos: maxVideos } }).then(r => r.data)

export const getVideoMetrics = (maxVideos = 50, startDate?: string, endDate?: string) =>
  api.get<VideoMetrics[]>('/videos/metrics', {
    params: { max_videos: maxVideos, start_date: startDate, end_date: endDate }
  }).then(r => r.data)

export const getVideoRetention = (videoId: string) =>
  api.get<RetentionData>(`/videos/${videoId}/retention`).then(r => r.data)

export const getVideoTraffic = (videoId: string, startDate?: string, endDate?: string) =>
  api.get<VideoTraffic>(`/videos/${videoId}/traffic`, {
    params: { start_date: startDate, end_date: endDate }
  }).then(r => r.data)

// Analysis
export const getComparison = (maxVideos = 50) =>
  api.get<VideoComparison>('/videos/comparison', { params: { max_videos: maxVideos } }).then(r => r.data)

export const getAIInsights = (maxVideos = 50, useAI = true) =>
  api.get<AIInsights>('/insights', { params: { max_videos: maxVideos, use_ai: useAI } }).then(r => r.data)

export const getHealth = () => api.get('/health').then(r => r.data)
