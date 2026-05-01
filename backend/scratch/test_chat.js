const axios = require("axios");

async function testChat() {
    try {
        console.log("Testing Chat API...");
        const response = await axios.post("http://localhost:8000/api/chat", {
            message: "What are the opportunities for a student in India?",
            isoCode: "IN",
            persona: "student"
        });
        console.log("Chat Response:", response.data.response);
    } catch (err) {
        console.error("Chat API Error:", err.response ? err.response.data : err.message);
    }
}

testChat();
