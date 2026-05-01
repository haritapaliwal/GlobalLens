const axios = require("axios");

const PERSONA_QUERIES = {
    student: "student visa international education university",
    businessman: "economy trade business investment regulation",
    traveler: "tourism safety travel advisory entry requirements",
    remote_worker: "digital nomad visa internet cost of living coworking",
    investor: "stock market real estate FDI interest rates",
};

async function fetchNews(countryName, isoCode, persona = "student", personaDetails = {}) {
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
        } else if (persona === "investor" && personaDetails.asset) {
            extraQ += ` ${personaDetails.asset}`;
        }
    }

    const query = `${countryName} ${extraQ}`.trim();

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

    return articles;
}

module.exports = { fetchNews };
