require("dotenv").config({ path: '../.env' });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const countryRoutes = require("./routes/countryRoutes");
const userRoutes = require("./routes/userRoutes");
const { getCountryData } = require("./routes/countryRoutes");
const ISO_TO_NAME = {
    "AF": "Afghanistan", "AL": "Albania", "DZ": "Algeria", "AR": "Argentina",
    "AU": "Australia", "AT": "Austria", "BD": "Bangladesh", "BE": "Belgium",
    "BR": "Brazil", "CA": "Canada", "CL": "Chile", "CN": "China",
    "CO": "Colombia", "HR": "Croatia", "CZ": "Czech Republic", "DK": "Denmark",
    "EG": "Egypt", "ET": "Ethiopia", "FI": "Finland", "FR": "France",
    "DE": "Germany", "GH": "Ghana", "GR": "Greece", "HU": "Hungary",
    "IN": "India", "ID": "Indonesia", "IR": "Iran", "IQ": "Iraq",
    "IE": "Ireland", "IL": "Israel", "IT": "Italy", "JP": "Japan",
    "JO": "Jordan", "KE": "Kenya", "KR": "South Korea", "MX": "Mexico",
    "MA": "Morocco", "NL": "Netherlands", "NZ": "New Zealand", "NG": "Nigeria",
    "NO": "Norway", "PK": "Pakistan", "PE": "Peru", "PH": "Philippines",
    "PL": "Poland", "PT": "Portugal", "RO": "Romania", "RU": "Russia",
    "SA": "Saudi Arabia", "ZA": "South Africa", "ES": "Spain", "SE": "Sweden",
    "CH": "Switzerland", "TH": "Thailand", "TR": "Turkey", "UA": "Ukraine",
    "GB": "United Kingdom", "US": "United States", "VN": "Vietnam",
};

const app = express();
const PORT = process.env.BACKEND_PORT || 8000;

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    dbName: "worldlens"
})
.then(() => {
    console.log("✅ Connected to MongoDB");
    // Background Warmup
    setTimeout(async () => {
        console.log("[Warmup] Starting background intelligence pre-load...");
        const isos = Object.keys(ISO_TO_NAME);
        for (const iso of isos) {
            try {
                // Pre-fetch for student persona
                await getCountryData(iso, "student");
                // Delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (err) {
                console.error(`[Warmup] Failed for ${iso}:`, err.message);
            }
        }
        console.log("[Warmup] Background pre-load complete.");
    }, 5000);
})
.catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api", countryRoutes.router);
app.use("/api/user", userRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "WorldLens API (Node.js)" });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
