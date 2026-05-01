import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import usePersonaStore from "../store/personaStore";

const PIE_COLORS = ["#00e68e", "#00b8d9", "#ffb300", "#ff6b6b", "#a78bfa"];

function formatUSD(val) {
  return `$${val.toLocaleString()}`;
}

function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

function RegionCard({ region, isSelected, onSelect }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(region)}
      className={`student-college-card ${isSelected ? "selected" : ""}`}
      style={{
        width: "100%", textAlign: "left", padding: "14px", borderRadius: 14,
        border: isSelected ? "1.5px solid rgba(0,230,142,0.5)" : "1px solid var(--glass-border)",
        background: isSelected
          ? "linear-gradient(135deg, rgba(0,230,142,0.08), rgba(0,184,217,0.04))"
          : "linear-gradient(135deg, var(--glass-bg-start), var(--glass-bg-end))",
        cursor: "pointer", marginBottom: 8, transition: "all 0.25s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "rgb(var(--slate-300))", margin: 0, lineHeight: 1.4 }}>
            {region.name}
          </p>
          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
            {region.style.map((s, i) => (
              <span key={i} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 5, background: "rgba(0,184,217,0.1)", color: "#00b8d9", border: "1px solid rgba(0,184,217,0.15)" }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p style={{ marginTop: 8, fontSize: 11, color: "rgb(var(--slate-400))", lineHeight: 1.4, borderTop: "1px solid rgb(var(--surface-700))", paddingTop: 8 }}>
        {region.description}
      </p>
    </motion.button>
  );
}

function AccommodationCard({ option }) {
  const displayPrice = /[$€£¥₹]/.test(option.price) ? option.price : `$${option.price}`;
  return (
    <div style={{
      padding: "12px", borderRadius: 12, border: "1px solid var(--glass-border)",
      background: "linear-gradient(135deg, var(--glass-bg-start), var(--glass-bg-end))", marginBottom: 6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(0,184,217,0.1)", color: "#00b8d9" }}>
          {option.type}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#00e68e" }}>{displayPrice}</span>
      </div>
      <p style={{ fontSize: 12, color: "rgb(var(--slate-300))", margin: "4px 0 2px", fontWeight: 600 }}>{option.name}</p>
      <p style={{ fontSize: 10, color: "rgb(var(--slate-500))", margin: 0 }}>Ideal for {option.style}</p>
    </div>
  );
}

function AttractionCard({ attraction }) {
  const displayPrice = (attraction.price.toLowerCase() === "free" || /[$€£¥₹]/.test(attraction.price)) 
    ? attraction.price 
    : `$${attraction.price}`;
    
  return (
    <div style={{
      padding: "12px", borderRadius: 12, border: "1px solid var(--glass-border)",
      background: "linear-gradient(135deg, var(--glass-bg-start), var(--glass-bg-end))", marginBottom: 6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgb(var(--slate-300))", margin: 0 }}>{attraction.name}</p>
        <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700 }}>{displayPrice}</span>
      </div>
    </div>
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
        {formatUSD(payload[0].value)}
      </p>
    </div>
  );
}

export default function TravelerCountryPanel({ isoCode, countryName }) {
  const personaDetails = usePersonaStore((s) => s.personaDetails);
  const userCountry = usePersonaStore((s) => s.userCountry);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    regions: true, accommodation: true, attractions: true, expenses: true, overheads: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (!isoCode) return;
    setLoading(true);
    setError(null);
    setSelectedRegion(null);

    const params = new URLSearchParams();
    if (personaDetails?.domain) params.append("domain", personaDetails.domain);
    if (personaDetails?.duration) params.append("duration", personaDetails.duration);
    if (personaDetails?.budget) params.append("budget", personaDetails.budget);
    if (userCountry) params.append("homeCountry", userCountry);

    axios.get(`/api/traveler/${isoCode}?${params.toString()}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => { setError("Failed to load traveler data"); setLoading(false); console.error(err); });
  }, [isoCode, personaDetails?.domain, personaDetails?.duration, personaDetails?.budget, userCountry]);

  const accommodationList = useMemo(() => {
    if (!data) return [];
    if (selectedRegion) return selectedRegion.accommodations;
    return data.regions[0]?.accommodations || [];
  }, [data, selectedRegion]);

  const attractionsList = useMemo(() => {
    if (!data) return [];
    if (selectedRegion) return selectedRegion.attractions;
    return data.regions[0]?.attractions || [];
  }, [data, selectedRegion]);

  const pieData = useMemo(() => {
    if (!data?.expenseBreakdown) return [];
    const eb = data.expenseBreakdown;
    return [
      { name: "Flight", value: eb.flightCost },
      { name: "Accommodation", value: eb.accommodationFee },
      { name: "Attractions/Tours", value: eb.attractionFees },
      { name: "Food/Extras", value: eb.extraExpenditure },
      { name: "Local Transport", value: eb.localTransportation },
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

      {/* ── SECTION 0: MANDATORY OVERHEADS ──────────────────────────────── */}
      <section>
        <button onClick={() => toggleSection("overheads")} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "0 0 8px",
        }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: "rgb(var(--slate-500))", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            🛂 Sovereign Overheads & Flights
          </h3>
          <span style={{ fontSize: 10, color: "rgb(var(--slate-500))", transition: "transform 0.2s", transform: expandedSections.overheads ? "rotate(180deg)" : "rotate(0)" }}>
            ▼
          </span>
        </button>
        <AnimatePresence>
          {expandedSections.overheads && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid var(--glass-border)", background: "rgba(255,179,0,0.05)" }}>
                <p style={{ fontSize: 11, color: "rgb(var(--slate-300))", margin: "0 0 4px" }}><strong>Visa Costs:</strong> {data.overheads.visa}</p>
                <p style={{ fontSize: 11, color: "rgb(var(--slate-300))", margin: "0 0 4px" }}><strong>Entry Tax:</strong> {data.overheads.entryTax}</p>
                <p style={{ fontSize: 11, color: "rgb(var(--slate-300))", margin: 0 }}><strong>Avg Round Trip Flight:</strong> {data.overheads.baselineFlight}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── SECTION 1: TOP REGIONS ──────────────────────────────── */}
      <section>
        <button onClick={() => toggleSection("regions")} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "0 0 8px",
        }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: "rgb(var(--slate-500))", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            🗺️ Suggested Regions ({data.regions.length})
          </h3>
          <span style={{ fontSize: 10, color: "rgb(var(--slate-500))", transition: "transform 0.2s", transform: expandedSections.regions ? "rotate(180deg)" : "rotate(0)" }}>
            ▼
          </span>
        </button>
        <AnimatePresence>
          {expandedSections.regions && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
              {data.regions.length > 0 ? (
                data.regions.map((region, i) => (
                  <RegionCard
                    key={i}
                    region={region}
                    isSelected={selectedRegion?.name === region.name}
                    onSelect={setSelectedRegion}
                  />
                ))
              ) : (
                <div style={{ padding: 20, textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: "rgb(var(--slate-500))" }}>No regions found matching your criteria.</p>
                </div>
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
            🏨 Accommodation {selectedRegion ? `in ${selectedRegion.name}` : "Options"}
          </h3>
          <span style={{ fontSize: 10, color: "rgb(var(--slate-500))", transition: "transform 0.2s", transform: expandedSections.accommodation ? "rotate(180deg)" : "rotate(0)" }}>
            ▼
          </span>
        </button>
        <AnimatePresence>
          {expandedSections.accommodation && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
              {accommodationList.map((opt, i) => (
                <AccommodationCard key={i} option={opt} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── SECTION 3: ATTRACTIONS ──────────────────────────────── */}
      <section>
        <button onClick={() => toggleSection("attractions")} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "0 0 8px",
        }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: "rgb(var(--slate-500))", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            📸 Top Experiences
          </h3>
          <span style={{ fontSize: 10, color: "rgb(var(--slate-500))", transition: "transform 0.2s", transform: expandedSections.attractions ? "rotate(180deg)" : "rotate(0)" }}>
            ▼
          </span>
        </button>
        <AnimatePresence>
          {expandedSections.attractions && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
              {attractionsList.map((attr, i) => (
                <AttractionCard key={i} attraction={attr} />
              ))}
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
            📊 Estimated Trip Expenses
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
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <p style={{ fontSize: 10, color: "rgb(var(--slate-500))", margin: 0 }}>Total Trip Estimate</p>
                  <p style={{ fontSize: 24, fontWeight: 800, margin: "4px 0 0" }}>
                    <span style={{ background: "linear-gradient(135deg, #00e68e, #00b8d9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {formatUSD(data.expenseBreakdown.totalTrip)}
                    </span>
                  </p>
                  {!data.expenseBreakdown.withinBudget && (
                    <span style={{ fontSize: 9, background: "rgba(255,71,87,0.12)", color: "#ff6b6b", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                      Exceeds Budget
                    </span>
                  )}
                </div>

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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
