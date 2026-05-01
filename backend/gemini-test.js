require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function runTest() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
    });

    try {
        console.log("⏳ Running test with 'gemini-2.5-flash'...");
        const result = await model.generateContent("Hello");
        console.log("✅ Response:");
        console.log(result.response.text());
    } catch (err) {
        console.error("❌ Test Failed:");
        console.error(err.message);
    }
}

runTest();

