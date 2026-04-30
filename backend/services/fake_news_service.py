"""
fake_news_service.py — Assigns confidence scores based on source corroboration.
Uses simple word-overlap clustering to group articles by story topic.
"""
import re
from typing import List, Dict
from collections import defaultdict

STOPWORDS = {
    "the", "a", "an", "in", "on", "at", "to", "for", "of", "and",
    "is", "are", "was", "were", "has", "have", "had", "with", "by",
    "from", "that", "this", "it", "as", "be", "been",
}


def _tokenize(title: str) -> set:
    words = re.findall(r"\b[a-z]{4,}\b", title.lower())
    return {w for w in words if w not in STOPWORDS}


def _cluster_articles(articles: List[Dict]) -> List[List[int]]:
    """Group article indices by overlapping title keywords (≥2 shared words)."""
    tokens = [_tokenize(a.get("title", "")) for a in articles]
    parent = list(range(len(articles)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        parent[find(x)] = find(y)

    for i in range(len(articles)):
        for j in range(i + 1, len(articles)):
            if len(tokens[i] & tokens[j]) >= 2:
                union(i, j)

    clusters: Dict[int, List[int]] = defaultdict(list)
    for i in range(len(articles)):
        clusters[find(i)].append(i)

    return list(clusters.values())


def score(articles: List[Dict]) -> List[Dict]:
    """Add a 'confidence' field to each article based on source count per cluster."""
    if not articles:
        return articles

    clusters = _cluster_articles(articles)
    confidence_map: Dict[int, str] = {}

    for cluster in clusters:
        unique_sources = {articles[i].get("source", "") for i in cluster}
        src_count = len(unique_sources)

        if src_count >= 4:
            level = "High"
        elif src_count >= 2:
            level = "Medium"
        else:
            level = "Low"

        for idx in cluster:
            confidence_map[idx] = level

    scored = []
    for i, article in enumerate(articles):
        scored.append({**article, "confidence": confidence_map.get(i, "Low")})

    return scored
