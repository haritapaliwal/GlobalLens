const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/profile", async (req, res) => {
  try {
    const { name, homeCountry, persona, personaDetails, selectedCountries } = req.body;
    
    // In a real app, we might check for existing user by name/email
    // For now, we'll just create a new entry every time or update based on name
    let user = await User.findOneAndUpdate(
      { name }, 
      { name, homeCountry, persona, personaDetails, selectedCountries },
      { upsert: true, new: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    console.error("Error saving user profile:", err);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

module.exports = router;
