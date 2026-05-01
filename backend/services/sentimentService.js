const { Groq } = require("groq-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize clients
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "llama-3.1-8b-instant";

let geminiModel = null;
if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

const SAFE_FALLBACK = {
    overall_score: 0.0,
    topic_scores: {
        safety: 0.0,
        economy: 0.0,
        education: 0.0,
        immigration: 0.0,
    },
    dominant_sentiment: "neutral",
    key_themes: [],
};

function parseLlmJson(text) {
    try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            let cleanJson = match[0].replace(/\/\/.*$/gm, ""); // Remove comments
            return JSON.parse(cleanJson);
        }
        return JSON.parse(text);
    } catch (err) {
        console.error("[sentimentService] Parse error:", err.message);
        return SAFE_FALLBACK;
    }
}

function buildPrompt(texts) {
    const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join("\n");
    return `
You are a sentiment analysis engine. For the following list of texts about a country,
analyze the overall public sentiment.

Texts:
${numbered}

Return ONLY a valid JSON object in this exact format, nothing else:
{
  "overall_score": <float between -1.0 (very negative) and 1.0 (very positive)>,
  "topic_scores": {
    "safety": <float -1.0 to 1.0>,
    "economy": <float -1.0 to 1.0>,
    "education": <float -1.0 to 1.0>,
    "immigration": <float -1.0 to 1.0>
  },
  "dominant_sentiment": "positive | negative | neutral",
  "key_themes": ["theme1", "theme2", "theme3"]
}

Base topic scores only on texts that contain relevant keywords:
- Safety: violence, crime, war, protest, attack, terror, conflict
- Economy: inflation, GDP, trade, market, recession, investment, growth
- Education: university, visa, student, scholarship, admission, tuition
- Immigration: immigrant, refugee, border, asylum, policy, deportation

If a topic has no relevant texts, return 0.0 for that topic.
`;
}

function averageSentiments(results) {
    if (!results || results.length === 0) return SAFE_FALLBACK;

    const n = results.length;
    const avgOverall = results.reduce((acc, r) => acc + (r.overall_score || 0), 0) / n;
    
    const topics = ["safety", "economy", "education", "immigration"];
    const avgTopics = {};
    topics.forEach(topic => {
        avgTopics[topic] = results.reduce((acc, r) => acc + (r.topic_scores?.[topic] || 0), 0) / n;
    });

    let allThemes = [];
    results.forEach(r => {
        if (r.key_themes) allThemes = allThemes.concat(r.key_themes);
    });
    const uniqueThemes = [...new Set(allThemes)].slice(0, 5);

    let dominant = "neutral";
    if (avgOverall > 0.15) dominant = "positive";
    else if (avgOverall < -0.15) dominant = "negative";

    return {
        overall_score: Number(avgOverall.toFixed(3)),
        topic_scores: Object.fromEntries(Object.entries(avgTopics).map(([k, v]) => [k, Number(v.toFixed(3))])),
        dominant_sentiment: dominant,
        key_themes: uniqueThemes,
    };
}

function generateMockSentiment(countryName) {
    // Generate a semi-stable score based on country name length
    const hash = (countryName || "").length % 10;
    const score = (hash - 5) / 10; // Result between -0.5 and 0.4
    
    console.log(`[sentimentService] ⚠️ Generating SIMULATED sentiment for ${countryName}: ${score}`);
    
    return {
        overall_score: score,
        topic_scores: {
            safety: score + 0.1,
            economy: score - 0.1,
            education: 0.2,
            immigration: 0.1,
        },
        dominant_sentiment: score > 0.1 ? "positive" : score < -0.1 ? "negative" : "neutral",
        key_themes: ["Simulated Data", "Stable Outlook", "Local Trends"],
    };
}

async function analyzeSentiment(texts, countryName = "") {
    if (!texts || texts.length === 0) return generateMockSentiment(countryName);

    const batchSize = 20;
    const batches = [];
    for (let i = 0; i < texts.length; i += batchSize) {
        batches.push(texts.slice(i, i + batchSize));
    }

    const batchResults = [];
    for (const batch of batches) {
        const prompt = buildPrompt(batch);

        // 1. Try Groq
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: GROQ_MODEL,
            });
            const content = chatCompletion.choices[0].message.content;
            batchResults.push(parseLlmJson(content));
        } catch (err) {
            console.warn(`[sentimentService] Groq failed: ${err.message}. Switching to Gemini fallback.`);
            
            // 2. Fallback to Gemini
            if (geminiModel) {
                try {
                    const result = await geminiModel.generateContent(prompt);
                    const response = await result.response;
                    batchResults.push(parseLlmJson(response.text()));
                } catch (geminiErr) {
                    console.error("[sentimentService] Gemini fallback also failed:", geminiErr.message);
                    batchResults.push(generateMockSentiment(countryName));
                }
            } else {
                console.error("[sentimentService] Gemini API Key not configured. Using mock data.");
                batchResults.push(generateMockSentiment(countryName));
            }
        }
    }

    return averageSentiments(batchResults);
}

module.exports = { analyzeSentiment };


