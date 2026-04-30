"""
sentiment_service.py — Gemini-powered sentiment analysis.
Batches texts ≤20, returns aggregated SentimentScore.
"""
import json
import re
from typing import List, Dict
from config import groq_client, GROQ_MODEL

SAFE_FALLBACK = {
    "overall_score": 0.0,
    "topic_scores": {
        "safety": 0.0,
        "economy": 0.0,
        "education": 0.0,
        "immigration": 0.0,
    },
    "dominant_sentiment": "neutral",
    "key_themes": [],
}


def _parse_llm_json(text: str) -> dict:
    """Strip markdown fences and parse JSON from LLM response."""
    clean = re.sub(r"```json|```", "", text).strip()
    return json.loads(clean)


def _build_prompt(texts: List[str]) -> str:
    numbered = "\n".join([f"{i+1}. {t}" for i, t in enumerate(texts)])
    return f"""
You are a sentiment analysis engine. For the following list of texts about a country,
analyze the overall public sentiment.

Texts:
{numbered}

Return ONLY a valid JSON object in this exact format, nothing else:
{{
  "overall_score": <float between -1.0 (very negative) and 1.0 (very positive)>,
  "topic_scores": {{
    "safety": <float -1.0 to 1.0>,
    "economy": <float -1.0 to 1.0>,
    "education": <float -1.0 to 1.0>,
    "immigration": <float -1.0 to 1.0>
  }},
  "dominant_sentiment": "positive | negative | neutral",
  "key_themes": ["theme1", "theme2", "theme3"]
}}

Base topic scores only on texts that contain relevant keywords:
- Safety: violence, crime, war, protest, attack, terror, conflict
- Economy: inflation, GDP, trade, market, recession, investment, growth
- Education: university, visa, student, scholarship, admission, tuition
- Immigration: immigrant, refugee, border, asylum, policy, deportation

If a topic has no relevant texts, return 0.0 for that topic.
"""


def _average_sentiments(results: List[dict]) -> dict:
    if not results:
        return SAFE_FALLBACK

    n = len(results)
    avg_overall = sum(r["overall_score"] for r in results) / n
    avg_topics = {
        topic: sum(r["topic_scores"].get(topic, 0.0) for r in results) / n
        for topic in ["safety", "economy", "education", "immigration"]
    }

    # Collect all key_themes
    all_themes: List[str] = []
    for r in results:
        all_themes.extend(r.get("key_themes", []))
    unique_themes = list(dict.fromkeys(all_themes))[:5]

    # Determine dominant sentiment from average score
    if avg_overall > 0.15:
        dominant = "positive"
    elif avg_overall < -0.15:
        dominant = "negative"
    else:
        dominant = "neutral"

    return {
        "overall_score": round(avg_overall, 3),
        "topic_scores": {k: round(v, 3) for k, v in avg_topics.items()},
        "dominant_sentiment": dominant,
        "key_themes": unique_themes,
    }


async def analyze(texts: List[str]) -> dict:
    """
    Batch texts into groups of ≤20, send each to LLM,
    then average all batch results into a single sentiment object.
    """
    if not texts:
        return SAFE_FALLBACK

    batch_size = 20
    batches = [texts[i : i + batch_size] for i in range(0, len(texts), batch_size)]
    batch_results: List[dict] = []

    for batch in batches:
        try:
            prompt = _build_prompt(batch)
            response = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}]
            )
            parsed = _parse_llm_json(response.choices[0].message.content)
            batch_results.append(parsed)
        except Exception as e:
            print(f"[sentiment_service] LLM batch error: {e}")
            batch_results.append(SAFE_FALLBACK)

    return _average_sentiments(batch_results)
