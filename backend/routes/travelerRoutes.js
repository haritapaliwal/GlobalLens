const express = require("express");
const router = express.Router();

// Mock static database
const TRAVELER_DB = {
  "TH": {
    "overheads": {
      "visa": "2,500 THB (e-Visa) or 2,000 THB (Visa on Arrival)",
      "entryTax": "300 THB tourist entry tax for air arrivals",
      "baselineFlight": "$341"
    },
    "regions": [
      {
        "name": "Bangkok",
        "style": ["luxury resort seeker", "budget backpacker", "digital nomad"],
        "description": "Bustling capital with rich culture, street food, and vibrant nightlife.",
        "accommodations": [
          { "type": "Mid-tier Hostel", "name": "Siam Eco Hostel", "price": "$34/night", "style": "budget backpacker" },
          { "type": "Luxury Hotel", "name": "Mandarin Oriental", "price": "$400/night", "style": "luxury resort seeker" },
          { "type": "Coliving", "name": "Lanna Hub", "price": "12,000 THB/mo", "style": "digital nomad" }
        ],
        "attractions": [
          { "name": "The Grand Palace", "price": "500 THB" },
          { "name": "Wat Pho", "price": "300 THB" },
          { "name": "Wat Arun", "price": "200 THB" }
        ],
        "costs": { "meal": 100, "streetFood": 60, "transport": 25 } // THB
      },
      {
        "name": "Chiang Mai",
        "style": ["digital nomad", "budget backpacker"],
        "description": "Mountainous region known for ancient temples and digital nomad hubs.",
        "accommodations": [
          { "type": "Ultra-budget Hostel", "name": "The Common Hostel", "price": "$12/night", "style": "budget backpacker" },
          { "type": "Coliving Space", "name": "Hub53", "price": "9,000 to 9,500 THB/mo", "style": "digital nomad" }
        ],
        "attractions": [
          { "name": "Ethical Elephant Sanctuary", "price": "$40 - $80" },
          { "name": "Doi Suthep Temple", "price": "50 THB" }
        ],
        "costs": { "meal": 80, "streetFood": 40, "transport": 30 } // THB
      },
      {
        "name": "Phuket",
        "style": ["luxury resort seeker", "budget backpacker"],
        "description": "Beautiful beaches, island hopping, and vibrant nightlife.",
        "accommodations": [
          { "type": "Budget Hostel", "name": "Mad Monkey", "price": "$14/night", "style": "budget backpacker" },
          { "type": "Mid-tier", "name": "The Luna", "price": "$25 - $30/night", "style": "budget backpacker" },
          { "type": "Luxury Resort", "name": "Amanpuri", "price": "$800/night", "style": "luxury resort seeker" }
        ],
        "attractions": [
          { "name": "Phi Phi Island Tour", "price": "1,500 THB" },
          { "name": "Big Buddha", "price": "Free" }
        ],
        "costs": { "meal": 150, "streetFood": 80, "transport": 200, "rental": 250 } // THB
      }
    ]
  },
  "DEFAULT": {
    "overheads": {
      "visa": "$50 standard entry fee",
      "entryTax": "No extra tax",
      "baselineFlight": "$500"
    },
    "regions": [
      {
        "name": "Capital City",
        "style": ["luxury resort seeker", "budget backpacker", "digital nomad"],
        "description": "The main hub of the country.",
        "accommodations": [
          { "type": "Hostel", "name": "Central Backpackers", "price": "$20/night", "style": "budget backpacker" },
          { "type": "Hotel", "name": "Grand Stay", "price": "$150/night", "style": "luxury resort seeker" }
        ],
        "attractions": [
          { "name": "National Museum", "price": "$15" },
          { "name": "City Tour", "price": "$25" }
        ],
        "costs": { "meal": 15, "streetFood": 8, "transport": 3 } // USD
      }
    ]
  }
};

function parseBudget(budgetStr) {
  if (!budgetStr) return 2000;
  const match = budgetStr.match(/\d+/g);
  if (match) return parseInt(match.join(""), 10);
  return 2000;
}

function parseDuration(durStr) {
  if (!durStr) return 14;
  const num = parseInt(durStr.match(/\d+/)?.[0] || "14", 10);
  if (durStr.toLowerCase().includes("week")) return num * 7;
  if (durStr.toLowerCase().includes("month")) return num * 30;
  return num;
}

const { searchTravelInfo } = require("../services/tavilyService");

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
  "SG": "Singapore", "MY": "Malaysia"
};

router.get("/:iso", async (req, res) => {
  try {
    const iso = req.params.iso.toUpperCase();
    const { domain, budget: budgetStr, duration: durStr, homeCountry } = req.query;

    const budget = parseBudget(budgetStr);
    const duration = parseDuration(durStr);
    const style = domain ? domain.toLowerCase() : "budget backpacker";

    let countryData = TRAVELER_DB[iso] ? JSON.parse(JSON.stringify(TRAVELER_DB[iso])) : JSON.parse(JSON.stringify(TRAVELER_DB["DEFAULT"]));

    const destCountryName = ISO_TO_NAME[iso] || "the destination country";
    const homeCountryName = homeCountry ? (ISO_TO_NAME[homeCountry.toUpperCase()] || homeCountry) : "United States";

    // Try fetching dynamic data
    const aiData = await searchTravelInfo(destCountryName, homeCountryName, style);

    if (aiData) {
      if (aiData.visa) countryData.overheads.visa = aiData.visa;
      if (aiData.entryTax) countryData.overheads.entryTax = aiData.entryTax;

      // Use the full regions array returned by AI (5-6 real destinations)
      if (aiData.regions && Array.isArray(aiData.regions) && aiData.regions.length > 0) {
        if (iso !== "TH") {
          // For non-TH countries, fully replace with AI data
          countryData.regions = aiData.regions;
        } else {
          // For TH, prepend AI results to our curated static data
          countryData.regions = [...aiData.regions, ...countryData.regions];
        }
      }
    } else {
      // Fallback: at least give context-specific visa hint
      countryData.overheads.visa = `Verify current visa requirements for ${homeCountryName} → ${destCountryName} on your government's travel portal.`;
    }


    // Filter regions by style
    let matchingRegions = countryData.regions.filter(r =>
      r.style && r.style.some(s => s.toLowerCase().includes(style) || style.includes(s.toLowerCase()))
    );
    if (matchingRegions.length === 0) {
      matchingRegions = countryData.regions;
    }

    // Calculate expenses (mocked authentic logic)
    const isTH = iso === "TH";
    let baseTransport = 5 * duration;
    let baseFood = 30 * duration;
    let accommodationCost = 50 * duration;
    let attractionCost = 50 * (duration / 3);

    // If dynamic data had costs, use them
    const regionCosts = matchingRegions[0]?.costs;
    if (regionCosts) {
      baseFood = (regionCosts.meal * 3) * duration;
      baseTransport = regionCosts.transport * duration;
    }

    const flightCost = 341;
    const totalCalc = flightCost + accommodationCost + baseFood + baseTransport + attractionCost;

    const responseData = {
      country: iso,
      overheads: countryData.overheads,
      regions: matchingRegions,
      expenseBreakdown: {
        flightCost: flightCost,
        accommodationFee: accommodationCost,
        attractionFees: attractionCost,
        extraExpenditure: baseFood,
        localTransportation: baseTransport,
        totalTrip: totalCalc,
        withinBudget: totalCalc <= budget
      }
    };

    return res.json(responseData);
  } catch (err) {
    console.error("[traveler-route] Error:", err);
    res.status(500).json({ error: "Failed to fetch traveler data" });
  }
});

module.exports = router;
