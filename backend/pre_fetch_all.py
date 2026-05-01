import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

# Add parent directory to path so we can import from backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import MONGODB_URI
from routes.country import get_country_data, ISO_TO_NAME

PERSONAS = ["student", "businessman", "traveler"]

async def pre_fetch_all():
    print("🚀 Starting GlobalLens Data Pre-fetch...")
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client["worldlens"]
    
    countries = list(ISO_TO_NAME.keys())
    total = len(countries) * len(PERSONAS)
    count = 0
    
    print(f"🌍 Target: {len(countries)} countries, {len(PERSONAS)} personas ({total} total snapshots)")
    print("⚠️  Warning: This will use significant API credits (NewsAPI, Groq, etc.)")
    
    for iso in countries:
        country_name = ISO_TO_NAME[iso]
        for persona in PERSONAS:
            count += 1
            print(f"[{count}/{total}] Fetching {country_name} for {persona}...")
            try:
                # get_country_data handles News, Reddit, Sentiment, LLM, and saving to DB/Redis
                await get_country_data(iso, persona, db=db)
                # Small delay to avoid aggressive rate limiting
                await asyncio.sleep(1.5)
            except Exception as e:
                print(f"❌ Failed for {iso} ({persona}): {e}")
                
    print("✅ Pre-fetch complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(pre_fetch_all())
