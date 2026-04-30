"""
insight_model.py — Pydantic model for LLM insight output.
"""
from pydantic import BaseModel
from typing import List


class InsightResult(BaseModel):
    summary: str = ""
    opportunities: List[str] = []
    risks: List[str] = []
    recommendation: str = "Proceed with Caution"
    recommendation_reason: str = ""
