const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { searchTravelInfo } = require('./services/tavilyService');

async function test() {
    console.log("Testing searchTravelInfo for United States from India...");
    const data = await searchTravelInfo("United States", "India", "luxury resort seeker");
    console.log("Result:", JSON.stringify(data, null, 2));
}

test();
