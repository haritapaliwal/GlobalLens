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

async function getCountryData(isoCode, persona, refresh = false) {
    isoCode = isoCode.toUpperCase();
    const countryName = ISO_TO_NAME[isoCode];
    if (!countryName) return null;

    const cacheKey = `country:${persona}:${isoCode}`;

    if (!refresh && redisClient) {
        const cached = await redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached);
    }

    // DB Fallback if not refreshing
    if (!refresh) {
        const latest = await CountrySnapshot.findOne({ iso_code: isoCode, persona })
            .sort({ timestamp: -1 });
        
        if (latest) {
            const isRecent = (new Date() - latest.timestamp) < (6 * 3600 * 1000); // 6 hours
            if (latest.articles?.length > 0 && isRecent) {
                if (redisClient) await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(latest));
                return latest;
            }
        }
    }

    // Full Pipeline
    console.log(`[Pipeline] Fetching fresh data for ${countryName} (${persona})...`);
    const [articles, redditPosts, economicData] = await Promise.all([
        fetchNews(countryName, isoCode, persona),
        fetchReddit(countryName),
        fetchEconomicData(isoCode, countryName)
    ]);

    const texts = [
        ...articles.map(a => `${a.title} ${a.description}`),
        ...redditPosts.map(r => r.text)
    ];

    const sentiment = await analyzeSentiment(texts);
    const scoredArticles = scoreArticles(articles);
    const insight = await generateInsight(countryName, persona, articles, sentiment);

    const result = {
        country: countryName,
        iso_code: isoCode,
        persona,
        sentiment,
        economic_data: economicData,
        insight,
        articles: scoredArticles,
        last_updated: new Date().toISOString(),
        timestamp: new Date()
    };

    // Store in DB
    await CountrySnapshot.create(result);

    // Cache in Redis
    if (redisClient) {
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
    }

    return result;
}

router.get("/country/:isoCode", async (req, res) => {
    try {
        const { isoCode } = req.params;
        const { persona, refresh } = req.query;
        const data = await getCountryData(isoCode, persona || "student", refresh === "true");
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
        
        if (redisClient) {
            const keys = await redisClient.keys(`country:${persona}:*`);
            for (const key of keys) {
                const data = await redisClient.get(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    const iso = key.split(":").pop();
                    scores[iso] = parsed.sentiment?.overall_score || 0;
                }
            }
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
        const sentiment = await analyzeSentiment(texts);
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
    student:       "international scholarships university admissions study abroad student visa opportunities",
    businessman:   "global trade deals business mergers economy market growth expansion",
    traveler:      "best travel destinations visa free countries tourism festival travel advisory",
    remote_worker: "digital nomad visa remote work destinations coworking spaces cost of living abroad",
    investor:      "stock market trends global investment opportunities real estate FDI emerging markets",
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

module.exports = { router, getCountryData };

