"""
YouTube Data API v3 + YouTube Analytics API service layer.
Maneja todos los calls a las APIs de Google para obtener métricas del canal.
"""
import re
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from googleapiclient.errors import HttpError
from app.auth import get_credentials, get_youtube_service, get_analytics_service
from app.models import (
    VideoSummary, VideoMetrics, RetentionData,
    TrafficSource, VideoTraffic, ChannelOverview
)


def _parse_duration(duration: str) -> str:
    """Convierte ISO 8601 duration (PT4M30S) a formato legible (4:30)."""
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
    if not match:
        return "0:00"
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"


def get_channel_id_from_handle(handle: str) -> Optional[str]:
    """Obtiene el channel ID desde el handle (@AIrtVids)."""
    creds = get_credentials()
    if not creds:
        return None
    youtube = get_youtube_service(creds)
    handle_clean = handle.lstrip("@")
    try:
        response = youtube.search().list(
            part="snippet",
            q=handle_clean,
            type="channel",
            maxResults=1
        ).execute()
        items = response.get("items", [])
        if items:
            return items[0]["snippet"]["channelId"]
    except HttpError:
        pass
    return None


def get_my_channel_id() -> Optional[str]:
    """Obtiene el channel ID del canal autenticado."""
    creds = get_credentials()
    if not creds:
        return None
    youtube = get_youtube_service(creds)
    try:
        response = youtube.channels().list(
            part="id,snippet,statistics",
            mine=True
        ).execute()
        items = response.get("items", [])
        if items:
            return items[0]["id"]
    except HttpError:
        pass
    return None


def get_channel_overview(channel_id: Optional[str] = None) -> Optional[Dict]:
    """Obtiene información general del canal."""
    creds = get_credentials()
    if not creds:
        return None
    youtube = get_youtube_service(creds)
    try:
        params: dict = {"part": "id,snippet,statistics,contentDetails"}
        if channel_id:
            params["id"] = channel_id
        else:
            params["mine"] = True  # type: ignore
        response = youtube.channels().list(**params).execute()
        items = response.get("items", [])
        if items:
            return items[0]
    except HttpError as e:
        print(f"Error getting channel: {e}")
    return None


def get_all_videos(channel_id: str, max_videos: int = 200) -> List[VideoSummary]:
    """Obtiene todos los videos del canal con sus metadatos."""
    creds = get_credentials()
    if not creds:
        return []
    youtube = get_youtube_service(creds)

    video_ids = []
    next_page_token = None

    # Primero obtenemos los IDs de todos los videos
    try:
        while len(video_ids) < max_videos:
            params = {
                "part": "id",
                "channelId": channel_id,
                "maxResults": min(50, max_videos - len(video_ids)),
                "order": "date",
                "type": "video",
            }
            if next_page_token:
                params["pageToken"] = next_page_token

            response = youtube.search().list(**params).execute()
            items = response.get("items", [])
            video_ids.extend([item["id"]["videoId"] for item in items])

            next_page_token = response.get("nextPageToken")
            if not next_page_token:
                break
    except HttpError as e:
        print(f"Error listing videos: {e}")
        return []

    if not video_ids:
        return []

    # Ahora obtenemos detalles completos de los videos en batches de 50
    videos = []
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i+50]
        try:
            response = youtube.videos().list(
                part="id,snippet,contentDetails,statistics",
                id=",".join(batch)
            ).execute()
            for item in response.get("items", []):
                snippet = item.get("snippet", {})
                content = item.get("contentDetails", {})
                thumbnails = snippet.get("thumbnails", {})
                thumb_url = (
                    thumbnails.get("maxres", {}).get("url") or
                    thumbnails.get("high", {}).get("url") or
                    thumbnails.get("medium", {}).get("url") or
                    thumbnails.get("default", {}).get("url") or ""
                )
                videos.append(VideoSummary(
                    id=item["id"],
                    title=snippet.get("title", ""),
                    description=snippet.get("description", ""),
                    published_at=snippet.get("publishedAt", ""),
                    thumbnail_url=thumb_url,
                    duration=_parse_duration(content.get("duration", "PT0S")),
                    tags=snippet.get("tags", []),
                ))
        except HttpError as e:
            print(f"Error fetching video details batch: {e}")

    return videos


