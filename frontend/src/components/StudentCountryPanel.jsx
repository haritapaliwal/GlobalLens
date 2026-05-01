import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import usePersonaStore from "../store/personaStore";

const PIE_COLORS = ["#00e68e", "#00b8d9", "#ffb300", "#ff6b6b", "#a78bfa"];

function formatUSD(val) {
  return `$${val.toLocaleString()}`;
}

function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

function RankBadge({ label, rank }) {
  const bg = rank <= 10 ? "rgba(0,230,142,0.15)" : rank <= 50 ? "rgba(0,184,217,0.15)" : rank <= 100 ? "rgba(255,179,0,0.15)" : "rgba(255,255,255,0.06)";
  const color = rank <= 10 ? "#00e68e" : rank <= 50 ? "#00b8d9" : rank <= 100 ? "#ffb300" : "rgb(var(--slate-400))";
  return (
    <span style={{ background: bg, color, padding: "2px 7px", borderRadius: 6, fontSize: 10, fontWeight: 700, marginRight: 4 }}>
      {label} #{rank}
    </span>
  );
}

function CollegeCard({ college, isSelected, onSelect }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(college)}
      className={`student-college-card ${isSelected ? "selected" : ""}`}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "14px",
        borderRadius: 14,
        border: isSelected ? "1.5px solid rgba(0,230,142,0.5)" : "1px solid var(--glass-border)",
        background: isSelected
          ? "linear-gradient(135deg, rgba(0,230,142,0.08), rgba(0,184,217,0.04))"
          : "linear-gradient(135deg, var(--glass-bg-start), var(--glass-bg-end))",
        cursor: "pointer",
        marginBottom: 8,
        transition: "all 0.25s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "rgb(var(--slate-300))", margin: 0, lineHeight: 1.4 }}>
            {college.name}
          </p>
          <p style={{ fontSize: 11, color: "rgb(var(--slate-500))", margin: "3px 0 0" }}>
            📍 {college.city}
          </p>
        </div>
        {!college.withinBudget && (
          <span style={{ fontSize: 9, background: "rgba(255,71,87,0.12)", color: "#ff6b6b", padding: "2px 8px", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap" }}>
            Over Budget
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
        <RankBadge label="QS" rank={college.qsRank} />
        <RankBadge label="THE" rank={college.theRank} />
        <RankBadge label="ARWU" rank={college.arwuRank} />
        <RankBadge label="USN" rank={college.usNewsRank} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 10, color: "rgb(var(--slate-500))" }}>Annual Fee: </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#00e68e" }}>{formatUSD(college.annualFee)}</span>
        </div>
        <div>
          <span style={{ fontSize: 10, color: "rgb(var(--slate-500))" }}>~Monthly: </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgb(var(--slate-400))" }}>{formatUSD(college.monthlyFee)}/mo</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
        {college.domain?.slice(0, 3).map((d, i) => (
          <span key={i} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 5, background: "rgba(0,184,217,0.1)", color: "#00b8d9", border: "1px solid rgba(0,184,217,0.15)" }}>
            {d}
          </span>
        ))}
        {college.hasHostel && (
          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 5, background: "rgba(0,230,142,0.1)", color: "#00e68e", border: "1px solid rgba(0,230,142,0.15)" }}>
            🏠 Hostel
          </span>
        )}
      </div>
    </motion.button>
  );
}

function AccommodationCard({ option }) {
  const typeColors = {
    "University Hostel": { bg: "rgba(0,230,142,0.1)", color: "#00e68e", icon: "🏛️" },
    "Paying Guest (PG)": { bg: "rgba(255,179,0,0.1)", color: "#ffb300", icon: "🏠" },
    "Private Hostel": { bg: "rgba(0,184,217,0.1)", color: "#00b8d9", icon: "🏨" },
    "Budget Hostel": { bg: "rgba(167,139,250,0.1)", color: "#a78bfa", icon: "💰" },
    "Standard PG": { bg: "rgba(255,179,0,0.1)", color: "#ffb300", icon: "🏠" },
    "Private Room": { bg: "rgba(0,184,217,0.1)", color: "#00b8d9", icon: "🛏️" },
  };
  const style = typeColors[option.type] || typeColors["Budget Hostel"];

  return (
    <div style={{
      padding: "12px", borderRadius: 12, border: "1px solid var(--glass-border)",
      background: "linear-gradient(135deg, var(--glass-bg-start), var(--glass-bg-end))", marginBottom: 6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: style.bg, color: style.color }}>
          {style.icon} {option.type}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#00e68e" }}>{formatUSD(option.monthlyRent)}/mo</span>
      </div>
      <p style={{ fontSize: 12, color: "rgb(var(--slate-300))", margin: "4px 0 2px", fontWeight: 600 }}>{option.name}</p>
      <p style={{ fontSize: 10, color: "rgb(var(--slate-500))", margin: 0 }}>{option.description}</p>
    </div>
  );
}

