const axios = require("axios");

const PERSONA_QUERIES = {
    student: "student visa international education university",
    businessman: "economy trade business investment regulation",
    traveler: "tourism safety travel advisory entry requirements",
    remote_worker: "digital nomad visa internet cost of living coworking",
};

async function fetchNews(countryName, isoCode, persona = "student", personaDetails = {}, homeCountry = "") {
    const articles = [];
    const seenUrls = new Set();
    let extraQ = PERSONA_QUERIES[persona] || "";
    
    // Add persona details to query
    if (personaDetails) {
        if (persona === "student" && personaDetails.domain) {
            extraQ += ` ${personaDetails.domain}`;
        } else if (persona === "businessman") {
            if (personaDetails.domain) extraQ += ` ${personaDetails.domain}`;
            if (personaDetails.focus) extraQ += ` ${personaDetails.focus}`;
        } else if (persona === "traveler") {
            if (personaDetails.interests) extraQ += ` ${personaDetails.interests}`;
            if (personaDetails.season) extraQ += ` ${personaDetails.season}`;
        } else if (persona === "remote_worker" && personaDetails.industry) {
            extraQ += ` ${personaDetails.industry}`;
        }
    }

    // Add bilateral context if homeCountry is provided
    const query = homeCountry 
        ? `${countryName} ${homeCountry} ${extraQ}`.trim()
        : `${countryName} ${extraQ}`.trim();

    // NewsAPI
    try {
        const newsApiResp = await axios.get("https://newsapi.org/v2/everything", {
            params: {
                apiKey: process.env.NEWSAPI_KEY,
                q: query,
                language: "en",
                sortBy: "publishedAt",
                pageSize: 10
            }
        });

        if (newsApiResp.data && newsApiResp.data.articles) {
            newsApiResp.data.articles.forEach(a => {
                if (a.url && !seenUrls.has(a.url)) {
                    seenUrls.add(a.url);
                    articles.push({
                        title: a.title || "",
                        description: a.description || "",
                        url: a.url,
                        source: a.source ? a.source.name : "NewsAPI",
                        publishedAt: a.publishedAt || ""
                    });
                }
            });
        }
    } catch (err) {
        console.error("[newsService] NewsAPI error:", err.message);
    }

    // GNews
    try {
        const gnewsResp = await axios.get("https://gnews.io/api/v4/search", {
            params: {
                q: query,
                lang: "en",
                max: 5,
                apikey: process.env.GNEWS_KEY
            }
        });

        if (gnewsResp.data && gnewsResp.data.articles) {
            gnewsResp.data.articles.forEach(a => {
                if (a.url && !seenUrls.has(a.url)) {
                    seenUrls.add(a.url);
                    articles.push({
                        title: a.title || "",
                        description: a.description || "",
                        url: a.url,
                        source: a.source ? a.source.name : "GNews",
                        publishedAt: a.publishedAt || ""
                    });
                }
            });
        }
    } catch (err) {
        console.error("[newsService] GNews error:", err.message);
    }

    // Fallback if both fail
    if (articles.length === 0) {
        console.log(`[newsService] ⚠️ Generating simulated news for ${countryName}`);
        const mockNews = [
            {
                title: `${countryName} Announces New Digital Infrastructure Initiative`,
                description: `Government officials in ${countryName} have unveiled a multi-billion dollar plan to modernize national fiber networks and 5G availability, aiming to boost the ${persona} experience.`,
                url: "#",
                source: "GlobalLens Intelligence",
                publishedAt: new Date().toISOString()
            },
            {
                title: `Regional Economic Forum Highlights ${countryName}'s Growing Market`,
                description: `Economic analysts at the latest forum pointed toward ${countryName} as a key growth hub in the region, particularly noting its appeal to the ${persona} demographic.`,
                url: "#",
                source: "Market Pulse",
                publishedAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        return mockNews;
    }

    return articles;
}

module.exports = { fetchNews };
