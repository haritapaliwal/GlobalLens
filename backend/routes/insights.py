"""
insights.py — GET /api/insights/{iso_code}?persona=student
Returns only the LLM insight for a country + persona.
"""
from typing import Optional
from fastapi import APIRouter, Query, Request, HTTPException
from routes.country import ISO_TO_NAME
from services import news_service, sentiment_service, llm_service

router = APIRouter()


@router.get("/insights/{iso_code}")
async def get_insights(
    request: Request,
    iso_code: str,
    persona: Optional[str] = Query("student"),
):
    iso_code = iso_code.upper()
    persona = (persona or "student").lower()

    country_name = ISO_TO_NAME.get(iso_code)
    if not country_name:
        raise HTTPException(status_code=404, detail=f"Country code '{iso_code}' not found.")

    articles = await news_service.fetch(country_name, iso_code)
    texts = [f"{a.get('title', '')} {a.get('description', '')}".strip() for a in articles]
    sentiment = await sentiment_service.analyze(texts)
    insight = await llm_service.generate_insight(country_name, persona, articles, sentiment)

    return {
        "country": country_name,
        "iso_code": iso_code,
        "persona": persona,
        "insight": insight,
    }
