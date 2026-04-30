"""
country.py — GET /api/country/{iso_code}?persona=student
Full pipeline: news → reddit → sentiment → fake_news → insight → cache → DB
"""
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Query, Request, HTTPException
import redis.asyncio as aioredis

from config import REDIS_URL, CACHE_TTL
from services import news_service, reddit_service, sentiment_service, fake_news_service, llm_service

# ISO code → country name mapping (top 50 countries)
ISO_TO_NAME = {
    "AF": "Afghanistan", "AL": "Albania", "DZ": "Algeria", "AR": "Argentina",
    "AU": "Australia", "AT": "Austria", "BD": "Bangladesh", "BE": "Belgium",
    "BR": "Brazil", "CA": "Canada", "CL": "Chile", "CN": "China",
    "CO": "Colombia", "HR": "Croatia", "CZ": "Czech Republic", "DK": "Denmark",
    "EG": "Egypt", "ET": "Ethiopia", "FI": "Finland", "FR": "France",
    "DE": "Germany", "GH": "Ghana", "GR": "Greece", "HU": "Hungary",
    "IN": "India", "ID": "Indonesia", "IR": "Iran", "IQ": "Iraq",
    "IE": "Ireland", "IL": "Israel", "IT": "Italy", "JP": "Japan",
    "JO": "Jordan", "KE": "Kenya", "KR": "South Korea", "MX": "Mexico",
    "MA": "Morocco", "NL": "Netherlands", "NZ": "New Zealand", "NG": "Nigeria",
    "NO": "Norway", "PK": "Pakistan", "PE": "Peru", "PH": "Philippines",
    "PL": "Poland", "PT": "Portugal", "RO": "Romania", "RU": "Russia",
    "SA": "Saudi Arabia", "ZA": "South Africa", "ES": "Spain", "SE": "Sweden",
    "CH": "Switzerland", "TH": "Thailand", "TR": "Turkey", "UA": "Ukraine",
    "GB": "United Kingdom", "US": "United States", "VN": "Vietnam",
}

router = APIRouter()
_redis_client = None


async def get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = await aioredis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


@router.get("/country/{iso_code}")
async def get_country(
    request: Request,
    iso_code: str,
    persona: Optional[str] = Query("student"),
):
    iso_code = iso_code.upper()
    persona = (persona or "student").lower()

    country_name = ISO_TO_NAME.get(iso_code)
    if not country_name:
        raise HTTPException(status_code=404, detail=f"Country code '{iso_code}' not found.")

    cache_key = f"country:{iso_code}:{persona}"

    # ── 1. Redis cache check ─────────────────────────────────────────────────
    try:
        redis = await get_redis()
        cached = await redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception as e:
        print(f"[country] Redis get error: {e}")

    # ── 2. Full data pipeline ────────────────────────────────────────────────
    articles = await news_service.fetch(country_name, iso_code)
    reddit_posts = reddit_service.fetch(country_name)

    # Merge all text for sentiment analysis
    texts = []
    for a in articles:
        texts.append(f"{a.get('title', '')} {a.get('description', '')}".strip())
    for r in reddit_posts:
        texts.append(r.get("text", ""))

    sentiment = await sentiment_service.analyze(texts)
    scored_articles = fake_news_service.score(articles)
    insight = await llm_service.generate_insight(country_name, persona, articles, sentiment)

    result = {
        "country": country_name,
        "iso_code": iso_code,
        "persona": persona,
        "sentiment": sentiment,
        "insight": insight,
        "articles": scored_articles,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }

    # ── 3. Store in MongoDB ──────────────────────────────────────────────────
    try:
        db = request.app.state.db
        doc = {**result, "timestamp": datetime.now(timezone.utc)}
        await db.country_snapshots.insert_one(doc)
    except Exception as e:
        print(f"[country] MongoDB write error: {e}")

    # ── 4. Cache in Redis ────────────────────────────────────────────────────
    try:
        redis = await get_redis()
        await redis.setex(cache_key, CACHE_TTL, json.dumps(result, default=str))
    except Exception as e:
        print(f"[country] Redis set error: {e}")

    return result