function ScholarshipCard({ scholarship, from }) {
  return (
    <a href={scholarship.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
      <div style={{
        padding: "12px", borderRadius: 12, border: "1px solid var(--glass-border)",
        background: "linear-gradient(135deg, var(--glass-bg-start), var(--glass-bg-end))", marginBottom: 6,
        transition: "all 0.2s", cursor: "pointer",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,230,142,0.3)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.transform = "none"; }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgb(var(--slate-300))", margin: 0, flex: 1, lineHeight: 1.4 }}>
            {scholarship.name}
          </p>
          <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 6,
            background: from === "home" ? "rgba(167,139,250,0.12)" : "rgba(0,184,217,0.12)",
            color: from === "home" ? "#a78bfa" : "#00b8d9"
          }}>
            {from === "home" ? "🏠 Home" : "🎯 Destination"}
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#00e68e", fontWeight: 700, margin: "4px 0" }}>{scholarship.amount}</p>
        <p style={{ fontSize: 10, color: "rgb(var(--slate-500))", margin: 0 }}>{scholarship.eligibility}</p>
        <p style={{ fontSize: 9, color: "rgb(var(--slate-600))", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 3 }}>
          🔗 Learn more
        </p>
      </div>
    </a>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(12px)",
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>{payload[0].name}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: payload[0].payload.fill, margin: "4px 0 0" }}>
        {formatUSD(payload[0].value)}/mo
      </p>
    </div>
  );
}

