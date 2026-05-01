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
    
    # NewsAPI supported countries for 'country' param
    SUPPORTED_ISO = {
        "ae", "ar", "at", "au", "be", "bg", "br", "ca", "ch", "cn", "co", "cu", "cz", "de", "eg", 
        "fr", "gb", "gr", "hk", "hu", "id", "ie", "il", "in", "it", "jp", "kr", "lt", "lv", "ma", 
        "mx", "my", "ng", "nl", "no", "nz", "ph", "pl", "pt", "ro", "rs", "ru", "sa", "se", "sg", 
        "si", "sk", "th", "tr", "tw", "ua", "us", "ve", "za"
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        # ── NewsAPI ──────────────────────────────────────────────────────────
        try:
            params = { "apiKey": NEWSAPI_KEY, "pageSize": 10 }
            
            # Use top-headlines if country is supported, otherwise search everything
            if iso_code.lower() in SUPPORTED_ISO:
                url = "https://newsapi.org/v2/top-headlines"
                params["country"] = iso_code.lower()
            else:
                url = "https://newsapi.org/v2/everything"
                params["q"] = country_name
                params["language"] = "en"
                params["sortBy"] = "relevancy"

            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                for a in data.get("articles", []):
                    u = a.get("url", "")
                    if u and u not in seen_urls:
                        seen_urls.add(u)
                        articles.append({
                            "title": a.get("title") or "",
                            "description": a.get("description") or "",
                            "url": u,
                            "source": (a.get("source") or {}).get("name", "NewsAPI"),
                            "publishedAt": a.get("publishedAt") or "",
                        })
            else:
                print(f"[news_service] NewsAPI Error {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[news_service] NewsAPI exception: {e}")

        # ── GNews ────────────────────────────────────────────────────────────
        try:
            resp = await client.get(
                "https://gnews.io/api/v4/search",
                params={
                    "q": country_name,
                    "lang": "en",
                    "max": 5,
                    "apikey": GNEWS_KEY,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                for a in data.get("articles", []):
                    u = a.get("url", "")
                    if u and u not in seen_urls:
                        seen_urls.add(u)
                        articles.append({
                            "title": a.get("title") or "",
                            "description": a.get("description") or "",
                            "url": u,
                            "source": (a.get("source") or {}).get("name", "GNews"),
                            "publishedAt": a.get("publishedAt") or "",
                        })
            else:
                print(f"[news_service] GNews Error {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[news_service] GNews exception: {e}")

    return articles
