export interface AuthStatus {
  authenticated: boolean
  channel_id?: string
  channel_title?: string
  auth_url?: string
}

export interface ChannelOverview {
  channel_id: string
  title: string
  description: string
  custom_url: string
  country: string
  published_at: string
  thumbnail: string
  subscriber_count: number
  video_count: number
  view_count: number
}

export interface VideoSummary {
  id: string
  title: string
  description: string
  published_at: string
  thumbnail_url: string
  duration: string
  tags: string[]
}

export interface VideoMetrics {
  video_id: string
  title: string
  published_at: string
  thumbnail_url: string
  views: number
  watch_time_minutes: number
  average_view_duration_seconds: number
  average_view_percentage: number
  likes: number
  dislikes: number
  comments: number
  shares: number
  impressions: number
  ctr: number
  subscribers_gained: number
  subscribers_lost: number
  net_subscribers: number
  engagement_rate: number
  performance_score: number
}

export interface RetentionData {
  video_id: string
  title: string
  elapsed_video_time_ratio: number[]
  audience_watch_ratio: number[]
  relative_retention_performance: number[]
}

export interface TrafficSource {
  source_type: string
  source_label: string
  views: number
  watch_time_minutes: number
  percentage: number
}

export interface VideoTraffic {
  video_id: string
  title: string
  sources: TrafficSource[]
}

export interface PatternAnalysis {
  category: string
  insight: string
  confidence: number
  examples: string[]
  recommendation: string
}

export interface AIInsights {
  generated_at: string
  channel_summary: string
  top_patterns: PatternAnalysis[]
  title_patterns: string[]
  thumbnail_recommendations: string[]
  content_recommendations: string[]
  next_video_suggestions: string[]
}

export interface VideoComparison {
  videos: VideoMetrics[]
  top_by_views: string[]
  top_by_ctr: string[]
  top_by_retention: string[]
  top_by_engagement: string[]
  success_patterns: string[]
}
