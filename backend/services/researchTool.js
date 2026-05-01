const { webSearch } = require("./tavilyService");

/**
 * Tavily Research Tool
 * This tool allows the AI to perform real-time web searches to gather up-to-date information.
 */
const researchTool = {
    /**
     * The tool definition in OpenAI/Groq function calling format.
     */
    definition: {
        type: "function",
        function: {
            name: "research",
            description: "Search the web for up-to-date information, news, or specific facts. Use this when the user asks about current events, specific details not in the context, or when you need real-time data to provide an accurate answer.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query to look up on the web. Be specific to get the best results."
                    }
                },
                required: ["query"]
            }
        }
    },

    /**
     * Executes the research tool using the Tavily API.
     * @param {Object} args - The arguments passed by the LLM.
     * @returns {Promise<Object>} - The search results and summary.
     */
    execute: async (args) => {
        const { query } = args;
        if (!query) return { error: "No query provided" };
        
        console.log(`[researchTool] Executing search for: "${query}"`);
        return await webSearch(query);
    }
};

module.exports = researchTool;