def get_video_analytics_bulk(
    channel_id: str,
    video_ids: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Dict]:
    """
    Obtiene métricas de analytics para múltiples videos.
    Usa YouTube Analytics API v2.
    """
    creds = get_credentials()
    if not creds:
        return {}
    analytics = get_analytics_service(creds)

    if not start_date:
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    results = {}

    # Analytics API soporta filtrar por video
    for video_id in video_ids:
        try:
            response = analytics.reports().query(
                ids=f"channel=={channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics=(
                    "views,estimatedMinutesWatched,averageViewDuration,"
                    "averageViewPercentage,likes,dislikes,comments,shares,"
                    "subscribersGained,subscribersLost,"
                    "annotationImpressions,cardImpressions"
                ),
                filters=f"video=={video_id}",
                dimensions="video",
            ).execute()

            rows = response.get("rows", [])
            if rows:
                row = rows[0]
                results[video_id] = {
                    "views": int(row[1]) if len(row) > 1 else 0,
                    "watch_time_minutes": float(row[2]) if len(row) > 2 else 0,
                    "average_view_duration_seconds": float(row[3]) if len(row) > 3 else 0,
                    "average_view_percentage": float(row[4]) if len(row) > 4 else 0,
                    "likes": int(row[5]) if len(row) > 5 else 0,
                    "dislikes": int(row[6]) if len(row) > 6 else 0,
                    "comments": int(row[7]) if len(row) > 7 else 0,
                    "shares": int(row[8]) if len(row) > 8 else 0,
                    "subscribers_gained": int(row[9]) if len(row) > 9 else 0,
                    "subscribers_lost": int(row[10]) if len(row) > 10 else 0,
                }
        except HttpError as e:
            print(f"Error analytics for {video_id}: {e}")
            results[video_id] = {}

    return results


def get_video_impressions_ctr(
    channel_id: str,
    video_ids: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Dict]:
    """Obtiene impresiones y CTR por video."""
    creds = get_credentials()
    if not creds:
        return {}
    analytics = get_analytics_service(creds)

    if not start_date:
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    results = {}
    for video_id in video_ids:
        try:
            response = analytics.reports().query(
                ids=f"channel=={channel_id}",
                startDate=start_date,
                endDate=end_date,
                metrics="impressions,impressionsClickThroughRate",
                filters=f"video=={video_id}",
                dimensions="video",
            ).execute()
            rows = response.get("rows", [])
            if rows:
                row = rows[0]
                results[video_id] = {
                    "impressions": int(row[1]) if len(row) > 1 else 0,
                    "ctr": float(row[2]) * 100 if len(row) > 2 else 0,
                }
        except HttpError as e:
            # CTR no siempre está disponible
            print(f"CTR not available for {video_id}: {e}")
            results[video_id] = {"impressions": 0, "ctr": 0}

    return results


def get_audience_retention(video_id: str) -> Optional[RetentionData]:
    """
    Obtiene curva de retención de audiencia para un video específico.
    Requiere YouTube Analytics API.
    """
    creds = get_credentials()
    if not creds:
        return None
    analytics = get_analytics_service(creds)
    youtube = get_youtube_service(creds)

    # Obtener channel_id
    channel_id = get_my_channel_id()
    if not channel_id:
        return None

    # Primero obtener el título del video
    title = video_id
    try:
        resp = youtube.videos().list(part="snippet", id=video_id).execute()
        items = resp.get("items", [])
        if items:
            title = items[0]["snippet"]["title"]
    except HttpError:
        pass

    try:
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        end_date = datetime.now().strftime("%Y-%m-%d")

        response = analytics.reports().query(
            ids=f"channel=={channel_id}",
            startDate=start_date,
            endDate=end_date,
            metrics="audienceWatchRatio,relativeRetentionPerformance",
            filters=f"video=={video_id}",
            dimensions="elapsedVideoTimeRatio",
        ).execute()

        rows = response.get("rows", [])
        if not rows:
            return RetentionData(
                video_id=video_id,
                title=title,
                elapsed_video_time_ratio=[],
                audience_watch_ratio=[],
                relative_retention_performance=[],
            )

        elapsed = [float(row[0]) for row in rows]
        watch_ratio = [float(row[1]) * 100 for row in rows]
        relative_perf = [float(row[2]) * 100 if len(row) > 2 else 0 for row in rows]

        return RetentionData(
            video_id=video_id,
            title=title,
            elapsed_video_time_ratio=elapsed,
            audience_watch_ratio=watch_ratio,
            relative_retention_performance=relative_perf,
        )
    except HttpError as e:
        print(f"Error getting retention for {video_id}: {e}")
        return None


