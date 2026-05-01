const axios = require("axios");
const { Groq } = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "llama-3.3-70b-versatile";

async function searchColleges(countryName, domain) {
    try {
        const query = `Top 5 universities in ${countryName} for ${domain || "general studies"}. Include their QS, THE, ARWU, and US News rankings, estimated annual tuition fee in USD, and whether they have hostels.`;
        
        const tavilyResp = await axios.post("https://api.tavily.com/search", {
            api_key: process.env.TAVILY_API_KEY,
            query: query,
            search_depth: "advanced",
            include_answer: true,
            max_results: 5
        });

        const answer = tavilyResp.data?.answer || "";
        const results = tavilyResp.data?.results || [];
        const tavilyContext = answer + "\n\nSources:\n" + results.map(r => r.content || "").join("\n");

        const prompt = `
You are a university ranking expert. Based on the following web search context, extract a JSON list of up to 5 top colleges in ${countryName} for ${domain || "general studies"}.

Web Search Context:
${tavilyContext}

Return ONLY a valid JSON array of objects with the exact following structure. If you don't know a value, use a sensible default or null (for rankings use 9999 if unknown).
[
  {
    "name": "<College Name>",
    "city": "<City Name>",
    "domain": ["<domain1>", "<domain2>"],
    "qsRank": <number or 9999>,
    "theRank": <number or 9999>,
    "arwuRank": <number or 9999>,
    "usNewsRank": <number or 9999>,
    "annualFee": <estimated annual tuition fee in USD, number, default 15000>,
    "hasHostel": <boolean, default true>,
    "hostelFee": <estimated annual hostel fee in USD, number, default 5000>,
    "researchSummary": "<a brief 1-2 sentence comprehensive research summary about the college based on the search context>"
  }
]
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL,
        });

        const content = chatCompletion.choices[0].message.content;
        
        // Parse the JSON array
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
            return JSON.parse(match[0]);
        }
        return JSON.parse(content);
    } catch (err) {
        console.error("[tavilyService] Error searching colleges:", err.message);
        return [];
    }
}

async function webSearch(query) {
    try {
        console.log(`[tavilyService] Searching for: ${query}`);
        const tavilyResp = await axios.post("https://api.tavily.com/search", {
            api_key: process.env.TAVILY_API_KEY,
            query: query,
            search_depth: "advanced",
            include_answer: true,
            max_results: 5
        });

        const answer = tavilyResp.data?.answer || "";
        const results = (tavilyResp.data?.results || []).map(r => ({
            title: r.title,
            url: r.url,
            content: r.content
        }));

        return {
            answer,
            results,
            summary: answer || (results.length > 0 ? results[0].content.substring(0, 300) + "..." : "No results found.")
        };
    } catch (err) {
        console.error("[tavilyService] Error in webSearch:", err.message);
        return { error: "Search failed", answer: "", results: [], summary: "Failed to fetch live data." };
    }
}

module.exports = { searchColleges, webSearch };
