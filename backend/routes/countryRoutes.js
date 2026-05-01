const express = require("express");
const axios = require("axios");
const router = express.Router();
const CountrySnapshot = require("../models/CountrySnapshot");
const { fetchNews } = require("../services/newsService");
const { fetchReddit } = require("../services/redditService");
const { fetchEconomicData } = require("../services/economicService");
const { analyzeSentiment } = require("../services/sentimentService");
const { scoreArticles } = require("../services/fakeNewsService");
const { generateInsight } = require("../services/llmService");
const redis = require("redis");

const ISO_TO_NAME = {
    "AF": "Afghanistan", "AL": "Albania", "DZ": "Algeria", "AR": "Argentina",
    "AU": "Australia", "AT": "Austria", "BD": "Bangladesh", "BE": "Belgium",
    "BR": "Brazil", "CA": "Canada", "CL": "Chile", "CN": "China",
    "CO": "Colombia", "HR": "Croatia", "CZ": "Czech Republic", "DK": "Denmark",
    "EG": "Egypt", "ET": "Ethiopia", "FI": "Finland", "FR": "France",
    "DE": "Germany", "GH": "Ghana", "GR": "Greece", "HU": "Hungary",
    "IN": "India", "ID": "Indonesia", "IR": "Iran", "IQ": "Iraq",
    "IE": "Ireland", "IL": "Israel", "IT": "Italy", "JP": "Japan",
    "JO": "Jordan", "KE": "Kenya", "KR": "South Korea", "MX": "Mexico",
    "MA": "Morocco", "NL": "Netherlands", "NZ": "New Zealand", "NG": "Nigeria",
    "NO": "Norway", "PK": "Pakistan", "PE": "Peru", "PH": "Philippines",
    "PL": "Poland", "PT": "Portugal", "RO": "Romania", "RU": "Russia",
    "SA": "Saudi Arabia", "ZA": "South Africa", "ES": "Spain", "SE": "Sweden",
    "CH": "Switzerland", "TH": "Thailand", "TR": "Turkey", "UA": "Ukraine",
    "GB": "United Kingdom", "US": "United States", "VN": "Vietnam",
};

// Redis setup
let redisClient;
(async () => {
    try {
        const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
        redisClient = redis.createClient({
            url,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 2) {
                        console.log("⚠️ Redis connection failed after 3 attempts. Disabling Redis.");
                        return false; // Stop retrying
                    }
                    return 500; // Retry after 500ms
                }
            }
        });

        redisClient.on("error", (err) => {
            // Only log if it's not a connection refused (to avoid spam)
            if (err.code !== 'ECONNREFUSED') {
                console.log("Redis Client Error", err);
            }
        });

        await redisClient.connect();
        console.log("✅ Connected to Redis");
    } catch (err) {
        console.log("⚠️ Redis not available, using in-memory cache fallback");
        redisClient = null;
    }
})();

const CACHE_TTL = 3600; // 1 hour

