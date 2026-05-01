"""
llm_service.py — Gemini-powered persona-specific intelligence briefings.
"""
import json
import re
from typing import List, Dict
from config import groq_client, GROQ_MODEL

SAFE_FALLBACK = {
    "summary": "Unable to generate briefing at this time.",
    "opportunities": [],
    "risks": [],
    "recommendation": "Proceed with Caution",
    "recommendation_reason": "Insufficient data for a confident recommendation.",
}


def _parse_llm_json(text: str) -> dict:
    """Extract and parse JSON from LLM response, stripping comments and extra text."""
    try:
        # Find the core JSON object
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            clean_json = match.group(0)
            # Remove // style comments which break standard json.loads
            clean_json = re.sub(r"//.*", "", clean_json)
            return json.loads(clean_json, strict=False)
        return json.loads(text, strict=False)
    except Exception as e:
        print(f"[llm_service] Parse error: {e}")
        return SAFE_FALLBACK


def _build_insight_prompt(
    country_name: str,
    persona: str,
    news_summary: str,
    sentiment: dict,
) -> str:
    topics = sentiment.get("topic_scores", {})
    themes = ", ".join(sentiment.get("key_themes", []))
    return f"""
You are a global intelligence analyst providing decision support for individuals.

## Country: {country_name}
## User Persona: {persona}
## Overall Sentiment Score: {sentiment.get('overall_score', 0.0)} (scale: -1.0 to +1.0)
## Topic Sentiment Breakdown:
- Safety: {topics.get('safety', 0.0)}
- Economy: {topics.get('economy', 0.0)}
- Education: {topics.get('education', 0.0)}
- Immigration: {topics.get('immigration', 0.0)}
## Key Themes Detected: {themes}

## Recent News Headlines & Summaries:
{news_summary}

## Your Task:
Provide a personalized intelligence briefing ONLY relevant to a {persona}.

- Student → focus on education access, visa ease, safety for students, cost of living
- Businessman → focus on trade climate, economic stability, investment risk, regulations
- Traveler → focus on safety, local sentiment toward tourists, current events, entry requirements

Return ONLY a valid JSON object in this exact format, nothing else:
{{
  "summary": "<3-4 sentence briefing tailored to the {persona}>",
  "opportunities": ["<opportunity 1>", "<opportunity 2>"],
  "risks": ["<risk 1>", "<risk 2>"],
  "recommendation": "<Favorable | Proceed with Caution | Not Recommended>",
  "recommendation_reason": "<one sentence explaining why>"
}}
"""


async def generate_insight(
    country_name: str,
    persona: str,
    articles: List[Dict],
    sentiment: dict,
) -> dict:
    """Generate a persona-specific LLM briefing using Gemini."""
    # Build news summary from top 5 articles
    top5 = articles[:5]
    news_summary = "\n".join(
        [
            f"- {a.get('title', '')} ({a.get('source', '')}): {a.get('description', '')}"
            for a in top5
        ]
    )

    if not news_summary.strip():
        news_summary = "No recent news available."

    try:
        prompt = _build_insight_prompt(country_name, persona, news_summary, sentiment)
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        return _parse_llm_json(response.choices[0].message.content)
    except Exception as e:
        print(f"[llm_service] LLM insight error: {e}")
        return SAFE_FALLBACK
