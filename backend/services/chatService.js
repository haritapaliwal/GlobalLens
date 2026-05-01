const { Groq } = require("groq-sdk");
const CountrySnapshot = require("../models/CountrySnapshot");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "llama-3.3-70b-versatile";

async function getChatResponse(message, isoCode, persona, history = [], userDetails = {}) {
    try {
        const { name, homeCountry, personaDetails } = userDetails;
        let context = `You are WorldLens AI, a helpful global intelligence assistant. 
You are speaking with ${name || "a user"} who is from ${homeCountry || "unknown location"}.
They are using the platform as a ${persona}. 
Specific details provided by the user: ${JSON.stringify(personaDetails || {})}.
`;
        
        if (isoCode) {
            // Fetch latest data for the country and persona
            const latestData = await CountrySnapshot.findOne({ 
                iso_code: isoCode.toUpperCase(), 
                persona: persona 
            }).sort({ timestamp: -1 });

            if (latestData) {
                context += `
The user is currently exploring ${latestData.country} as a ${persona}.
## Intelligence Snapshot for ${latestData.country}:
- Overall Sentiment: ${latestData.sentiment?.overall_score || "N/A"}
- Key Insight: ${latestData.insight?.summary || "N/A"}
- Top Opportunities: ${(latestData.insight?.opportunities || []).join(", ")}
- Top Risks: ${(latestData.insight?.risks || []).join(", ")}
- Recommendation: ${latestData.insight?.recommendation || "N/A"}
- Recent News: ${latestData.articles?.slice(0, 3).map(a => a.title).join("; ")}
`;
            } else {
                context += `The user is interested in ${isoCode}, but we don't have detailed local intelligence for them yet. Answer based on your general knowledge but mention that real-time data is being gathered.`;
            }
        }

        context += `
Answer the user's question concisely and specifically from the perspective of a ${persona}. 
If you don't know something for certain, say so. Keep the tone professional but accessible.
`;

        const messages = [
            { role: "system", content: context },
            ...history.slice(-5), // Keep last 5 messages for context
            { role: "user", content: message }
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: GROQ_MODEL,
            temperature: 0.7,
            max_tokens: 500,
        });

        return completion.choices[0].message.content;
    } catch (err) {
        console.error("[chatService] Error:", err.message);
        return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
    }
}

module.exports = { getChatResponse };
