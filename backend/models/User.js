const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  homeCountry: { type: String, required: true },
  persona: { type: String, required: true },
  personaDetails: { type: Map, of: String },
  selectedCountries: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
