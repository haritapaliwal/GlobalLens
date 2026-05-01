require("dotenv").config({ path: '../.env' }); // Load env variables for Reddit
const { fetchEconomicData } = require('../services/economicService');
const { fetchReddit } = require('../services/redditService');

async function testApis() {
    console.log("=== Testing Economic APIs (World Bank & Teleport) ===");
    try {
        const econData = await fetchEconomicData("GB", "United Kingdom");
        console.log("Economic Data for GB:", JSON.stringify(econData, null, 2));
        
        if (econData.ppp !== 0.75 && econData.ppp !== null) {
             console.log("✅ World Bank PPP is live!");
        } else {
             console.log("⚠️ World Bank PPP is using fallback.");
        }
        
        if (econData.cost_of_living !== 5.5 && econData.cost_of_living !== null) {
             console.log("✅ Teleport Cost of Living is live!");
        } else {
             console.log("⚠️ Teleport Cost of Living is using fallback.");
        }

    } catch(err) {
        console.error("Economic API failed:", err);
    }

    console.log("\n=== Testing Reddit API ===");
    try {
        const redditData = await fetchReddit("United Kingdom");
        console.log(`Reddit Posts Fetched: ${redditData.length}`);
        if(redditData.length > 0) {
            console.log("First Post:", JSON.stringify(redditData[0], null, 2));
            if (redditData[0].source === "Reddit API") {
                console.log("✅ Reddit API is live!");
            } else {
                console.log("⚠️ Reddit API is using fallback mock data.");
            }
        }
    } catch(err) {
        console.error("Reddit API failed:", err);
    }
}
testApis();