def get_traffic_sources(
    channel_id: str,
    video_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> VideoTraffic:
    """Obtiene las fuentes de tráfico para un video."""
    creds = get_credentials()
    if not creds:
        return VideoTraffic(video_id=video_id, title=video_id, sources=[])
    analytics = get_analytics_service(creds)
    youtube = get_youtube_service(creds)

    if not start_date:
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    title = video_id
    try:
        resp = youtube.videos().list(part="snippet", id=video_id).execute()
        items = resp.get("items", [])
        if items:
            title = items[0]["snippet"]["title"]
    except HttpError:
        pass

    source_labels = {
        "YT_SEARCH": "Búsqueda YouTube",
        "YT_CHANNEL": "Página del canal",
        "BROWSE_FEATURES": "Inicio / Recomendados",
        "SUGGESTED_VIDEOS": "Videos sugeridos",
        "EXTERNAL": "Fuentes externas",
        "NOTIFICATION": "Notificaciones",
        "PLAYLIST": "Playlists",
        "YT_OTHER_PAGE": "Otras páginas YouTube",
        "NO_LINK_EMBEDDED": "Embebido (sin link)",
        "NO_LINK_OTHER": "Otros (sin link)",
        "DIRECT_OR_UNKNOWN": "Directo / Desconocido",
        "END_SCREEN": "Pantalla final",
        "CAMPAIGN_CARD": "Tarjetas",
        "VIDEO_REMIXED": "Shorts / Remix",
        "SHORTS": "YouTube Shorts",
        "HASHTAGS": "Hashtags",
    }

    sources = []
    total_views = 0

    try:
        response = analytics.reports().query(
            ids=f"channel=={channel_id}",
            startDate=start_date,
            endDate=end_date,
            metrics="views,estimatedMinutesWatched",
            filters=f"video=={video_id}",
            dimensions="insightTrafficSourceType",
            sort="-views",
        ).execute()

        rows = response.get("rows", [])
        for row in rows:
            total_views += int(row[1]) if len(row) > 1 else 0

        for row in rows:
            source_type = row[0]
            views = int(row[1]) if len(row) > 1 else 0
            watch_time = float(row[2]) if len(row) > 2 else 0
            pct = (views / total_views * 100) if total_views > 0 else 0
            sources.append(TrafficSource(
                source_type=source_type,
                source_label=source_labels.get(source_type, source_type),
                views=views,
                watch_time_minutes=watch_time,
                percentage=round(pct, 1),
            ))
    except HttpError as e:
        print(f"Error traffic sources for {video_id}: {e}")

    return VideoTraffic(video_id=video_id, title=title, sources=sources)


def build_video_metrics_list(
    channel_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    max_videos: int = 50,
) -> List[VideoMetrics]:
    """
    Pipeline principal: obtiene todos los videos y sus métricas completas.
    """
    # 1. Obtener lista de videos
    videos = get_all_videos(channel_id, max_videos=max_videos)
    if not videos:
        return []

    video_ids = [v.id for v in videos]
    video_map = {v.id: v for v in videos}

    # 2. Obtener analytics
    analytics_data = get_video_analytics_bulk(channel_id, video_ids, start_date, end_date)
    ctr_data = get_video_impressions_ctr(channel_id, video_ids, start_date, end_date)

    # 3. Combinar todo
    metrics_list = []
    for video in videos:
        ana = analytics_data.get(video.id, {})
        ctr = ctr_data.get(video.id, {})

        views = ana.get("views", 0)
        likes = ana.get("likes", 0)
        comments = ana.get("comments", 0)
        shares = ana.get("shares", 0)
        subs_gained = ana.get("subscribers_gained", 0)
        subs_lost = ana.get("subscribers_lost", 0)

        engagement_rate = 0.0
        if views > 0:
            engagement_rate = round((likes + comments + shares) / views * 100, 2)

        # Performance score: combinación normalizada de métricas clave
        avg_view_pct = ana.get("average_view_percentage", 0)
        ctr_val = ctr.get("ctr", 0)
        performance_score = round(
            (views / 1000) * 0.3 +
            avg_view_pct * 0.3 +
            ctr_val * 10 * 0.2 +
            engagement_rate * 5 * 0.2,
            2
        )

        metrics_list.append(VideoMetrics(
            video_id=video.id,
            title=video.title,
            published_at=video.published_at,
            thumbnail_url=video.thumbnail_url,
            views=views,
            watch_time_minutes=ana.get("watch_time_minutes", 0),
            average_view_duration_seconds=ana.get("average_view_duration_seconds", 0),
            average_view_percentage=avg_view_pct,
            likes=likes,
            dislikes=ana.get("dislikes", 0),
            comments=comments,
            shares=shares,
            impressions=ctr.get("impressions", 0),
            ctr=round(ctr_val, 2),
            subscribers_gained=subs_gained,
            subscribers_lost=subs_lost,
            net_subscribers=subs_gained - subs_lost,
            engagement_rate=engagement_rate,
            performance_score=performance_score,
        ))

    # Ordenar por performance score
    metrics_list.sort(key=lambda x: x.performance_score, reverse=True)
    return metrics_list
