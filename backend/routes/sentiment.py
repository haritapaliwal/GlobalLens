"""
sentiment.py — GET /api/sentiment/{iso_code} and /api/sentiment/{iso_code}/history
"""
from fastapi import APIRouter, Request, HTTPException
from datetime import datetime, timezone, timedelta

router = APIRouter()


@router.get("/sentiment/{iso_code}")
async def get_sentiment(request: Request, iso_code: str):
    """Return the most recent sentiment snapshot for a country."""
    iso_code = iso_code.upper()
    try:
        db = request.app.state.db
        doc = await db.country_snapshots.find_one(
            {"iso_code": iso_code},
            sort=[("timestamp", -1)],
        )
        if not doc:
            raise HTTPException(status_code=404, detail="No data found for country.")
        doc.pop("_id", None)
        return {"iso_code": iso_code, "sentiment": doc.get("sentiment", {})}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sentiment/{iso_code}/history")
async def get_sentiment_history(request: Request, iso_code: str):
    """Return last 7 days of sentiment snapshots for trend chart."""
    iso_code = iso_code.upper()
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)

    try:
        db = request.app.state.db
        cursor = db.country_snapshots.find(
            {"iso_code": iso_code, "timestamp": {"$gte": cutoff}},
            sort=[("timestamp", 1)],
        )
        history = []
        async for doc in cursor:
            sentiment = doc.get("sentiment", {})
            history.append(
                {
                    "date": doc.get("timestamp", datetime.now(timezone.utc)).strftime("%Y-%m-%d"),
                    "overall_score": sentiment.get("overall_score", 0.0),
                    "safety": sentiment.get("topic_scores", {}).get("safety", 0.0),
                    "economy": sentiment.get("topic_scores", {}).get("economy", 0.0),
                    "education": sentiment.get("topic_scores", {}).get("education", 0.0),
                    "immigration": sentiment.get("topic_scores", {}).get("immigration", 0.0),
                }
            )
        return {"iso_code": iso_code, "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
