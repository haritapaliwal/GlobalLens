const axios = require("axios");
const { Groq } = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "llama-3.1-8b-instant";

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

        const tavilyContext = tavilyResp.data.answer + "\n\nSources:\n" + tavilyResp.data.results.map(r => r.content).join("\n");

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
async function searchTravelInfo(countryName, homeCountry, travelStyle) {
    try {
        const query = `Visa cost and requirements for citizen of ${homeCountry || "United States"} traveling to ${countryName} for tourism. Also, what is the most visited tourist destination or city in ${countryName} and its top attractions for a ${travelStyle || "traveler"}? Include exact entry costs if available.`;

        let tavilyContext = "";
        try {
            if (process.env.TAVILY_API_KEY) {
                const tavilyResp = await axios.post("https://api.tavily.com/search", {
                    api_key: process.env.TAVILY_API_KEY,
                    query: query,
                    search_depth: "basic",
                    include_answer: true,
                    max_results: 3
                });
                tavilyContext = tavilyResp.data.answer + "\n\nSources:\n" + tavilyResp.data.results.map(r => r.content).join("\n");
            }
        } catch (e) {
            console.error("Tavily request failed, falling back to pure LLM:", e.message);
        }

        const prompt = `
You are a world-class travel intelligence expert with deep knowledge of global visa policies and top tourist destinations.

Task: Provide travel information for a citizen of ${homeCountry} traveling to ${countryName} as a ${travelStyle || "traveler"}.

Web Research Context (use this for accuracy):
${tavilyContext || "No web context available — use your own knowledge."}

CRITICAL INSTRUCTIONS:
1. For visa: Give the SPECIFIC visa cost and type for ${homeCountry} citizens entering ${countryName}. Do NOT say "check visa requirements". Give the actual fee (e.g., "Rs 8,000 tourist visa fee", "$82 e-Visa fee", "Visa on arrival: free for 30 days", "Schengen Visa: ~80 EUR").
2. For regions: Return exactly 5 to 6 REAL, named, famous tourist destinations/cities in ${countryName}. NOT "Capital City". Use real city/region names like "Rome", "Bali", "Kyoto", "Machu Picchu".
3. Each region must have a 2-sentence description explaining WHY it is famous for tourists.
4. Include real attraction names (e.g., "Colosseum", "Eiffel Tower", "Taj Mahal") with their real entrance fees.
5. Include real hotel/hostel names with approximate nightly prices.

Return ONLY a raw JSON object (no markdown, no code fences) in exactly this structure:
{
  "visa": "<Specific visa cost and type, e.g. 'Tourist e-Visa: $82 for Indian citizens, valid 60 days'>",
  "entryTax": "<Any mandatory tourist entry/departure tax, or 'None'>",
  "regions": [
    {
      "name": "<Real city/region name>",
      "description": "<2-sentence description of why it is a top tourist destination>",
      "style": ["${travelStyle || "budget backpacker"}"],
      "accommodations": [
        { "type": "<Hotel type>", "name": "<Real hotel/hostel name>", "price": "<Price with currency symbol, e.g. $150/night>", "style": "${travelStyle || "budget backpacker"}" },
        { "type": "<Hotel type>", "name": "<Real hotel/hostel name>", "price": "<Price with currency symbol, e.g. $200/night>", "style": "${travelStyle || "budget backpacker"}" }
      ],
      "attractions": [
        { "name": "<Real landmark name>", "price": "<Entrance fee with currency symbol, e.g. $25 or Free>" },
        { "name": "<Real landmark name>", "price": "<Entrance fee with currency symbol, e.g. $30 or Free>" },
        { "name": "<Real landmark name>", "price": "<Entrance fee with currency symbol, e.g. $15 or Free>" }
      ],

      "costs": { "meal": <average meal cost in USD as a number>, "transport": <daily local transport cost in USD as a number> }
    }
  ]
}
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL,
            temperature: 0.3,
        });

        const content = chatCompletion.choices[0].message.content;
        console.log(`[tavilyService] Raw LLM response for ${countryName}:`, content.substring(0, 300));

        // Extract JSON object
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
            const parsed = JSON.parse(match[0]);
            console.log(`[tavilyService] Parsed ${parsed.regions?.length || 0} regions for ${countryName}`);
            return parsed;
        }
        return JSON.parse(content);
    } catch (err) {
        console.error("[tavilyService] Error searching travel info:", err.message);
        return null;
    }
}

module.exports = { searchColleges, searchTravelInfo };
