const axios = require("axios");

async function fetchReddit(countryName) {
    const results = [];
    try {
        // Fetching public search results via JSON endpoint
        const url = `https://www.reddit.com/r/worldnews+travel+business+economics/search.json?q=${encodeURIComponent(countryName)}&limit=5&sort=new`;
        const resp = await axios.get(url, {
            headers: {
                "User-Agent": process.env.REDDIT_USER_AGENT || "worldlens/1.0"
            }
        });

        if (resp.data && resp.data.data && resp.data.data.children) {
            resp.data.data.children.forEach(child => {
                const post = child.data;
                results.push({
                    text: `${post.title} | ${post.selftext ? post.selftext.substring(0, 400) : ""}`,
                    score: post.score,
                    subreddit: post.subreddit,
                    created_utc: post.created_utc
                });
            });
        }
    } catch (err) {
        console.error("[redditService] Fetch error:", err.message);
    }

    return results;
}

module.exports = { fetchReddit };
