"""
celery_worker.py — Background task to refresh country cache periodically.
Run with: celery -A celery_worker worker --beat --loglevel=info
"""
import asyncio
from celery import Celery
from celery.schedules import crontab
from config import REDIS_URL

app = Celery("worldlens", broker=REDIS_URL, backend=REDIS_URL)

app.conf.beat_schedule = {
    "refresh-major-countries-every-30-min": {
        "task": "celery_worker.refresh_major_countries",
        "schedule": crontab(minute="*/30"),
    },
}

# Top countries to keep warm in cache
SEED_COUNTRIES = [
    ("US", "student"), ("GB", "student"), ("DE", "student"),
    ("IN", "student"), ("CN", "student"), ("FR", "student"),
    ("US", "businessman"), ("IN", "businessman"), ("CN", "businessman"),
    ("US", "traveler"), ("IT", "traveler"), ("JP", "traveler"),
]


@app.task
def refresh_major_countries():
    """Refresh cache for seed countries — runs the full pipeline."""
    import httpx

    async def _refresh():
        async with httpx.AsyncClient(timeout=60.0) as client:
            for iso, persona in SEED_COUNTRIES:
                try:
                    # Hit the /api/country endpoint to trigger pipeline + cache
                    await client.get(
                        f"http://localhost:8000/api/country/{iso}",
                        params={"persona": persona},
                    )
                    print(f"[celery] Refreshed {iso}/{persona}")
                except Exception as e:
                    print(f"[celery] Error refreshing {iso}/{persona}: {e}")

    asyncio.run(_refresh())
