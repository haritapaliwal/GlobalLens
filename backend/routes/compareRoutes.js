const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "llama-3.1-8b-instant";

/**
 * POST /api/compare
 * Body: { persona, domain, budget, duration, homeCountry, selectedCountries, selectedISO }
 * Returns: factual comparison data + chart data + intelligence summary
 */
router.post("/", async (req, res) => {
  try {
    const { persona, domain, budget, duration, homeCountry, selectedCountries = [], selectedISO } = req.body;

    const countriesList = selectedCountries.length > 0
      ? selectedCountries.join(", ")
      : "top global destinations";

    let personaContext = "";
    let chartFields = "";
    let insightFocus = "";

    if (persona === "student") {
      personaContext = `The user is a student from ${homeCountry || "India"} interested in studying ${domain || "general studies"} abroad. Budget: ${budget || "not specified"}.`;
      chartFields = `"tuitionUSD": <annual tuition in USD>, "livingCostUSD": <annual living cost in USD>, "scholarshipChance": <percentage 0-100>, "employmentRate": <post-grad employment rate %>`;
      insightFocus = `Compare based on: tuition fees, scholarship availability, post-study work visa options, academic ranking, domain (${domain || "general"}) strength, and total annual cost.`;
    } else if (persona === "traveler") {
      personaContext = `The user is a traveler from ${homeCountry || "India"} traveling for ${domain || "leisure"}. Trip duration: ${duration || "7 days"}. Budget: ${budget || "not specified"}.`;
      chartFields = `"avgTripCostUSD": <total trip cost in USD>, "flightCostUSD": <round-trip flight cost>, "dailyCostUSD": <avg daily spend>, "visaDifficulty": <score 1-10, 10=hardest>`;
      insightFocus = `Compare based on: total trip cost for ${duration || "7 days"}, flight prices from ${homeCountry || "India"}, visa ease, safety index, and travel style fit for "${domain || "leisure"}".`;
    } else if (persona === "investor") {
      personaContext = `The user is an investor from ${homeCountry || "India"} interested in ${domain || "tech and startups"}. Budget: ${budget || "not specified"}.`;
      chartFields = `"gdpGrowthPct": <annual GDP growth %>, "fdiInflow": <FDI inflow in billions USD>, "startupEcosystemScore": <score 1-100>, "taxFriendlinessScore": <score 1-100>`;
      insightFocus = `Compare based on: GDP growth, FDI trends, startup ecosystem, tax environment, regulatory ease, and potential for ${domain || "tech"} investment.`;
    } else {
      personaContext = `The user is from ${homeCountry || "India"} with interest in ${domain || "general exploration"}. Budget: ${budget || "not specified"}.`;
      chartFields = `"overallScore": <score 1-100>, "costOfLivingIndex": <index>, "qualityOfLifeScore": <score 1-100>, "safetyIndex": <score 1-100>`;
      insightFocus = `Compare overall livability, cost, safety, and quality of life.`;
    }

    const prompt = `
You are a world-class intelligence analyst. Generate a FACTUAL, data-driven comparative analysis for the following user profile.

USER PROFILE:
${personaContext}
Countries to compare: ${countriesList}
${selectedISO ? `Currently viewing: ${selectedISO}` : ""}

TASK:
${insightFocus}

RETURN a valid JSON object with this EXACT structure (use REAL, FACTUAL data — not random numbers):
{
  "summary": "<2-3 sentence overall summary of the comparison for this user's specific situation>",
  "bestPick": {
    "country": "<best country name for this user>",
    "reason": "<specific reason why based on their domain and budget>"
  },
  "budgetFit": "<analysis of how the user's budget of ${budget || 'unspecified'} fits across these destinations>",
  "domainInsight": "<specific insight about ${domain || 'their interest area'} across compared countries>",
  "chartData": [
    ${selectedCountries.slice(0, 6).map(c => `{ "name": "${c}", ${chartFields} }`).join(",\n    ")}
  ],
  "countryInsights": [
    ${selectedCountries.slice(0, 5).map(c => `{ "country": "${c}", "pros": "<2 key pros for this persona>", "cons": "<1-2 key cons>", "verdict": "<one-line verdict>" }`).join(",\n    ")}
  ]
}

RULES:
- Use real data. Do NOT make up numbers — use known facts about these countries.
- All cost figures in USD.
- chartData must have at least ${Math.min(selectedCountries.length, 4)} entries.
- Return ONLY the JSON, no markdown, no explanation.
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: GROQ_MODEL,
      temperature: 0.1,
    });

    const content = completion.choices[0].message.content;
    const match = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : content);

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error("[compareRoutes] Error:", err.message);
    res.status(500).json({ success: false, error: "Comparison failed" });
  }
});

module.exports = router;
