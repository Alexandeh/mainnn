from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class VideoSummary(BaseModel):
    id: str
    title: str
    description: str
    published_at: str
    thumbnail_url: str
    duration: str
    tags: List[str] = []


class VideoMetrics(BaseModel):
    video_id: str
    title: str
    published_at: str
    thumbnail_url: str
    # Core metrics
    views: int = 0
    watch_time_minutes: float = 0
    average_view_duration_seconds: float = 0
    average_view_percentage: float = 0
    # Engagement
    likes: int = 0
    dislikes: int = 0
    comments: int = 0
    shares: int = 0
    # CTR
    impressions: int = 0
    ctr: float = 0  # click-through rate %
    # Channel growth
    subscribers_gained: int = 0
    subscribers_lost: int = 0
    net_subscribers: int = 0
    # Computed scores
    engagement_rate: float = 0
    performance_score: float = 0


class RetentionData(BaseModel):
    video_id: str
    title: str
    elapsed_video_time_ratio: List[float] = []
    audience_watch_ratio: List[float] = []
    relative_retention_performance: List[float] = []


class TrafficSource(BaseModel):
    source_type: str
    source_label: str
    views: int
    watch_time_minutes: float
    percentage: float


class VideoTraffic(BaseModel):
    video_id: str
    title: str
    sources: List[TrafficSource] = []


class ChannelOverview(BaseModel):
    channel_id: str
    title: str
    subscriber_count: int
    video_count: int
    view_count: int
    total_videos_analyzed: int
    avg_views: float
    avg_ctr: float
    avg_retention: float
    top_performing_video: Optional[str] = None


class PatternAnalysis(BaseModel):
    category: str
    insight: str
    confidence: float
    examples: List[str] = []
    recommendation: str


class AIInsights(BaseModel):
    generated_at: str
    channel_summary: str
    top_patterns: List[PatternAnalysis] = []
    title_patterns: List[str] = []
    thumbnail_recommendations: List[str] = []
    content_recommendations: List[str] = []
    next_video_suggestions: List[str] = []


class VideoComparison(BaseModel):
    videos: List[VideoMetrics]
    top_by_views: List[str]
    top_by_ctr: List[str]
    top_by_retention: List[str]
    top_by_engagement: List[str]
    success_patterns: List[str]


class AuthStatus(BaseModel):
    authenticated: bool
    channel_id: Optional[str] = None
    channel_title: Optional[str] = None
    auth_url: Optional[str] = None
