"""
country.py — GET /api/country/{iso_code}?persona=student
Full pipeline: news → reddit → sentiment → fake_news → insight → cache → DB
"""
import json
from datetime import datetime, timezone
from typing import Optional, Dict, List
import asyncio

from fastapi import APIRouter, Query, Request, HTTPException
import redis.asyncio as aioredis

from config import REDIS_URL, CACHE_TTL
from services import news_service, reddit_service, sentiment_service, fake_news_service, llm_service, economic_service

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
_local_cache = {} # Fallback memory cache

class MockRedis:
    """Fallback if local redis is not running."""
    async def get(self, key): return _local_cache.get(key)
    async def setex(self, key, ttl, val): _local_cache[key] = val
    async def keys(self, pattern):
        import fnmatch
        return [k for k in _local_cache.keys() if fnmatch.fnmatch(k, pattern)]

async def get_redis():
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = await aioredis.from_url(
                REDIS_URL, decode_responses=True, socket_connect_timeout=1
            )
            # Test connection
            await _redis_client.ping()
        except Exception:
            print("[Redis] Local server not found. Switching to In-Memory Safety Cache.")
            _redis_client = MockRedis()
    return _redis_client

@router.get("/map-scores")
async def get_map_scores(persona: str = "student"):
    """Returns overall sentiment scores for all cached countries."""
    scores = {}
    redis = await get_redis()
    try:
        keys = await redis.keys(f"country:{persona}:*")
        for k in keys:
            key_str = k.decode() if isinstance(k, bytes) else k
            data = await redis.get(key_str)
            if data:
                parsed = json.loads(data)
                iso = key_str.split(":")[-1]
                scores[iso] = parsed.get("sentiment", {}).get("overall_score", 0)
    except Exception as e:
        print(f"[map-scores] Error: {e}")
    return scores

async def get_country_data(iso_code: str, persona: str, db = None) -> Optional[Dict]:
    """Core intelligence pipeline logic, reusable for routes and background tasks."""
    iso_code = iso_code.upper()
    persona = persona.lower()
    
    country_name = ISO_TO_NAME.get(iso_code)
    if not country_name:
        return None

    cache_key = f"country:{persona}:{iso_code}"

    # ── 1. Redis cache check ─────────────────────────────────────────────────
    try:
        redis = await get_redis()
        cached = await redis.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception as e:
        print(f"[get_country_data] Redis check error: {e}")

    # ── 2. Full data pipeline (Parallelized) ─────────────────────────────────
    news_task = news_service.fetch(country_name, iso_code)
    reddit_task = asyncio.to_thread(reddit_service.fetch, country_name)
    economic_task = economic_service.fetch_economic_data(iso_code, country_name)

    articles, reddit_posts, economic_data = await asyncio.gather(
        news_task, reddit_task, economic_task
    )

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
        "economic_data": economic_data,
        "insight": insight,
        "articles": scored_articles,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }

    # ── 3. Store in MongoDB ──────────────────────────────────────────────────
    try:
        if db is not None:
            doc = {**result, "timestamp": datetime.now(timezone.utc)}
            await db.country_snapshots.insert_one(doc)
    except Exception as e:
        print(f"[get_country_data] MongoDB write error: {e}")

    # ── 4. Cache in Redis ────────────────────────────────────────────────────
    try:
        await redis.setex(cache_key, CACHE_TTL, json.dumps(result, default=str))
    except Exception as e:
        print(f"[get_country_data] Redis cache error: {e}")

    return result

@router.get("/country/{iso_code}")
async def get_country(
    request: Request,
    iso_code: str,
    persona: Optional[str] = Query("student"),
):
    """Web route for country intelligence."""
    db = request.app.state.db
    data = await get_country_data(iso_code, persona or "student", db)
    if not data:
        raise HTTPException(status_code=404, detail="Country not found.")
    return data