export default function StudentCountryPanel({ isoCode, countryName }) {
  const personaDetails = usePersonaStore((s) => s.personaDetails);
  const userCountry = usePersonaStore((s) => s.userCountry);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    colleges: true, accommodation: true, scholarships: true, expenses: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (!isoCode) return;
    setLoading(true);
    setError(null);
    setSelectedCollege(null);

    const params = new URLSearchParams();
    if (personaDetails?.domain) params.append("domain", personaDetails.domain);
    if (personaDetails?.budget) params.append("budget", personaDetails.budget);
    if (userCountry) params.append("homeCountry", userCountry);

    axios.get(`/api/student/${isoCode}?${params.toString()}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => { setError("Failed to load student data"); setLoading(false); console.error(err); });
  }, [isoCode, personaDetails?.domain, personaDetails?.budget, userCountry]);

  const accommodationList = useMemo(() => {
    if (!data) return [];
    if (selectedCollege) {
      const match = data.accommodation.byCollege.find(a => a.college === selectedCollege.name);
      return match ? match.options : data.accommodation.generic;
    }
    return data.accommodation.generic;
  }, [data, selectedCollege]);

  const pieData = useMemo(() => {
    if (!data?.expenseBreakdown) return [];
    const eb = data.expenseBreakdown;
    return [
      { name: "University Fee", value: eb.universityFee },
      { name: "Hostel / Rent", value: eb.hostelFee },
      { name: "Groceries", value: eb.groceries },
      { name: "Dining Out", value: eb.dining },
      { name: "Transportation", value: eb.transportation },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4" style={{ padding: "4px 0" }}>
        <Skeleton className="h-8" />
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card-sm" style={{ padding: 14, borderColor: "rgba(255,71,87,0.3)", background: "rgba(255,71,87,0.05)" }}>
        <p style={{ fontSize: 13, color: "#ff6b6b", margin: 0 }}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── SECTION 1: TOP COLLEGES ──────────────────────────────── */}
      <section>
        <button onClick={() => toggleSection("colleges")} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "0 0 8px",
        }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: "rgb(var(--slate-500))", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            🎓 Top Universities ({data.colleges.length})
          </h3>
          <span style={{ fontSize: 10, color: "rgb(var(--slate-500))", transition: "transform 0.2s", transform: expandedSections.colleges ? "rotate(180deg)" : "rotate(0)" }}>
            ▼
          </span>
        </button>
        <AnimatePresence>
          {expandedSections.colleges && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
              {data.colleges.length > 0 ? (
                data.colleges.map((college, i) => (
                  <CollegeCard
                    key={i}
                    college={college}
                    isSelected={selectedCollege?.name === college.name}
                    onSelect={setSelectedCollege}
                  />
                ))
              ) : (
                <div style={{ padding: 20, textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: "rgb(var(--slate-500))" }}>No universities found for this country matching your criteria.</p>
                </div>
              )}
              {personaDetails?.domain && (
                <p style={{ fontSize: 9, color: "rgb(var(--slate-600))", marginTop: 4, fontStyle: "italic" }}>
                  Filtered by: {personaDetails.domain} | Budget: {personaDetails.budget || "Any"}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── SECTION 2: ACCOMMODATION ──────────────────────────────── */}
      <section>
        <button onClick={() => toggleSection("accommodation")} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "0 0 8px",
        }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: "rgb(var(--slate-500))", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            🏠 Accommodation {selectedCollege ? `near ${selectedCollege.city}` : "Options"}
          </h3>
          <span style={{ fontSize: 10, color: "rgb(var(--slate-500))", transition: "transform 0.2s", transform: expandedSections.accommodation ? "rotate(180deg)" : "rotate(0)" }}>
            ▼
          </span>
        </button>
        <AnimatePresence>
          {expandedSections.accommodation && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
              {selectedCollege && (
                <p style={{ fontSize: 10, color: "#00b8d9", marginBottom: 8, fontWeight: 600 }}>
                  Showing accommodation near {selectedCollege.name}
                </p>
              )}
              {!selectedCollege && (
                <p style={{ fontSize: 10, color: "rgb(var(--slate-600))", marginBottom: 8, fontStyle: "italic" }}>
                  💡 Select a university above to see specific accommodation options
                </p>
              )}
              {accommodationList.map((opt, i) => (
                <AccommodationCard key={i} option={opt} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── SECTION 3: SCHOLARSHIPS ──────────────────────────────── */}
      <section>
        <button onClick={() => toggleSection("scholarships")} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "0 0 8px",
        }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: "rgb(var(--slate-500))", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            🎖️ Scholarships ({(data.scholarships.fromHomeCountry?.length || 0) + (data.scholarships.inDestination?.length || 0)})
          </h3>
          <span style={{ fontSize: 10, color: "rgb(var(--slate-500))", transition: "transform 0.2s", transform: expandedSections.scholarships ? "rotate(180deg)" : "rotate(0)" }}>
            ▼
          </span>
        </button>
        <AnimatePresence>
          {expandedSections.scholarships && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
              {data.scholarships.fromHomeCountry?.length > 0 && (
                <>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", marginBottom: 6, marginTop: 2 }}>
                    From {data.scholarships.homeCountryName || "Your Home Country"}
                  </p>
                  {data.scholarships.fromHomeCountry.map((s, i) => (
                    <ScholarshipCard key={`h-${i}`} scholarship={s} from="home" />
                  ))}
                </>
              )}
              {data.scholarships.inDestination?.length > 0 && (
                <>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#00b8d9", marginBottom: 6, marginTop: 10 }}>
                    In {data.country}
                  </p>
                  {data.scholarships.inDestination.map((s, i) => (
                    <ScholarshipCard key={`d-${i}`} scholarship={s} from="dest" />
                  ))}
                </>
              )}
              {(!data.scholarships.fromHomeCountry?.length && !data.scholarships.inDestination?.length) && (
                <p style={{ fontSize: 12, color: "rgb(var(--slate-500))", textAlign: "center", padding: 16 }}>
                  No specific scholarships found. Check university websites for more options.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── SECTION 4: EXPENSE PIE CHART ──────────────────────────── */}
      <section>
        <button onClick={() => toggleSection("expenses")} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "0 0 8px",
        }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: "rgb(var(--slate-500))", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            📊 Monthly Expense Breakdown
          </h3>
          <span style={{ fontSize: 10, color: "rgb(var(--slate-500))", transition: "transform 0.2s", transform: expandedSections.expenses ? "rotate(180deg)" : "rotate(0)" }}>
            ▼
          </span>
        </button>
        <AnimatePresence>
          {expandedSections.expenses && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
              <div style={{
                padding: "16px 12px", borderRadius: 14, border: "1px solid var(--glass-border)",
                background: "linear-gradient(135deg, var(--glass-bg-start), var(--glass-bg-end))",
              }}>
                {/* Total */}
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <p style={{ fontSize: 10, color: "rgb(var(--slate-500))", margin: 0 }}>Estimated Total Monthly</p>
                  <p style={{ fontSize: 24, fontWeight: 800, margin: "4px 0 0" }}>
                    <span style={{ background: "linear-gradient(135deg, #00e68e, #00b8d9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {formatUSD(data.expenseBreakdown.totalMonthly)}
                    </span>
                    <span style={{ fontSize: 12, color: "rgb(var(--slate-500))", fontWeight: 500 }}>/month</span>
                  </p>
                </div>

                {/* Pie Chart */}
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend items */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {pieData.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i], flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "rgb(var(--slate-400))" }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "rgb(var(--slate-300))" }}>{formatUSD(item.value)}</span>
                    </div>
                  ))}
                </div>

                {/* Data source note */}
                <p style={{ fontSize: 8, color: "rgb(var(--slate-600))", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
                  * Estimates based on Numbeo cost-of-living data. Transport = 2 trips/day × 22 days. Dining = ~8 meals/month outside.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