async function getCountryData(isoCode, persona, homeCountry = "", personaDetails = {}, refresh = false) {
    isoCode = isoCode.toUpperCase();
    const countryName = ISO_TO_NAME[isoCode];
    if (!countryName) return null;

    // Resolve homeCountry ISO code to full name for downstream services
    const homeCountryName = homeCountry ? (ISO_TO_NAME[homeCountry.toUpperCase()] || homeCountry) : "";

    // Use personaDetails and homeCountry in cache key for granular caching
    const detailsHash = Buffer.from(JSON.stringify({ ...personaDetails, homeCountry })).toString('base64').slice(0, 10);
    const cacheKey = `country:${persona}:${isoCode}:${detailsHash}`;

    // Tier 1: Check Redis
    if (!refresh && redisClient) {
        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                console.log(`[Cache] Redis HIT for ${isoCode}`);
                return JSON.parse(cached);
            }
        } catch (redisErr) {
            console.warn(`[Cache] Redis GET failed for ${isoCode}:`, redisErr.message);
        }
    }

    if (!refresh) {
        // Check MongoDB for a recent snapshot (e.g., within the last 24 hours)
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dbSnapshot = await CountrySnapshot.findOne({
            iso_code: isoCode,
            persona: persona,
            details_hash: detailsHash,
            timestamp: { $gte: cutoff }
        }).sort({ timestamp: -1 }).lean();

        if (dbSnapshot) {
            console.log(`[Cache] Using MongoDB snapshot for ${countryName} (${persona})`);
            // Re-cache in Redis
            if (redisClient) {
                await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(dbSnapshot));
            }
            return dbSnapshot;
        }
    }

    // Tier 2: Check MongoDB (Snapshots from the last 24 hours)
    if (!refresh) {
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const dbSnapshot = await CountrySnapshot.findOne({
                iso_code: isoCode,
                persona: persona,
                home_country: homeCountry,
                timestamp: { $gte: oneDayAgo }
            }).sort({ timestamp: -1 });

            if (dbSnapshot) {
                console.log(`[Cache] MongoDB HIT for ${isoCode}`);
                const result = dbSnapshot.toObject();

                // Backfill Redis so the next click is even faster
                if (redisClient) {
                    try {
                        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
                    } catch (e) { /* non-critical */ }
                }
                return result;
            }
        } catch (dbErr) {
            console.warn(`[Cache] MongoDB lookup failed for ${isoCode}:`, dbErr.message);
        }
    }

    // Tier 3: Pipeline (Fresh API Fetch)
    console.log(`[Pipeline] Fetching fresh data for ${countryName} (${persona}) from ${homeCountryName || 'unknown'}...`);
    const pipelineStart = Date.now();

    const [articles, redditPosts, economicData] = await Promise.all([
        fetchNews(countryName, isoCode, persona, personaDetails, homeCountryName),
        fetchReddit(countryName),
        fetchEconomicData(isoCode, countryName)
    ]);

    const texts = [
        ...articles.map(a => `${a.title} ${a.description}`),
        ...redditPosts.map(r => r.text)
    ];

    const sentiment = await analyzeSentiment(texts, countryName);
    const scoredArticles = scoreArticles(articles);
    const insight = await generateInsight(countryName, persona, articles, sentiment, personaDetails, homeCountryName);

    console.log(`[Pipeline] Complete for ${isoCode} in ${Date.now() - pipelineStart}ms`);

    const result = {
        country: countryName,
        iso_code: isoCode,
        persona,
        home_country: homeCountry,
        persona_details: personaDetails,
        details_hash: detailsHash,
        sentiment,
        economic_data: economicData,
        insight,
        articles: scoredArticles,
        last_updated: new Date().toISOString(),
        timestamp: new Date()
    };

    // Fire-and-forget: Save to DB and Redis in background (don't block the response)
    setImmediate(async () => {
        try {
            await CountrySnapshot.create(result);
            console.log(`[Pipeline] Saved snapshot for ${isoCode} to MongoDB`);
        } catch (dbErr) {
            console.warn(`[Pipeline] Failed to save snapshot for ${isoCode}:`, dbErr.message);
        }

        if (redisClient) {
            try {
                await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
                console.log(`[Pipeline] Cached ${isoCode} in Redis`);
            } catch (redisErr) {
                console.warn(`[Pipeline] Failed to cache in Redis for ${isoCode}:`, redisErr.message);
            }
        }
    });

    return result;
}

