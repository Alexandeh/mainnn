"""
YouTube Analytics Dashboard - FastAPI Backend
API principal con todos los endpoints para el dashboard.
"""
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from typing import Optional, List
import asyncio
from datetime import datetime, timedelta

from app.config import settings
from app.auth import (
    get_auth_url,
    exchange_code_for_token,
    get_credentials,
    is_authenticated,
)
from app.models import (
    AuthStatus, VideoMetrics, VideoSummary, RetentionData,
    VideoTraffic, ChannelOverview, AIInsights, VideoComparison
)
from app.youtube_service import (
    get_channel_overview, get_all_videos, build_video_metrics_list,
    get_audience_retention, get_traffic_sources, get_my_channel_id as svc_get_channel_id,
)
from app.ai_insights import generate_insights_with_openai, generate_insights_locally

app = FastAPI(
    title="YouTube Analytics Dashboard API",
    description="API para analizar métricas del canal @AIrtVids",
    version="1.0.0",
)

# CORS para React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache simple en memoria
_cache: dict = {}
CACHE_TTL = 1800  # 30 minutos


def cache_get(key: str):
    if key in _cache:
        data, ts = _cache[key]
        if (datetime.now() - ts).seconds < CACHE_TTL:
            return data
        del _cache[key]
    return None


def cache_set(key: str, data):
    _cache[key] = (data, datetime.now())


# ─── Auth endpoints ────────────────────────────────────────────────────────────

@app.get("/auth/status", response_model=AuthStatus, tags=["Auth"])
async def auth_status():
    """Verifica el estado de autenticación con Google/YouTube."""
    if not settings.google_client_id or not settings.google_client_secret:
        return AuthStatus(
            authenticated=False,
            auth_url=None,
        )

    if is_authenticated():
        channel_id = svc_get_channel_id()
        channel_info = get_channel_overview(channel_id) if channel_id else None
        title = channel_info["snippet"]["title"] if channel_info else None
        return AuthStatus(
            authenticated=True,
            channel_id=channel_id,
            channel_title=title,
        )

    auth_url = get_auth_url()
    return AuthStatus(authenticated=False, auth_url=auth_url)


@app.get("/auth/login", tags=["Auth"])
async def auth_login():
    """Redirige al usuario a la página de autenticación de Google."""
    if not settings.google_client_id:
        raise HTTPException(
            status_code=400,
            detail="Configura GOOGLE_CLIENT_ID en el archivo .env"
        )
    auth_url = get_auth_url()
    return RedirectResponse(url=auth_url)


@app.get("/auth/callback", tags=["Auth"])
async def auth_callback(code: str, state: Optional[str] = None):
    """Callback de OAuth2 — intercambia el código por tokens."""
    try:
        result = exchange_code_for_token(code)
        # Redirigir al frontend tras auth exitosa
        return RedirectResponse(url="http://localhost:3000?auth=success")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en autenticación: {str(e)}")


@app.post("/auth/logout", tags=["Auth"])
async def auth_logout():
    """Elimina los tokens guardados."""
    import os
    from app.config import TOKEN_FILE
    if os.path.exists(TOKEN_FILE):
        os.remove(TOKEN_FILE)
    return {"status": "logged_out"}


# ─── Channel endpoints ─────────────────────────────────────────────────────────

@app.get("/channel/overview", tags=["Channel"])
async def channel_overview():
    """Información general del canal autenticado."""
    cached = cache_get("channel_overview")
    if cached:
        return cached

    creds = get_credentials()
    if not creds:
        raise HTTPException(status_code=401, detail="No autenticado. Ve a /auth/login")

    channel_id = svc_get_channel_id()
    if not channel_id:
        raise HTTPException(status_code=404, detail="No se encontró el canal")

    channel_data = get_channel_overview(channel_id)
    if not channel_data:
        raise HTTPException(status_code=404, detail="No se pudo obtener datos del canal")

    stats = channel_data.get("statistics", {})
    snippet = channel_data.get("snippet", {})
    thumbnails = snippet.get("thumbnails", {})

    result = {
        "channel_id": channel_data["id"],
        "title": snippet.get("title", ""),
        "description": snippet.get("description", ""),
        "custom_url": snippet.get("customUrl", ""),
        "country": snippet.get("country", ""),
        "published_at": snippet.get("publishedAt", ""),
        "thumbnail": thumbnails.get("high", {}).get("url", ""),
        "subscriber_count": int(stats.get("subscriberCount", 0)),
        "video_count": int(stats.get("videoCount", 0)),
        "view_count": int(stats.get("viewCount", 0)),
    }

    cache_set("channel_overview", result)
    return result


# ─── Videos endpoints ──────────────────────────────────────────────────────────

@app.get("/videos", response_model=List[VideoSummary], tags=["Videos"])
async def list_videos(
    max_videos: int = Query(default=50, ge=1, le=200, description="Máximo de videos a traer"),
):
    """Lista todos los videos del canal con sus metadatos básicos."""
    cache_key = f"videos_{max_videos}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    creds = get_credentials()
    if not creds:
        raise HTTPException(status_code=401, detail="No autenticado")

    channel_id = svc_get_channel_id()
    if not channel_id:
        raise HTTPException(status_code=404, detail="Canal no encontrado")

    videos = get_all_videos(channel_id, max_videos=max_videos)
    cache_set(cache_key, videos)
    return videos


