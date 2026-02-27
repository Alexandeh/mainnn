"""
Sistema de auto-mejora con IA: analiza patrones en los videos exitosos
y genera recomendaciones accionables para el canal.
"""
import json
import re
from typing import List, Optional, Dict
from datetime import datetime
from app.models import VideoMetrics, PatternAnalysis, AIInsights
from app.config import settings


def analyze_title_patterns(videos: List[VideoMetrics]) -> List[str]:
    """Analiza patrones en títulos de videos exitosos vs no exitosos."""
    if len(videos) < 3:
        return []

    sorted_by_views = sorted(videos, key=lambda v: v.views, reverse=True)
    top_20_pct = sorted_by_views[:max(1, len(videos) // 5)]
    bottom_20_pct = sorted_by_views[-(max(1, len(videos) // 5)):]

    patterns = []

    # Análisis de longitud de títulos
    top_avg_len = sum(len(v.title) for v in top_20_pct) / len(top_20_pct)
    bottom_avg_len = sum(len(v.title) for v in bottom_20_pct) / len(bottom_20_pct)
    if abs(top_avg_len - bottom_avg_len) > 10:
        if top_avg_len > bottom_avg_len:
            patterns.append(f"Títulos más largos (~{int(top_avg_len)} chars) generan más views. Evita títulos cortos (<{int(bottom_avg_len)} chars)")
        else:
            patterns.append(f"Títulos concisos (~{int(top_avg_len)} chars) funcionan mejor. Evita títulos demasiado largos")

    # Análisis de palabras clave en títulos top
    top_words: Dict[str, int] = {}
    for v in top_20_pct:
        for word in v.title.lower().split():
            word = re.sub(r'[^a-záéíóúüñ0-9]', '', word)
            if len(word) > 3:
                top_words[word] = top_words.get(word, 0) + 1

    bottom_words: Dict[str, int] = {}
    for v in bottom_20_pct:
        for word in v.title.lower().split():
            word = re.sub(r'[^a-záéíóúüñ0-9]', '', word)
            if len(word) > 3:
                bottom_words[word] = bottom_words.get(word, 0) + 1

    # Palabras que aparecen más en top que en bottom
    power_words = []
    for word, count in top_words.items():
        bottom_count = bottom_words.get(word, 0)
        if count >= 2 and count > bottom_count:
            power_words.append(word)

    if power_words:
        patterns.append(f"Palabras clave que aparecen en tus mejores videos: {', '.join(power_words[:5])}")

    # Detectar si usan números
    top_with_numbers = sum(1 for v in top_20_pct if any(c.isdigit() for c in v.title))
    if top_with_numbers / len(top_20_pct) > 0.5:
        patterns.append("Tus videos más exitosos incluyen números en el título (ej: '5 formas de...', '2024')")

    # Detectar preguntas
    top_questions = sum(1 for v in top_20_pct if '?' in v.title)
    if top_questions / len(top_20_pct) > 0.3:
        patterns.append("Los títulos en forma de pregunta tienen mejor rendimiento en tu canal")

    return patterns


def analyze_engagement_patterns(videos: List[VideoMetrics]) -> List[PatternAnalysis]:
    """Detecta patrones de engagement entre videos exitosos."""
    if len(videos) < 5:
        return []

    patterns = []
    sorted_by_eng = sorted(videos, key=lambda v: v.engagement_rate, reverse=True)
    top_eng = sorted_by_eng[:max(2, len(videos) // 4)]
    low_eng = sorted_by_eng[-(max(2, len(videos) // 4)):]

    avg_top_eng = sum(v.engagement_rate for v in top_eng) / len(top_eng)
    avg_low_eng = sum(v.engagement_rate for v in low_eng) / len(low_eng)

    if avg_top_eng > 0:
        patterns.append(PatternAnalysis(
            category="Engagement",
            insight=f"Tus mejores videos tienen {avg_top_eng:.1f}% de engagement vs {avg_low_eng:.1f}% de los peores",
            confidence=0.9,
            examples=[v.title[:50] for v in top_eng[:3]],
            recommendation=f"Analiza los primeros 30 segundos de {top_eng[0].title[:40]} — ese hook está funcionando bien",
        ))

    # CTR analysis
    videos_with_ctr = [v for v in videos if v.ctr > 0]
    if videos_with_ctr:
        sorted_by_ctr = sorted(videos_with_ctr, key=lambda v: v.ctr, reverse=True)
        top_ctr = sorted_by_ctr[:max(2, len(sorted_by_ctr) // 4)]
        avg_ctr = sum(v.ctr for v in videos_with_ctr) / len(videos_with_ctr)
        best_ctr = top_ctr[0].ctr if top_ctr else 0

        if best_ctr > avg_ctr * 1.5:
            patterns.append(PatternAnalysis(
                category="CTR",
                insight=f"CTR promedio del canal: {avg_ctr:.1f}%. Tu mejor CTR: {best_ctr:.1f}% en '{top_ctr[0].title[:40]}'",
                confidence=0.85,
                examples=[v.title[:50] for v in top_ctr[:3]],
                recommendation="Replika el estilo de thumbnail/título de tus videos con mayor CTR",
            ))

    # Retención
    videos_with_retention = [v for v in videos if v.average_view_percentage > 0]
    if videos_with_retention:
        sorted_by_ret = sorted(videos_with_retention, key=lambda v: v.average_view_percentage, reverse=True)
        top_ret = sorted_by_ret[:max(2, len(sorted_by_ret) // 4)]
        avg_ret = sum(v.average_view_percentage for v in videos_with_retention) / len(videos_with_retention)
        best_ret = top_ret[0].average_view_percentage if top_ret else 0

        if top_ret:
            patterns.append(PatternAnalysis(
                category="Retención",
                insight=f"Retención promedio: {avg_ret:.1f}%. Tu mejor retención: {best_ret:.1f}% en '{top_ret[0].title[:40]}'",
                confidence=0.9,
                examples=[f"{v.title[:40]} ({v.average_view_percentage:.1f}%)" for v in top_ret[:3]],
                recommendation=f"Duración óptima: ~{int(top_ret[0].average_view_duration_seconds // 60)}:{int(top_ret[0].average_view_duration_seconds % 60):02d} minutos para tu audiencia",
            ))

    return patterns


def analyze_growth_patterns(videos: List[VideoMetrics]) -> List[PatternAnalysis]:
    """Analiza qué videos generan más suscriptores."""
    patterns = []
    videos_with_subs = [v for v in videos if v.net_subscribers != 0]
    if not videos_with_subs:
        return []

    sorted_by_subs = sorted(videos_with_subs, key=lambda v: v.net_subscribers, reverse=True)
    top_subs = sorted_by_subs[:max(1, len(sorted_by_subs) // 4)]

    if top_subs:
        best = top_subs[0]
        conversion_rate = (best.net_subscribers / best.views * 100) if best.views > 0 else 0
        patterns.append(PatternAnalysis(
            category="Crecimiento",
            insight=f"'{best.title[:40]}' genera {conversion_rate:.2f}% de conversión a suscriptores",
            confidence=0.8,
            examples=[f"{v.title[:40]} (+{v.net_subscribers} subs)" for v in top_subs[:3]],
            recommendation="Identifica qué tema o formato convierte mejor y crea más contenido similar",
        ))

    return patterns


def generate_next_video_suggestions(videos: List[VideoMetrics]) -> List[str]:
    """Genera sugerencias para el próximo video basadas en los patrones."""
    if not videos:
        return []

    suggestions = []
    sorted_by_perf = sorted(videos, key=lambda v: v.performance_score, reverse=True)
    top_videos = sorted_by_perf[:min(5, len(sorted_by_perf))]

    for v in top_videos[:3]:
        suggestions.append(
            f"Crea una secuela o continuación de '{v.title[:50]}' "
            f"(score: {v.performance_score:.0f}, retención: {v.average_view_percentage:.0f}%)"
        )

    # Analizar qué tipo de contenido falta
    all_titles = " ".join(v.title.lower() for v in videos)
    if "tutorial" in all_titles or "cómo" in all_titles:
        suggestions.append("Considera hacer más tutoriales — formato que ya funciona en tu canal")

    suggestions.append(
        "Experimenta con Shorts para reutilizar los mejores momentos de tus videos con mayor retención"
    )

    return suggestions[:5]


def generate_insights_locally(videos: List[VideoMetrics]) -> AIInsights:
    """
    Genera insights sin necesidad de API de IA externa.
    Análisis estadístico puro de los patrones del canal.
    """
    if not videos:
        return AIInsights(
            generated_at=datetime.now().isoformat(),
            channel_summary="No hay suficientes datos para analizar.",
            top_patterns=[],
            title_patterns=[],
            thumbnail_recommendations=[],
            content_recommendations=[],
            next_video_suggestions=[],
        )

    total_views = sum(v.views for v in videos)
    avg_views = total_views / len(videos)
    avg_retention = sum(v.average_view_percentage for v in videos if v.average_view_percentage > 0)
    videos_with_retention = sum(1 for v in videos if v.average_view_percentage > 0)
    avg_retention = avg_retention / videos_with_retention if videos_with_retention > 0 else 0
    avg_ctr = sum(v.ctr for v in videos if v.ctr > 0)
    videos_with_ctr = sum(1 for v in videos if v.ctr > 0)
    avg_ctr = avg_ctr / videos_with_ctr if videos_with_ctr > 0 else 0

    best_video = max(videos, key=lambda v: v.views) if videos else None

    channel_summary = (
        f"Canal analizado con {len(videos)} videos. "
        f"Total de views: {total_views:,}. "
        f"Promedio por video: {int(avg_views):,} views. "
        f"Retención media: {avg_retention:.1f}%. "
        f"CTR promedio: {avg_ctr:.1f}%. "
    )
    if best_video:
        channel_summary += f"Video estrella: '{best_video.title[:50]}' con {best_video.views:,} views."

    title_patterns = analyze_title_patterns(videos)
    engagement_patterns = analyze_engagement_patterns(videos)
    growth_patterns = analyze_growth_patterns(videos)
    all_patterns = engagement_patterns + growth_patterns

    thumbnail_recs = [
        "Usa fondos de alto contraste (negro/blanco) para destacar en feeds saturados",
        "Incluye tu cara con expresiones emocionales claras — aumenta CTR un 30% en promedio",
        "Texto en thumbnail: máximo 3-4 palabras, fuente bold, color amarillo/rojo sobre fondo oscuro",
        "Mantén consistencia visual de marca: mismo estilo de thumbnail para que el canal sea reconocible",
    ]

    content_recs = [
        f"Tus primeros 30 segundos son críticos — hook fuerte con la promesa del video",
        f"Retención promedio {avg_retention:.0f}%: si es >50% estás bien; si es <40% mejora la estructura",
        "Añade capítulos (timestamps) en la descripción para mejorar la retención y el SEO",
        "Publica consistentemente — el algoritmo premia la regularidad",
    ]

    if avg_ctr < 3:
        thumbnail_recs.insert(0, f"CTR de {avg_ctr:.1f}% es bajo. Tus thumbnails necesitan más impacto visual")
    elif avg_ctr > 5:
        thumbnail_recs.insert(0, f"CTR de {avg_ctr:.1f}% es excelente. Mantén el estilo actual de thumbnails")

    next_suggestions = generate_next_video_suggestions(videos)

    return AIInsights(
        generated_at=datetime.now().isoformat(),
        channel_summary=channel_summary,
        top_patterns=all_patterns,
        title_patterns=title_patterns,
        thumbnail_recommendations=thumbnail_recs,
        content_recommendations=content_recs,
        next_video_suggestions=next_suggestions,
    )


async def generate_insights_with_openai(videos: List[VideoMetrics]) -> AIInsights:
    """
    Genera insights usando OpenAI GPT para análisis más profundo.
    Solo se usa si hay OPENAI_API_KEY configurada.
    """
    if not settings.openai_api_key:
        return generate_insights_locally(videos)

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        # Preparar resumen de datos para GPT
        top_10 = sorted(videos, key=lambda v: v.performance_score, reverse=True)[:10]
        bottom_5 = sorted(videos, key=lambda v: v.performance_score)[:5]

        video_data = {
            "total_videos": len(videos),
            "top_performers": [
                {
                    "title": v.title,
                    "views": v.views,
                    "ctr": v.ctr,
                    "retention": v.average_view_percentage,
                    "engagement_rate": v.engagement_rate,
                    "net_subscribers": v.net_subscribers,
                }
                for v in top_10
            ],
            "low_performers": [
                {
                    "title": v.title,
                    "views": v.views,
                    "ctr": v.ctr,
                    "retention": v.average_view_percentage,
                }
                for v in bottom_5
            ],
        }

        prompt = f"""Eres un experto en YouTube Analytics. Analiza estos datos del canal y genera insights accionables en español.

Datos del canal:
{json.dumps(video_data, ensure_ascii=False, indent=2)}

Genera un análisis estructurado con:
1. Resumen general del canal (2-3 oraciones)
2. 3-5 patrones clave que distinguen los videos exitosos de los que no lo son
3. Patrones en títulos: qué estructura/palabras funcionan mejor
4. 3 recomendaciones concretas de thumbnails
5. 3 recomendaciones de contenido
6. 3 ideas para el próximo video basadas en los patrones

Responde en JSON con este formato exacto:
{{
  "channel_summary": "...",
  "title_patterns": ["...", "..."],
  "thumbnail_recommendations": ["...", "...", "..."],
  "content_recommendations": ["...", "...", "..."],
  "next_video_suggestions": ["...", "...", "..."],
  "top_patterns": [
    {{
      "category": "...",
      "insight": "...",
      "confidence": 0.9,
      "examples": ["...", "..."],
      "recommendation": "..."
    }}
  ]
}}"""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"},
        )

        data = json.loads(response.choices[0].message.content)

        patterns = [
            PatternAnalysis(**p) for p in data.get("top_patterns", [])
        ]

        return AIInsights(
            generated_at=datetime.now().isoformat(),
            channel_summary=data.get("channel_summary", ""),
            top_patterns=patterns,
            title_patterns=data.get("title_patterns", []),
            thumbnail_recommendations=data.get("thumbnail_recommendations", []),
            content_recommendations=data.get("content_recommendations", []),
            next_video_suggestions=data.get("next_video_suggestions", []),
        )

    except Exception as e:
        print(f"OpenAI error, usando análisis local: {e}")
        return generate_insights_locally(videos)
