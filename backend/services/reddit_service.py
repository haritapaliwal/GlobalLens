"""
reddit_service.py — Fetches public Reddit posts & top comments via PRAW.
"""
import praw
from typing import List, Dict
from config import REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT


def _get_reddit_client() -> praw.Reddit:
    return praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT,
    )


def fetch(country_name: str) -> List[Dict]:
    """Search Reddit subreddits for posts about the country."""
    results: List[Dict] = []
    try:
        reddit = _get_reddit_client()
        subreddit = reddit.subreddit("worldnews+travel+business+economics")
        posts = subreddit.search(country_name, limit=20, sort="new")

        for post in posts:
            # Collect post text
            text_parts = [post.title]
            if post.selftext:
                text_parts.append(post.selftext[:300])

            # Top 3 comments
            try:
                post.comments.replace_more(limit=0)
                top_comments = post.comments.list()[:3]
                for c in top_comments:
                    if hasattr(c, "body"):
                        text_parts.append(c.body[:200])
            except Exception:
                pass

            results.append(
                {
                    "text": " | ".join(text_parts),
                    "score": post.score,
                    "subreddit": str(post.subreddit),
                    "created_utc": int(post.created_utc),
                }
            )
    except Exception as e:
        print(f"[reddit_service] Error: {e}")

    return results
