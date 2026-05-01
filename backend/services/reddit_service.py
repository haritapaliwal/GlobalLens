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
        posts = subreddit.search(country_name, limit=5, sort="new")

        for post in posts:
            # Collect post text (Title + snippet)
            text = f"{post.title} | {post.selftext[:400]}"

            results.append(
                {
                    "text": text,
                    "score": post.score,
                    "subreddit": str(post.subreddit),
                    "created_utc": int(post.created_utc),
                }
            )
    except Exception as e:
        print(f"[reddit_service] Error: {e}")

    return results
