const mongoose = require("mongoose");

const CountrySnapshotSchema = new mongoose.Schema({
    country: String,
    iso_code: { type: String, index: true },
    persona: { type: String, index: true },
    home_country: { type: String, index: true },
    persona_details: mongoose.Schema.Types.Mixed,
    sentiment: {
        overall_score: Number,
        topic_scores: {
            safety: Number,
            economy: Number,
            education: Number,
            immigration: Number
        },
        dominant_sentiment: String,
        key_themes: [String]
    },
    economic_data: {
        ppp: Number,
        gdp_per_capita: Number,
        cost_of_living: Number,
        housing_score: Number,
        summary: String
    },
    insight: mongoose.Schema.Types.Mixed,
    articles: [{
        title: String,
        description: String,
        url: String,
        source: String,
        publishedAt: String,
        confidence: String
    }],
    last_updated: { type: Date, default: Date.now },
    timestamp: { type: Date, default: Date.now, index: true }
});

// Compound index for the most common query pattern (Tier 2 cache lookup)
CountrySnapshotSchema.index({ iso_code: 1, persona: 1, home_country: 1, timestamp: -1 });

module.exports = mongoose.model("CountrySnapshot", CountrySnapshotSchema, "country_snapshots");
