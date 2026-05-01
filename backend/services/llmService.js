const { Groq } = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "llama-3.3-70b-versatile";

const SAFE_FALLBACK = {
    summary: "Unable to generate briefing at this time.",
    opportunities: [],
    risks: [],
    recommendation: "Proceed with Caution",
    recommendation_reason: "Insufficient data for a confident recommendation.",
    metrics: {
        visa_difficulty: 5,
        housing_availability: 5,
        safety_score: 5,
        cost_of_living: 5
    },
    student_info: {
        language_requirements: "Loading...",
        medium_of_instruction: "Check Latest Advisories",
        specializations: []
    },
    top_cities: []
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
        console.error("[llmService] Parse error:", err.message);
        return SAFE_FALLBACK;
    }
}

function buildInsightPrompt(countryName, persona, newsSummary, sentiment) {
    const topics = sentiment.topic_scores || {};
    const themes = (sentiment.key_themes || []).join(", ");
    return `
You are a global intelligence analyst providing decision support for individuals.

## Country: ${countryName}
## User Persona: ${persona}
## Overall Sentiment Score: ${sentiment.overall_score || 0.0} (scale: -1.0 to +1.0)
## Topic Sentiment Breakdown:
- Safety: ${topics.safety || 0.0}
- Economy: ${topics.economy || 0.0}
- Education: ${topics.education || 0.0}
- Immigration: ${topics.immigration || 0.0}
## Key Themes Detected: ${themes}

## Recent News Headlines & Summaries:
${newsSummary}

## Your Task:
Provide a personalized intelligence briefing ONLY relevant to a ${persona}.

- Student → focus on education access, visa ease, safety for students, cost of living
- Businessman → focus on trade climate, economic stability, investment risk, regulations
- Traveler → focus on safety, local sentiment toward tourists, current events, entry requirements

Return ONLY a valid JSON object in this exact format, nothing else:
{
  "summary": "<3-4 sentence briefing tailored to the ${persona}>",
  "opportunities": ["<opportunity 1>", "<opportunity 2>"],
  "risks": ["<risk 1>", "<risk 2>"],
  "recommendation": "<Favorable | Proceed with Caution | Not Recommended>",
  "recommendation_reason": "<one sentence explaining why>",
  "metrics": {
    "visa_difficulty": <1-10 integer, 1=easy, 10=strict>,
    "visa_success_rate": "<0-100 percentage integer>%",
    "housing_availability": <1-10 integer, 1=impossible, 10=plentiful>,
    "safety_score": <1-10 integer, 1=dangerous, 10=extremely safe>,
    "cost_of_living": <1-10 integer, 1=very cheap, 10=very expensive>
  },

  "student_info": {
    "language_requirements": "<e.g. IELTS 6.5+, TOEFL 90+>",
    "medium_of_instruction": "<e.g. English (Primary) or Local Language (High Necessity)>",
    "specializations": ["<Specialization 1>", "<Specialization 2>"]
  },
  "top_cities": ["<city 1>", "<city 2>"]
}
`;
}

async function generateInsight(countryName, persona, articles, sentiment) {
    const top5 = articles.slice(0, 5);
    let newsSummary = top5.map(a => `- ${a.title} (${a.source}): ${a.description}`).join("\n");

    if (!newsSummary.trim()) {
        newsSummary = "No recent news available.";
    }

    try {
        const prompt = buildInsightPrompt(countryName, persona, newsSummary, sentiment);
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL,
        });
        const content = chatCompletion.choices[0].message.content;
        return parseLlmJson(content);
    } catch (err) {
        console.error("[llmService] Insight error:", err.message);
        return SAFE_FALLBACK;
    }
}

module.exports = { generateInsight };
