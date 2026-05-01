# WorldLens 🌐 — Global Decision Intelligence Dashboard

Real-time, AI-powered intelligence dashboard for any country in the world. Aggregates live news, Reddit sentiment, and generates Google Gemini-powered briefings tailored to your persona.

## Tech Stack
- **Frontend**: React 18 + Vite + Vanilla CSS + Google Maps + Recharts + Framer Motion + Zustand  
- **Backend**: Node.js + Express + Mongoose (MongoDB) + Redis  
- **AI**: Groq (Llama 3.3) (sentiment + persona insights)  
- **Data**: NewsAPI, GNews, Reddit (Snoowrap)

---

## Setup

### 1. Fill in API Keys

Edit `/.env` (backend):
```env
GEMINI_API_KEY=your_key          # aistudio.google.com
NEWSAPI_KEY=your_key             # newsapi.org
GNEWS_KEY=your_key               # gnews.io
REDDIT_CLIENT_ID=your_id         # reddit.com/prefs/apps
REDDIT_CLIENT_SECRET=your_secret
MONGODB_URI=your_atlas_uri
REDIS_URL=redis://localhost:6379
```

Edit `/frontend/.env`:
```env
VITE_GOOGLE_MAPS_API_KEY=your_key   # mapbox → replaced with Google Maps
```

### 2. Start Redis

```bash
docker-compose up -d
```

### 3. Backend

```bash
cd backend
npm install
npm run dev
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Background Warmup (Automatic)
The backend automatically starts a background warmup task on startup to pre-fetch intelligence for major countries.

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/country/{iso}?persona=student` | Full country pipeline (cached 30 min) |
| GET | `/api/sentiment/{iso}` | Latest raw sentiment snapshot |
| GET | `/api/sentiment/{iso}/history` | 7-day sentiment history |
| GET | `/api/insights/{iso}?persona=traveler` | LLM insight only |
| GET | `/health` | Service health check |

## Personas

| Persona | Focus |
|---------|-------|
| 🎓 Student | Education, visas, cost of living, student safety |
| 💼 Businessman | Trade, investment risk, economic stability, regulations |
| ✈️ Traveler | Safety, tourist sentiment, entry requirements, events |
