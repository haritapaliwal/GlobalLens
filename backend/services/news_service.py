"""
news_service.py — Fetches live news from NewsAPI + GNews, merges & deduplicates.
"""
import httpx
from typing import List, Dict
from config import NEWSAPI_KEY, GNEWS_KEY


async def fetch(country_name: str, iso_code: str) -> List[Dict]:
    """Fetch articles from NewsAPI and GNews concurrently, deduplicate by URL."""
    articles: List[Dict] = []
    seen_urls: set = set()

    async with httpx.AsyncClient(timeout=15.0) as client:
        # ── NewsAPI ──────────────────────────────────────────────────────────
        try:
            resp = await client.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": country_name,
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": 10,
                    "apiKey": NEWSAPI_KEY,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                for a in data.get("articles", []):
                    url = a.get("url", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        articles.append(
                            {
                                "title": a.get("title") or "",
                                "description": a.get("description") or "",
                                "url": url,
                                "source": (a.get("source") or {}).get("name", "NewsAPI"),
                                "publishedAt": a.get("publishedAt") or "",
                            }
                        )
        except Exception as e:
            print(f"[news_service] NewsAPI error: {e}")

        # ── GNews ────────────────────────────────────────────────────────────
        try:
            resp = await client.get(
                "https://gnews.io/api/v4/search",
                params={
                    "q": country_name,
                    "lang": "en",
                    "max": 10,
                    "apikey": GNEWS_KEY,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                for a in data.get("articles", []):
                    url = a.get("url", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        articles.append(
                            {
                                "title": a.get("title") or "",
                                "description": a.get("description") or "",
                                "url": url,
                                "source": (a.get("source") or {}).get(
                                    "name", "GNews"
                                ),
                                "publishedAt": a.get("publishedAt") or "",
                            }
                        )
        except Exception as e:
            print(f"[news_service] GNews error: {e}")

    return articles
