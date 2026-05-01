const express = require("express");
const router = express.Router();
const collegeDB = require("../data/collegeDatabase.json");
const costData = require("../data/costOfLiving.json");
const scholarshipDB = require("../data/scholarships.json");
const { searchColleges } = require("../services/tavilyService");

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
    "SG": "Singapore", "MY": "Malaysia",
};

/**
 * Parse budget string from LandingFlow (e.g. "< $1,000", "$1,000 - $2,500", "$2,500 - $5,000", "$5,000+")
 * Returns the upper bound of the monthly budget in USD
 */
function parseBudgetMax(budgetStr) {
    if (!budgetStr) return Infinity;
    // URL decoding might convert '+' to space
    if (budgetStr.includes("5,000+") || budgetStr.includes("5,000 ") || budgetStr.includes("5000+") || budgetStr.includes("5000 ")) return Infinity;
    if (budgetStr.includes("2,500") && budgetStr.includes("5,000")) return 5000;
    if (budgetStr.includes("1,000") && budgetStr.includes("2,500")) return 2500;
    if (budgetStr.includes("< $1,000") || budgetStr.includes("<$1,000") || budgetStr.trim() === "$1,000") return 1000;
    // Try to parse any number
    const nums = budgetStr.match(/[\d,]+/g);
    if (nums && nums.length > 0) {
        const last = parseInt(nums[nums.length - 1].replace(/,/g, ""));
        return isNaN(last) ? Infinity : last;
    }
    return Infinity;
}

/**
 * Match colleges by domain interest using fuzzy keyword matching
 */
function matchesDomain(collegeDomains, userDomain) {
    if (!userDomain) return true;
    if (!collegeDomains) return false;
    
    // Ensure collegeDomains is an array
    const domains = Array.isArray(collegeDomains) ? collegeDomains : [collegeDomains];
    
    const terms = userDomain.toLowerCase().split(/[\s,;]+/).filter(Boolean);
    return domains.some(d => {
        const dl = d.toLowerCase();
        return terms.some(t => dl.includes(t) || t.includes(dl.substring(0, 4)));
    });
}

/**
 * Calculate composite rank from multiple ranking systems
 */
function compositeRank(college) {
    const ranks = [college.qsRank, college.theRank, college.arwuRank, college.usNewsRank].filter(r => r && r < 9999);
    if (ranks.length === 0) return 9999;
    return ranks.reduce((a, b) => a + b, 0) / ranks.length;
}