router.get("/country/:isoCode", async (req, res) => {
    try {
        const { isoCode } = req.params;
        const { persona, refresh, details, homeCountry } = req.query;
        let personaDetails = {};
        try {
            if (details) personaDetails = JSON.parse(details);
        } catch (e) { }

        const data = await getCountryData(isoCode, persona || "student", homeCountry, personaDetails, refresh === "true");
        if (!data) return res.status(404).json({ error: "Country not found" });
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/map-scores", async (req, res) => {
    try {
        const { persona = "student" } = req.query;
        const scores = {};

        // 1. Try Redis first
        if (redisClient) {
            const keys = await redisClient.keys(`country:${persona}:*`);
            for (const key of keys) {
                const data = await redisClient.get(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    // Cache key format: country:{persona}:{isoCode}:{detailsHash}
                    const parts = key.split(":");
                    const iso = parts[2]; // Index 2 = isoCode (not .pop() which gives detailsHash)
                    if (iso && iso.length === 2) {
                        scores[iso] = parsed.sentiment?.overall_score || 0;
                    }
                }
            }
        }

        // 2. If Redis is empty or disabled, Fallback to MongoDB
        if (Object.keys(scores).length === 0) {
            console.log(`[map-scores] Redis empty/down, fetching from MongoDB...`);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentSnapshots = await CountrySnapshot.find({
                persona: persona,
                timestamp: { $gte: oneDayAgo }
            }).select('iso_code sentiment.overall_score');

            recentSnapshots.forEach(snap => {
                // Keep the most recent score for each country
                scores[snap.iso_code] = snap.sentiment?.overall_score || 0;
            });
        }

        res.json(scores);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch map scores" });
    }
});

router.get("/sentiment/:isoCode/history", async (req, res) => {
    try {
        const { isoCode } = req.params;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);

        const history = await CountrySnapshot.find({
            iso_code: isoCode.toUpperCase(),
            timestamp: { $gte: cutoff }
        }).sort({ timestamp: 1 });

        const formattedHistory = history.map(doc => ({
            date: doc.timestamp.toISOString().split("T")[0],
            overall_score: doc.sentiment?.overall_score || 0,
            safety: doc.sentiment?.topic_scores?.safety || 0,
            economy: doc.sentiment?.topic_scores?.economy || 0,
            education: doc.sentiment?.topic_scores?.education || 0,
            immigration: doc.sentiment?.topic_scores?.immigration || 0,
        }));

        res.json({ iso_code: isoCode.toUpperCase(), history: formattedHistory });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch sentiment history" });
    }
});

