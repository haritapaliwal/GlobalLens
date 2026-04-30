"""
country_model.py — Pydantic models for the country API response.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TopicScores(BaseModel):
    safety: float = 0.0
    economy: float = 0.0
    education: float = 0.0
    immigration: float = 0.0


class SentimentScore(BaseModel):
    overall_score: float = 0.0
    topic_scores: TopicScores = Field(default_factory=TopicScores)
    dominant_sentiment: str = "neutral"
    key_themes: List[str] = Field(default_factory=list)


class InsightResult(BaseModel):
    summary: str = ""
    opportunities: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    recommendation: str = "Proceed with Caution"
    recommendation_reason: str = ""


class ArticleResult(BaseModel):
    title: str
    description: Optional[str] = ""
    url: str
    source: str
    publishedAt: Optional[str] = ""
    confidence: Optional[str] = "Medium"


class CountryResponse(BaseModel):
    country: str
    iso_code: str
    persona: str
    sentiment: SentimentScore
    insight: InsightResult
    articles: List[ArticleResult]
    last_updated: datetime
