"""
main.py — FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager

from config import MONGODB_URI
from routes import country, sentiment, insights


# ── Database lifecycle ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.mongo = AsyncIOMotorClient(MONGODB_URI)
    app.state.db = app.state.mongo["worldlens"]
    
    # Start background warmup for major countries
    import asyncio
    from routes.country import get_country_data
    
    async def warmup():
        # Wait a few seconds for Redis to be fully ready
        await asyncio.sleep(5)
        major_isos = ["IN", "US", "GB", "DE", "CN", "FR", "JP", "CA", "AU", "BR"]
        print(f"[Warmup] Starting background intelligence pre-load for {len(major_isos)} countries...")
        for iso in major_isos:
            try:
                await get_country_data(iso, persona="student", db=app.state.db)
                await asyncio.sleep(1) # Don't spam APIs too hard
            except Exception as e:
                print(f"[Warmup] Failed for {iso}: {e}")
        print("[Warmup] Background pre-load complete.")

    asyncio.create_task(warmup())

    yield
    # Shutdown
    app.state.mongo.close()


app = FastAPI(
    title="WorldLens API",
    description="Global Decision Intelligence Dashboard",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(country.router, prefix="/api")
app.include_router(sentiment.router, prefix="/api")
app.include_router(insights.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "WorldLens API"}
