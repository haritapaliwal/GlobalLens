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
        // Find the first { and the last }
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            let jsonCandidate = text.substring(firstBrace, lastBrace + 1);
            
            // Basic cleanup: remove common LLM-inserted non-JSON bits
            jsonCandidate = jsonCandidate.replace(/\/\/.*$/gm, ""); // Remove single-line comments
            
            try {
                return JSON.parse(jsonCandidate);
            } catch (innerErr) {
                console.warn("[llmService] Primary JSON parse failed, attempting forced recovery...");
                
                // Common error: unescaped newlines in strings
                let recovered = jsonCandidate.replace(/\n/g, "\\n");
                // But wait, that might break valid structure. Let's try a safer approach:
                // Only replace newlines that are NOT followed by a JSON key pattern
                recovered = jsonCandidate.replace(/\n(?!(?:\s*"[^"]+"\s*:))/g, " ");
                
                try {
                    return JSON.parse(recovered);
                } catch (e) {
                    console.error("[llmService] JSON Recovery failed. Raw start:", text.substring(0, 100));
                    return SAFE_FALLBACK;
                }
            }
        }
        return JSON.parse(text);
    } catch (err) {
        console.error("[llmService] Parse error:", err.message);
        return SAFE_FALLBACK;
    }
}
function buildInsightPrompt(countryName, persona, newsSummary, sentiment, personaDetails = {}, homeCountry = "", economicData = {}) {
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

## Economic Data (World Bank):
- GDP per Capita: $${Math.round(economicData.gdp_per_capita || 0).toLocaleString()}
- PPP Ratio: ${economicData.ppp?.toFixed(2) || "N/A"}
- Calculated Cost of Living Score: ${economicData.cost_of_living || "N/A"}/10
- Calculated Housing Score: ${economicData.housing_score || "N/A"}/10

## Your Task:
Provide a personalized, COMPREHENSIVE, and HIGHLY ACCURATE intelligence briefing tailored to a ${persona} from ${homeCountry || 'abroad'}. 
You must synthesize the raw sentiment scores, the specific news headlines, and the hard economic data provided above.
Return ONLY a valid JSON object in this exact format. 
CRITICAL: Do NOT include any preamble, conversational text, or markdown code blocks (like \`\`\`json). 
CRITICAL: Ensure all internal double quotes inside string values are escaped with a backslash (\").

{
  "summary": "<5-6 sentence COMPREHENSIVE intelligence briefing. You MUST explicitly reference findings from the news and how they correlate with the ${sentiment.overall_score} sentiment and the economic metrics. Mention how things differ from or are similar to ${homeCountry}. Be specific and detailed.>",
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
        summary: `Strategic briefing for ${countryName} (${persona} context). Based on baseline regional metrics for a visitor from ${homeCountry || 'your region'}, the current outlook is stable but requires local situational awareness. Key focus areas include navigating the ${persona === 'student' ? 'higher education landscape' : 'local market dynamics'} and adjusting to regional economic shifts.`,
        opportunities: [
            "Localized market entry advantages",
            "Infrastructure-backed regional growth"
        ],
        risks: [
            "Regional administrative processing delays",
            "Currency stability considerations relative to home base"
        ],
        recommendation: "Proceed with Caution",
        recommendation_reason: "Automated baseline checks indicate moderate compatibility for your profile.",
        metrics: {
            academic_reputation: 6,
            visa_success_rate: 6,
            part_time_job_market: 5,
            tax_efficiency: 5,
            safety_score: 6
        },
        student_info: {
            language_requirements: "B2 Level Proficiency",
            medium_of_instruction: "Primary English Support",
            specializations: ["General Studies", "Regional Economics"]
        },
        top_cities: ["Major Urban Centers", "Capital District"]
    };
}

function computeDeterministicMetrics(persona, sentiment, economicData) {
    const mapScore = (score) => Number(Math.min(10, Math.max(1, ((score + 1) / 2) * 9 + 1)).toFixed(1));
    const safety = mapScore(sentiment?.topic_scores?.safety || 0);
    const economy = mapScore(sentiment?.topic_scores?.economy || 0);
    const education = mapScore(sentiment?.topic_scores?.education || 0);
    const immigration = mapScore(sentiment?.topic_scores?.immigration || 0);
    const housing = economicData?.housing_score || 5;
    const col = economicData?.cost_of_living || 5;

    if (persona === "student") {
        return {
            academic_reputation: education,
            visa_success_rate: immigration,
            part_time_job_market: economy,
            housing_availability: housing,
            safety_score: safety
        };
    } else if (persona === "businessman") {
        return {
            tax_efficiency: Number(Math.max(1, 10 - (col / 2)).toFixed(1)), // Higher COL generally implies higher taxes
            permit_speed: immigration,
            market_growth: economy,
            regulatory_stability: mapScore(sentiment?.overall_score || 0),
            talent_availability: education
        };
    } else { // traveler / remote_worker
        return {
            safety_score: safety,
            tourism_infrastructure: economy,
            visa_ease: immigration,
            local_friendliness: mapScore(sentiment?.overall_score || 0),
            cost_of_living_score: col
        };
    }
}

async function generateInsight(countryName, persona, articles, sentiment, personaDetails = {}, homeCountry = "", economicData = {}) {
    const top5 = articles.slice(0, 5);
    let newsSummary = top5.map(a => `- ${a.title} (${a.source}): ${a.description}`).join("\n");

    if (!newsSummary.trim()) {
        newsSummary = "No recent news available.";
    }

    const prompt = buildInsightPrompt(countryName, persona, newsSummary, sentiment, personaDetails, homeCountry, economicData);
    let parsedResult = null;

    // 1. Try Groq
    try {
        console.log(`[llmService] Attempting Groq for ${countryName} (User from ${homeCountry})...`);
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL,
        });
        const content = chatCompletion.choices[0].message.content;
        parsedResult = parseLlmJson(content);
    } catch (err) {
        console.warn(`[llmService] Groq failed: ${err.message}. Switching to Gemini fallback.`);
        
        // 2. Fallback to Gemini
        if (geminiModel) {
            try {
                console.log(`[llmService] Attempting Gemini fallback for ${countryName}...`);
                const result = await geminiModel.generateContent(prompt);
                const response = await result.response;
                parsedResult = parseLlmJson(response.text());
            } catch (geminiErr) {
                console.error("[llmService] Gemini fallback also failed:", geminiErr.message);
                parsedResult = generateMockInsight(countryName, persona);
            }
        } else {
            console.error("[llmService] Gemini API Key not configured. Using mock data.");
            parsedResult = generateMockInsight(countryName, persona);
        }
    }

    // Override the LLM's guessed metrics with mathematically derived metrics from our authenticated APIs
    if (parsedResult) {
        parsedResult.metrics = computeDeterministicMetrics(persona, sentiment, economicData);
    }
    
    return parsedResult;
}

module.exports = { generateInsight };


