require("dotenv").config({ path: '../.env' });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const countryRoutes = require("./routes/countryRoutes");
const userRoutes = require("./routes/userRoutes");
const studentRoutes = require("./routes/studentRoutes");
const travelerRoutes = require("./routes/travelerRoutes");
const compareRoutes = require("./routes/compareRoutes");
const { getCountryData } = require("./routes/countryRoutes");

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
    })
    .catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api", countryRoutes.router);
app.use("/api/user", userRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/traveler", travelerRoutes);
app.use("/api/compare", compareRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "WorldLens API (Node.js)" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT} (Binding: 0.0.0.0)`);
});
