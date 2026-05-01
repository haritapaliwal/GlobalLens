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
function buildInsightPrompt(countryName, persona, newsSummary, sentiment, personaDetails = {}) {
    const topics = sentiment.topic_scores || {};
    const themes = (sentiment.key_themes || []).join(", ");
    const detailsStr = Object.entries(personaDetails).map(([k, v]) => `${k}: ${v}`).join(", ");

    // Define persona-specific metrics to request from LLM
    const metricDefinitions = {
      student: `
    "academic_reputation": <1-10 integer>,
    "visa_success_rate": <1-10 integer>,
    "part_time_job_market": <1-10 integer>,
    "housing_availability": <1-10 integer>,
    "safety_score": <1-10 integer>`,
      businessman: `
    "tax_efficiency": <1-10 integer>,
    "permit_speed": <1-10 integer>,
    "market_growth": <1-10 integer>,
    "regulatory_stability": <1-10 integer>,
    "talent_availability": <1-10 integer>`,
      traveler: `
    "safety_score": <1-10 integer>,
    "tourism_infrastructure": <1-10 integer>,
    "visa_ease": <1-10 integer>,
    "local_friendliness": <1-10 integer>,
    "seasonal_appeal": <1-10 integer>`,
      remote_worker: `
    "internet_reliability": <1-10 integer>,
    "nomad_community": <1-10 integer>,
    "coworking_access": <1-10 integer>,
    "cost_of_living_score": <1-10 integer>,
    "safety_score": <1-10 integer>`,
      investor: `
    "roi_potential": <1-10 integer>,
    "legal_protection": <1-10 integer>,
    "market_liquidity": <1-10 integer>,
    "political_stability": <1-10 integer>,
    "currency_risk_score": <1-10 integer>`
    };

    const personaMetrics = metricDefinitions[persona] || metricDefinitions.student;

    return `
You are a global intelligence analyst providing decision support for individuals.

## Country: ${countryName}
## User Persona: ${persona}
## User Specifics: ${detailsStr || "No specific details provided."}
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
Provide a personalized intelligence briefing tailored to a ${persona} with these specific interests: ${detailsStr}.

- Student → focus on education access for ${personaDetails.domain || "general study"}, visa ease, safety for students, cost of living
- Businessman → focus on trade climate for ${personaDetails.domain || "general business"}, tax structures, permits (especially related to ${personaDetails.focus || "general compliance"}), regulations
- Traveler → focus on safety, local sentiment toward tourists, ${personaDetails.interests || "general sightseeing"}, entry requirements for ${personaDetails.season || "the current"} season
- Remote Worker → focus on internet speed (req: ${personaDetails.speed || "standard"}), coworking, cost of living
- Investor → focus on ${personaDetails.asset || "market"} opportunities, risk (aligned with ${personaDetails.risk || "moderate"} appetite)

Return ONLY a valid JSON object in this exact format, nothing else:
{
  "summary": "<3-4 sentence briefing tailored specifically to the user's ${persona} specifics and the current data>",
  "opportunities": ["<opportunity 1>", "<opportunity 2>"],
  "risks": ["<risk 1>", "<risk 2>"],
  "recommendation": "<Favorable | Proceed with Caution | Not Recommended>",
  "recommendation_reason": "<one sentence explaining why>",
  "metrics": {
${personaMetrics}
  },
  "specific_details": {
    "domain_focus": "<short description of how their domain '${personaDetails.domain || personaDetails.industry || personaDetails.asset}' looks here>",
    "concern_addressed": "<short description addressing '${personaDetails.focus || personaDetails.risk || personaDetails.timing}'>",
    "peak_time_advisory": "<only for traveler, else null>"
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

async function generateInsight(countryName, persona, articles, sentiment, personaDetails = {}) {
    const top5 = articles.slice(0, 5);
    let newsSummary = top5.map(a => `- ${a.title} (${a.source}): ${a.description}`).join("\n");

    if (!newsSummary.trim()) {
        newsSummary = "No recent news available.";
    }

    try {
        const prompt = buildInsightPrompt(countryName, persona, newsSummary, sentiment, personaDetails);
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
