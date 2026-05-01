const { Groq } = require("groq-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize clients
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "llama-3.3-70b-versatile";

let geminiModel = null;
if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

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
function buildInsightPrompt(countryName, persona, newsSummary, sentiment, personaDetails = {}, homeCountry = "") {
    const topics = sentiment.topic_scores || {};
    const themes = (sentiment.key_themes || []).join(", ");
    const detailsStr = Object.entries(personaDetails).map(([k, v]) => `${k}: ${v}`).join(", ");
    const homeStr = homeCountry ? `The user is originally from ${homeCountry}.` : "";

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
    };

    const personaMetrics = metricDefinitions[persona] || metricDefinitions.student;

    return `
You are a global intelligence analyst providing decision support for individuals.

## Target Country: ${countryName}
## User's Home Country: ${homeCountry || "Unknown"}
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
Provide a personalized, COMPARATIVE intelligence briefing tailored to a ${persona} from ${homeCountry || 'abroad'}. 
Crucially, you must compare ${countryName} with their home base where possible (e.g., "Unlike the market in ${homeCountry}, this region is...").

- Student → focus on education access, visa ease for someone from ${homeCountry}, safety, and how the cost of living compares to their origin.
- Businessman → focus on trade climate, tax structures, and regulatory hurdles for a ${homeCountry}-based entity/individual.
- Traveler → focus on safety, entry requirements for ${homeCountry} citizens, and cultural differences.
- Remote Worker → focus on internet speed, time zone compatibility with ${homeCountry}, and "nomad" friendly zones.

Return ONLY a valid JSON object in this exact format:
{
  "summary": "<3-4 sentence COMPARATIVE briefing. Mention how things differ from or are similar to ${homeCountry}>",
  "opportunities": ["<opportunity 1 relative to their background>", "<opportunity 2>"],
  "risks": ["<risk 1 relative to their background>", "<risk 2>"],
  "recommendation": "<Favorable | Proceed with Caution | Not Recommended>",
  "recommendation_reason": "<one sentence comparing current conditions to user's home context>",
  "metrics": {
${personaMetrics}
  },
  "specific_details": {
    "domain_focus": "<how their domain looks here compared to ${homeCountry}>",
    "concern_addressed": "<addressing their specific concern in this local context>",
    "peak_time_advisory": "<only for traveler, else null>"
  },
  "student_info": {
    "language_requirements": "<e.g. IELTS 6.5+, TOEFL 90+>",
    "medium_of_instruction": "<e.g. English (Primary) or Local Language>",
    "specializations": ["<Specialization 1>", "<Specialization 2>"]
  },
  "top_cities": ["<city 1>", "<city 2>"]
}
`;
}

function generateMockInsight(countryName, persona, homeCountry = "") {
    console.log(`[llmService] ⚠️ Generating SIMULATED intelligence for ${countryName} (${persona}) from ${homeCountry}`);
    return {
        summary: `Intelligence analysis for ${countryName} is currently in simulation mode. For a ${persona} from ${homeCountry || 'your background'}, this region represents a ${countryName === homeCountry ? 'stable domestic baseline' : 'significant shift in regulatory and cultural norms'}.`,
        opportunities: [
            `Strategic positioning compared to ${homeCountry || 'other regions'}`,
            "Localized infrastructure advantages"
        ],
        risks: [
            "Currency fluctuation relative to your home base",
            "Variable administrative processing times"
        ],
        recommendation: "Proceed with Caution",
        recommendation_reason: `Simulated data suggests moderate compatibility for ${persona}s from ${homeCountry || 'your area'}.`,
        metrics: {
            academic_reputation: 7,
            visa_success_rate: 6,
            part_time_job_market: 5,
            tax_efficiency: 6,
            safety_score: 7
        },
        specific_details: {
            domain_focus: `Market dynamics differ from ${homeCountry || 'your origin'}.`,
            concern_addressed: "Processing times vary by applicant origin.",
            peak_time_advisory: persona === 'traveler' ? "Shoulder seasons recommended." : null
        },
        student_info: {
            language_requirements: "B2/C1 Level Recommended",
            medium_of_instruction: "English & Local Language",
            specializations: ["STEM", "Business Administration", "Digital Arts"]
        },
        top_cities: ["Capital City", "Major Port Hub"]
    };
}

async function generateInsight(countryName, persona, articles, sentiment, personaDetails = {}, homeCountry = "") {
    const top5 = articles.slice(0, 5);
    let newsSummary = top5.map(a => `- ${a.title} (${a.source}): ${a.description}`).join("\n");

    if (!newsSummary.trim()) {
        newsSummary = "No recent news available.";
    }

    const prompt = buildInsightPrompt(countryName, persona, newsSummary, sentiment, personaDetails, homeCountry);

    // 1. Try Groq
    try {
        console.log(`[llmService] Attempting Groq for ${countryName} (User from ${homeCountry})...`);
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL,
        });
        const content = chatCompletion.choices[0].message.content;
        return parseLlmJson(content);
    } catch (err) {
        console.warn(`[llmService] Groq failed: ${err.message}. Switching to Gemini fallback.`);
        
        // 2. Fallback to Gemini
        if (geminiModel) {
            try {
                console.log(`[llmService] Attempting Gemini fallback for ${countryName}...`);
                const result = await geminiModel.generateContent(prompt);
                const response = await result.response;
                return parseLlmJson(response.text());
            } catch (geminiErr) {
                console.error("[llmService] Gemini fallback also failed:", geminiErr.message);
                return generateMockInsight(countryName, persona);
            }
        } else {
            console.error("[llmService] Gemini API Key not configured. Using mock data.");
            return generateMockInsight(countryName, persona);
        }
    }
}

module.exports = { generateInsight };