@app.get("/videos/metrics", response_model=List[VideoMetrics], tags=["Videos"])
async def videos_metrics(
    max_videos: int = Query(default=50, ge=1, le=100),
    start_date: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
):
    """
    Obtiene métricas completas de todos los videos:
    views, CTR, retención, engagement, suscriptores, etc.
    """
    if not start_date:
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    cache_key = f"metrics_{max_videos}_{start_date}_{end_date}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    creds = get_credentials()
    if not creds:
        raise HTTPException(status_code=401, detail="No autenticado")

    channel_id = svc_get_channel_id()
    if not channel_id:
        raise HTTPException(status_code=404, detail="Canal no encontrado")

    metrics = build_video_metrics_list(
        channel_id, start_date=start_date, end_date=end_date, max_videos=max_videos
    )
    cache_set(cache_key, metrics)
    return metrics


@app.get("/videos/{video_id}/retention", response_model=RetentionData, tags=["Videos"])
async def video_retention(video_id: str):
    """Curva de retención de audiencia para un video específico."""
    cache_key = f"retention_{video_id}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    creds = get_credentials()
    if not creds:
        raise HTTPException(status_code=401, detail="No autenticado")

    retention = get_audience_retention(video_id)
    if not retention:
        raise HTTPException(status_code=404, detail=f"No se encontraron datos de retención para {video_id}")

    cache_set(cache_key, retention)
    return retention


@app.get("/videos/{video_id}/traffic", response_model=VideoTraffic, tags=["Videos"])
async def video_traffic(
    video_id: str,
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
):
    """Fuentes de tráfico para un video específico."""
    cache_key = f"traffic_{video_id}_{start_date}_{end_date}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    creds = get_credentials()
    if not creds:
        raise HTTPException(status_code=401, detail="No autenticado")

    channel_id = svc_get_channel_id()
    if not channel_id:
        raise HTTPException(status_code=404, detail="Canal no encontrado")

    traffic = get_traffic_sources(channel_id, video_id, start_date, end_date)
    cache_set(cache_key, traffic)
    return traffic


# ─── Comparison & Analysis ─────────────────────────────────────────────────────

@app.get("/videos/comparison", response_model=VideoComparison, tags=["Analysis"])
async def videos_comparison(
    max_videos: int = Query(default=50, ge=5, le=100),
):
    """Comparación entre todos los videos con rankings por métrica."""
    cache_key = f"comparison_{max_videos}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    creds = get_credentials()
    if not creds:
        raise HTTPException(status_code=401, detail="No autenticado")

    channel_id = svc_get_channel_id()
    if not channel_id:
        raise HTTPException(status_code=404, detail="Canal no encontrado")

    metrics = build_video_metrics_list(channel_id, max_videos=max_videos)

    sorted_views = sorted(metrics, key=lambda v: v.views, reverse=True)
    sorted_ctr = sorted([v for v in metrics if v.ctr > 0], key=lambda v: v.ctr, reverse=True)
    sorted_ret = sorted([v for v in metrics if v.average_view_percentage > 0], key=lambda v: v.average_view_percentage, reverse=True)
    sorted_eng = sorted([v for v in metrics if v.engagement_rate > 0], key=lambda v: v.engagement_rate, reverse=True)

    # Detectar patrones de éxito
    top_5 = sorted_views[:5]
    patterns = []
    if top_5:
        avg_ctr_top = sum(v.ctr for v in top_5) / len(top_5)
        avg_ret_top = sum(v.average_view_percentage for v in top_5) / len(top_5)
        patterns.append(f"Top 5 videos: CTR promedio {avg_ctr_top:.1f}%, retención {avg_ret_top:.1f}%")

    comparison = VideoComparison(
        videos=metrics,
        top_by_views=[v.title[:60] for v in sorted_views[:10]],
        top_by_ctr=[f"{v.title[:50]} ({v.ctr:.1f}%)" for v in sorted_ctr[:10]],
        top_by_retention=[f"{v.title[:50]} ({v.average_view_percentage:.1f}%)" for v in sorted_ret[:10]],
        top_by_engagement=[f"{v.title[:50]} ({v.engagement_rate:.2f}%)" for v in sorted_eng[:10]],
        success_patterns=patterns,
    )
    cache_set(cache_key, comparison)
    return comparison


@app.get("/insights", response_model=AIInsights, tags=["Analysis"])
async def get_ai_insights(
    max_videos: int = Query(default=50, ge=5, le=100),
    use_ai: bool = Query(default=True, description="Usar OpenAI si está disponible"),
):
    """
    Genera insights de IA sobre los patrones del canal.
    Analiza qué hace exitosos a tus mejores videos.
    """
    cache_key = f"insights_{max_videos}_{use_ai}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    creds = get_credentials()
    if not creds:
        raise HTTPException(status_code=401, detail="No autenticado")

    channel_id = svc_get_channel_id()
    if not channel_id:
        raise HTTPException(status_code=404, detail="Canal no encontrado")

    metrics = build_video_metrics_list(channel_id, max_videos=max_videos)

    if use_ai and settings.openai_api_key:
        insights = await generate_insights_with_openai(metrics)
    else:
        insights = generate_insights_locally(metrics)

    cache_set(cache_key, insights)
    return insights


@app.delete("/cache", tags=["Admin"])
async def clear_cache():
    """Limpia el cache de datos (útil cuando quieres datos frescos)."""
    _cache.clear()
    return {"status": "cache cleared"}


@app.get("/health", tags=["Admin"])
async def health():
    return {
        "status": "ok",
        "authenticated": is_authenticated(),
        "has_google_credentials": bool(settings.google_client_id),
        "has_openai": bool(settings.openai_api_key),
        "version": "1.0.0",
    }
