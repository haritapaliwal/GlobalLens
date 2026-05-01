"""
config.py — Central configuration & LLM client initializer.
All services import `groq_client` from here.
"""
from dotenv import load_dotenv
import os
from groq import Groq

load_dotenv()

# ── News APIs ──────────────────────────────────────────────────────────────────
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")
GNEWS_KEY = os.getenv("GNEWS_KEY")

# ── Reddit ─────────────────────────────────────────────────────────────────────
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "worldlens/1.0")

# ── Google Maps ────────────────────────────────────────────────────────────────
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# ── Database ───────────────────────────────────────────────────────────────────
MONGODB_URI = os.getenv("MONGODB_URI")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# ── LLM (Groq) ─────────────────────────────────────────────────────────────────
_api_key = os.getenv("GROQ_API_KEY") or os.getenv("GEMINI_API_KEY")
groq_client = Groq(api_key=_api_key)
GROQ_MODEL = "llama-3.1-8b-instant"

# ── Cache TTL ──────────────────────────────────────────────────────────────────
CACHE_TTL = 1800  # 30 minutes