router.get("/insights/:isoCode", async (req, res) => {
    try {
        const { isoCode } = req.params;
        const { persona = "student" } = req.query;
        const countryName = ISO_TO_NAME[isoCode.toUpperCase()];
        if (!countryName) return res.status(404).json({ error: "Country not found" });

        const articles = await fetchNews(countryName, isoCode.toUpperCase(), persona);
        const texts = articles.map(a => `${a.title} ${a.description}`);
        const sentiment = await analyzeSentiment(texts, countryName);
        const insight = await generateInsight(countryName, persona, articles, sentiment);

        res.json({
            country: countryName,
            iso_code: isoCode.toUpperCase(),
            persona,
            insight
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch insights" });
    }
});

// ── Global Persona News Feed ─────────────────────────────────────────────────
const GLOBAL_PERSONA_QUERIES = {
    student: "international scholarships university admissions study abroad student visa opportunities",
    businessman: "global trade deals business mergers economy market growth expansion",
    traveler: "best travel destinations visa free countries tourism festival travel advisory",
    remote_worker: "digital nomad visa remote work destinations coworking spaces cost of living abroad",
};

router.get("/global-news", async (req, res) => {
    try {
        const { persona = "student" } = req.query;
        const cacheKey = `global-news:${persona}`;

        // Check Redis cache first
        if (redisClient) {
            try {
                const cached = await redisClient.get(cacheKey);
                if (cached) return res.json(JSON.parse(cached));
            } catch (e) { /* Redis miss, continue */ }
        }

        const query = GLOBAL_PERSONA_QUERIES[persona] || GLOBAL_PERSONA_QUERIES.student;
        const articles = [];
        const seenUrls = new Set();

        // NewsAPI — global headlines
        try {
            const newsResp = await axios.get("https://newsapi.org/v2/everything", {
                params: {
                    apiKey: process.env.NEWSAPI_KEY,
                    q: query,
                    language: "en",
                    sortBy: "publishedAt",
                    pageSize: 12,
                },
            });
            if (newsResp.data?.articles) {
                newsResp.data.articles.forEach(a => {
                    if (a.url && !seenUrls.has(a.url)) {
                        seenUrls.add(a.url);
                        articles.push({
                            title: a.title || "",
                            description: a.description || "",
                            url: a.url,
                            source: a.source?.name || "NewsAPI",
                            publishedAt: a.publishedAt || "",
                            imageUrl: a.urlToImage || null,
                        });
                    }
                });
            }
        } catch (err) {
            console.error("[global-news] NewsAPI error:", err.message);
        }

        // GNews — supplementary
        try {
            const gnewsResp = await axios.get("https://gnews.io/api/v4/search", {
                params: {
                    q: query,
                    lang: "en",
                    max: 6,
                    apikey: process.env.GNEWS_KEY,
                },
            });
            if (gnewsResp.data?.articles) {
                gnewsResp.data.articles.forEach(a => {
                    if (a.url && !seenUrls.has(a.url)) {
                        seenUrls.add(a.url);
                        articles.push({
                            title: a.title || "",
                            description: a.description || "",
                            url: a.url,
                            source: a.source?.name || "GNews",
                            publishedAt: a.publishedAt || "",
                            imageUrl: a.image || null,
                        });
                    }
                });
            }
        } catch (err) {
            console.error("[global-news] GNews error:", err.message);
        }

        const result = { persona, articles, fetchedAt: new Date().toISOString() };

        // Final fallback if both APIs fail
        if (articles.length === 0) {
            console.log(`[global-news] ⚠️ Generating simulated global feed for ${persona}`);
            const personaFakes = {
                student: [
                    { title: "Top 10 Global Universities for 2026 Announced", description: "A new ranking highlights the best institutions for international students, focusing on career outcomes and campus safety.", url: "#", source: "Global Education Hub", publishedAt: new Date().toISOString() },
                    { title: "Rising Interest in STEM Study Abroad Programs", description: "Trends show a massive surge in international students applying for cross-border STEM research initiatives.", url: "#", source: "Scholarship News", publishedAt: new Date().toISOString() }
                ],
                businessman: [
                    { title: "Global Trade Corridors Shifting in Q2 2026", description: "Analysts observe new trade patterns emerging as digital commerce regulations harmonize across major economies.", url: "#", source: "Economic Times", publishedAt: new Date().toISOString() },
                    { title: "Venture Capital Flows into Sustainable Tech Hits Record High", description: "The latest quarterly report shows unprecedented investment levels in green technology startups worldwide.", url: "#", source: "Business Intelligence", publishedAt: new Date().toISOString() }
                ],
                traveler: [
                    { title: "New Visa-Free Travel Agreements for 20 Countries", description: "Major diplomatic breakthroughs have led to expanded visa-free access for millions of global travelers starting next month.", url: "#", source: "Travel Weekly", publishedAt: new Date().toISOString() },
                    { title: "Eco-Tourism Becomes the Top Priority for 2026 Vacations", description: "Sustainability is now the leading factor for travelers when choosing their next international destination.", url: "#", source: "World Explorer", publishedAt: new Date().toISOString() }
                ],
                remote_worker: [
                    { title: "Estonia and Portugal Expand Digital Nomad Benefits", description: "New legislative changes offer even more incentives for long-term remote workers, including tax breaks and health coverage.", url: "#", source: "Nomad List News", publishedAt: new Date().toISOString() },
                    { title: "Starlink Connectivity Reaches 99% Global Coverage", description: "Reliable high-speed internet is now available in the most remote corners of the globe, transforming the nomadic lifestyle.", url: "#", source: "Tech Frontier", publishedAt: new Date().toISOString() }
                ]
            };
            result.articles = personaFakes[persona] || personaFakes.student;
        }

        // Cache for 30 min
        if (redisClient) {
            try {
                await redisClient.setEx(cacheKey, 1800, JSON.stringify(result));
            } catch (e) { /* cache write fail, non-critical */ }
        }

        res.json(result);
    } catch (err) {
        console.error("[global-news] Error:", err);
        res.status(500).json({ error: "Failed to fetch global news" });
    }
});

const { getChatResponse } = require("../services/chatService");

router.post("/chat", async (req, res) => {
    try {
        const { message, isoCode, persona, history, userDetails } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        const response = await getChatResponse(message, isoCode, persona, history, userDetails);
        res.json({ response });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to process chat" });
    }
});

module.exports = { router, getCountryData };