// ── GET /api/student/:isoCode ────────────────────────────────────────────
router.get("/:isoCode", async (req, res) => {
    try {
        const isoCode = req.params.isoCode.toUpperCase();
        const countryName = ISO_TO_NAME[isoCode];
        if (!countryName) return res.status(404).json({ error: "Country not found" });

        const { domain, budget, homeCountry, city } = req.query;
        const monthlyBudgetMax = parseBudgetMax(budget);

        // Find ISO code for homeCountry name if needed
        let homeISO = homeCountry ? homeCountry.toUpperCase() : null;
        if (homeISO && homeISO.length > 2) {
            // It's a name, find the code
            const entry = Object.entries(ISO_TO_NAME).find(([code, name]) => name.toUpperCase() === homeISO);
            if (entry) homeISO = entry[0];
        }

        // ── 1. COLLEGES ──────────────────────────────────────────────
        let allColleges = collegeDB[countryName] || [];

        // Try to get live data from Tavily to suggest more better colleges using rankings
        try {
            const liveColleges = await searchColleges(countryName, domain);
            if (liveColleges && liveColleges.length > 0) {
                // Prepend live colleges, avoiding duplicates from static DB
                const liveNames = new Set(liveColleges.map(c => c.name.toLowerCase()));
                const filteredStatic = allColleges.filter(c => !liveNames.has(c.name.toLowerCase()));
                allColleges = [...liveColleges, ...filteredStatic];
            }
        } catch (err) {
            console.error("Tavily live search error:", err);
        }

        let filteredColleges = allColleges;

        // Filter by domain
        if (domain) {
            filteredColleges = filteredColleges.filter(c => matchesDomain(c.domain, domain));
        }

        // Filter by city if provided
        if (city) {
            const cityLower = city.toLowerCase();
            const cityFiltered = filteredColleges.filter(c => c.city.toLowerCase().includes(cityLower));
            if (cityFiltered.length > 0) filteredColleges = cityFiltered;
        }

        // Sort all colleges by composite ranking first
        filteredColleges.sort((a, b) => compositeRank(a) - compositeRank(b));

        let selectedColleges = [];

        if (monthlyBudgetMax < Infinity) {
            const withinBudget = filteredColleges.filter(c => (c.annualFee / 12) <= monthlyBudgetMax);
            const overBudget = filteredColleges.filter(c => (c.annualFee / 12) > monthlyBudgetMax);

            // Take up to 3 within budget, and up to 2 over budget
            const numWithin = Math.min(withinBudget.length, 3);
            const numOver = Math.min(overBudget.length, 5 - numWithin);
            
            // If we have fewer over-budget colleges, we can take more within-budget
            const finalNumWithin = Math.min(withinBudget.length, 5 - numOver);

            selectedColleges = [
                ...withinBudget.slice(0, finalNumWithin),
                ...overBudget.slice(0, numOver)
            ];

            // Re-sort the combined list by ranking
            selectedColleges.sort((a, b) => compositeRank(a) - compositeRank(b));
        } else {
            selectedColleges = filteredColleges.slice(0, 5);
        }

        // Map the results
        const topColleges = selectedColleges.map(c => ({
            ...c,
            name: c.name || "Unknown University",
            city: c.city || "Various",
            domain: Array.isArray(c.domain) ? c.domain : (c.domain ? [c.domain] : []),
            annualFee: c.annualFee || 15000,
            compositeRank: Math.round(compositeRank(c)),
            monthlyFee: Math.round((c.annualFee || 15000) / 12),
            withinBudget: monthlyBudgetMax === Infinity || ((c.annualFee || 15000) / 12) <= monthlyBudgetMax
        }));

        // ── 2. HOSTEL & ACCOMMODATION ────────────────────────────────
        const hostelAvg = costData.hostelMonthlyAverage[countryName] || 300;
        
        const accommodationOptions = topColleges.map(college => {
            const options = [];
            if (college.hasHostel) {
                options.push({
                    type: "University Hostel",
                    name: `${college.name} - Student Residence`,
                    monthlyRent: college.hostelFee ? Math.round(college.hostelFee / 12) : Math.round(hostelAvg * 0.8),
                    description: "On-campus student accommodation (two-seater)"
                });
            }
            options.push({
                type: "Paying Guest (PG)",
                name: `PG near ${college.city} campus area`,
                monthlyRent: Math.round(hostelAvg * 0.9),
                description: "Shared accommodation near university"
            });
            options.push({
                type: "Private Hostel",
                name: `Private hostel in ${college.city}`,
                monthlyRent: Math.round(hostelAvg),
                description: "Private hostel with basic amenities"
            });
            return { college: college.name, city: college.city, options };
        });

        // Generic accommodation for the country (before selecting a college)
        const genericAccommodation = [
            {
                type: "Budget Hostel",
                name: `Budget accommodation in ${countryName}`,
                monthlyRent: Math.round(hostelAvg * 0.7),
                description: "Affordable shared hostel rooms"
            },
            {
                type: "Standard PG",
                name: `Paying guest in ${countryName}`,
                monthlyRent: Math.round(hostelAvg * 0.9),
                description: "Standard shared accommodation"
            },
            {
                type: "Private Room",
                name: `Private room in ${countryName}`,
                monthlyRent: Math.round(hostelAvg * 1.2),
                description: "Private room in shared apartment"
            }
        ];

        // ── 3. SCHOLARSHIPS ──────────────────────────────────────────
        const homeCountryScholarships = homeISO ? (scholarshipDB.byHomeCountry[homeISO] || []) : [];
        const destCountryScholarships = scholarshipDB.byDestinationCountry[countryName] || [];

        // ── 4. EXPENSE PIE CHART DATA ────────────────────────────────
        const avgAnnualFee = topColleges.length > 0
            ? topColleges.reduce((s, c) => s + c.annualFee, 0) / topColleges.length
            : (allColleges.length > 0 ? allColleges[0].annualFee : 10000);
        const monthlyUniFee = Math.round(avgAnnualFee / 12);

        const monthlyHostelFee = Math.round(hostelAvg / 2); // Two-seater = half

        const transportCost = costData.transportation[countryName] || 1.0;
        const monthlyTransport = Math.round(transportCost * 2 * 22); // 2 trips/day, 22 days/month

        const mealCost = costData.restaurantMeal[countryName] || 10;
        const monthlyDining = Math.round(mealCost * 8); // ~8 restaurant meals/month

        const monthlyGroceries = costData.groceriesMonthly[countryName] || 200;

        const totalMonthly = monthlyUniFee + monthlyHostelFee + monthlyTransport + monthlyDining + monthlyGroceries;

        const expenseBreakdown = {
            universityFee: monthlyUniFee,
            hostelFee: monthlyHostelFee,
            transportation: monthlyTransport,
            dining: monthlyDining,
            groceries: monthlyGroceries,
            totalMonthly,
            currency: "USD"
        };

        res.json({
            country: countryName,
            isoCode,
            colleges: topColleges,
            accommodation: {
                generic: genericAccommodation,
                byCollege: accommodationOptions
            },
            scholarships: {
                fromHomeCountry: homeCountryScholarships,
                inDestination: destCountryScholarships,
                homeCountryName: homeISO ? ISO_TO_NAME[homeISO] : null
            },
            expenseBreakdown
        });
    } catch (err) {
        console.error("[student-route] Error:", err);
        res.status(500).json({ error: "Failed to fetch student data" });
    }
});

module.exports = router;
