const mongoose = require("mongoose");

const CountrySnapshotSchema = new mongoose.Schema({
    country: String,
    iso_code: String,
    persona: String,
    persona_details: { type: Map, of: String },
    details_hash: String,
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
    insight: {
        summary: String,
        opportunities: [String],
        risks: [String],
        recommendation: String,
        recommendation_reason: String,
        metrics: {
            visa_difficulty: Number,
            visa_success_rate: String,
            housing_availability: Number,
            safety_score: Number,
            cost_of_living: Number
        },
        student_info: {
            language_requirements: String,
            medium_of_instruction: String,
            specializations: [String]
        },
        top_cities: [String]
    },
    articles: [{
        title: String,
        description: String,
        url: String,
        source: String,
        publishedAt: String,
        confidence: String
    }],
    last_updated: { type: Date, default: Date.now },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CountrySnapshot", CountrySnapshotSchema, "country_snapshots");
