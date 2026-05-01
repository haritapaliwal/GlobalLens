const express = require("express");
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

async function getCountryData(isoCode, persona, personaDetails = {}, refresh = false) {
    isoCode = isoCode.toUpperCase();
    const countryName = ISO_TO_NAME[isoCode];
    if (!countryName) return null;

    // Use personaDetails in cache key for granular caching
    const detailsHash = Buffer.from(JSON.stringify(personaDetails)).toString('base64').slice(0, 10);
    const cacheKey = `country:${persona}:${isoCode}:${detailsHash}`;

    if (!refresh && redisClient) {
        const cached = await redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached);
    }

    // Pipeline
    console.log(`[Pipeline] Fetching fresh data for ${countryName} (${persona}) with details...`);
    const [articles, redditPosts, economicData] = await Promise.all([
        fetchNews(countryName, isoCode, persona, personaDetails),
        fetchReddit(countryName),
        fetchEconomicData(isoCode, countryName)
    ]);

    const texts = [
        ...articles.map(a => `${a.title} ${a.description}`),
        ...redditPosts.map(r => r.text)
    ];

    const sentiment = await analyzeSentiment(texts);
    const scoredArticles = scoreArticles(articles);
    const insight = await generateInsight(countryName, persona, articles, sentiment, personaDetails);

    const result = {
        country: countryName,
        iso_code: isoCode,
        persona,
        persona_details: personaDetails,
        sentiment,
        economic_data: economicData,
        insight,
        articles: scoredArticles,
        last_updated: new Date().toISOString(),
        timestamp: new Date()
    };

    // Store in DB (optionally append to user's history in the future)
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
        const { persona, refresh, details } = req.query;
        let personaDetails = {};
        try {
            if (details) personaDetails = JSON.parse(details);
        } catch (e) {}

        const data = await getCountryData(isoCode, persona || "student", personaDetails, refresh === "true");
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

module.exports = { router, getCountryData };

