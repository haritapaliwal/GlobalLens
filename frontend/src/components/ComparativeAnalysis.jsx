import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell
} from "recharts";
import axios from "axios";
import usePersonaStore from "../store/personaStore";

const PIE_COLORS = ["#00e68e", "#00b8d9", "#ffb300", "#ff6b6b", "#a78bfa"];

const PERSONA_CHART_KEYS = {
  student: [
    { key: "tuitionUSD", label: "Tuition (USD/yr)", color: "#00b8d9" },
    { key: "livingCostUSD", label: "Living Cost (USD/yr)", color: "#00e68e" },
  ],
  traveler: [
    { key: "avgTripCostUSD", label: "Total Trip Cost", color: "#ffb300" },
    { key: "flightCostUSD", label: "Flight Cost", color: "#ff6b6b" },
  ],
  investor: [
    { key: "gdpGrowthPct", label: "GDP Growth %", color: "#a78bfa" },
    { key: "startupEcosystemScore", label: "Startup Score", color: "#00e68e" },
  ],
  default: [
    { key: "overallScore", label: "Overall Score", color: "#00e68e" },
    { key: "qualityOfLifeScore", label: "Quality of Life", color: "#00b8d9" },
  ],
};

const PERSONA_PIE_KEYS = {
  student: ["tuitionUSD", "livingCostUSD", "scholarshipChance"],
  traveler: ["flightCostUSD", "avgTripCostUSD", "dailyCostUSD"],
  investor: ["gdpGrowthPct", "fdiInflow", "taxFriendlinessScore"],
  default: ["overallScore", "safetyIndex", "costOfLivingIndex"],
};

// Describes exactly what the donut chart is showing
const PIE_CHART_META = {
  student:  { title: "Tuition Fee Share",  subtitle: "Annual tuition cost (USD) per country", isUSD: true },
  traveler: { title: "Flight Cost Share",   subtitle: "Avg round-trip flight cost (USD) per destination", isUSD: true },
  investor: { title: "GDP Growth Share",    subtitle: "Annual GDP growth rate (%) per country", isUSD: false },
  default:  { title: "Overall Score Share", subtitle: "Composite quality score per country", isUSD: false },
};

function formatUSD(val) {
  if (!val && val !== 0) return "N/A";
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val}`;
}

export default function ComparativeAnalysis({ isOpen, onClose, selectedISO }) {
  const { persona, personaDetails, userCountry, selectedCountries } = usePersonaStore();

  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chartKeys = PERSONA_CHART_KEYS[persona] || PERSONA_CHART_KEYS.default;
  const pieKeys = PERSONA_PIE_KEYS[persona] || PERSONA_PIE_KEYS.default;

  const fetchComparison = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        persona,
        domain: personaDetails?.domain || "",
        budget: personaDetails?.budget || "",
        duration: personaDetails?.duration || "",
        homeCountry: userCountry || "India",
        selectedCountries: selectedCountries?.length > 0
          ? selectedCountries
          : ["United States", "United Kingdom", "Canada", "Germany", "Australia"],
        selectedISO,
      };
      const res = await axios.post("/api/compare", payload);
      if (res.data.success) {
        setAiData(res.data.data);
      } else {
        setError("Could not load comparison data.");
      }
    } catch (err) {
      console.error("[ComparativeAnalysis] Fetch error:", err);
      setError("Failed to fetch comparison. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isOpen, persona, personaDetails, userCountry, selectedCountries, selectedISO]);

  useEffect(() => {
    if (isOpen) fetchComparison();
  }, [isOpen]);

  // Derive pie chart data from chartData
  const pieData = useMemo(() => {
    if (!aiData?.chartData) return [];
    return aiData.chartData.slice(0, 5).map((item, i) => ({
      name: item.name,
      value: item[pieKeys[0]] || item[chartKeys[0]?.key] || 0,
    }));
  }, [aiData, pieKeys, chartKeys]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 22 }}
            className="relative w-full sm:w-[92vw] max-w-5xl h-full sm:h-[88vh] flex flex-col overflow-hidden shadow-2xl sm:rounded-2xl border-t sm:border border-brand-500/30"
            style={{ background: "rgba(8, 12, 26, 0.97)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-brand-500/5 shrink-0">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  📊 Comprehensive Comparison
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 normal-case font-medium capitalize">
                    {persona} Lens
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {personaDetails?.domain && `Domain: ${personaDetails.domain}`}
                  {personaDetails?.budget && ` · Budget: ${personaDetails.budget}`}
                  {personaDetails?.duration && ` · Duration: ${personaDetails.duration}`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-10 h-10 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
                  <p className="text-sm text-slate-400">Analysing with WorldLens AI...</p>
                  <p className="text-xs text-slate-600">Fetching factual data for your profile</p>
                </div>
              )}

              {error && !loading && (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <p className="text-sm text-red-400">{error}</p>
                  <button onClick={fetchComparison} className="text-xs text-brand-400 underline">Retry</button>
                </div>
              )}

              {!loading && !error && aiData && (
                <div className="flex flex-col gap-8">

                  {/* ── Summary Banner ── */}
                  <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-slate-200 leading-relaxed">{aiData.summary}</p>
                    </div>
                    {aiData.bestPick && (
                      <div className="shrink-0 text-left md:text-right border-t md:border-t-0 md:border-l border-brand-500/20 pt-3 md:pt-0 md:pl-4">
                        <p className="text-[10px] text-brand-400 uppercase tracking-widest mb-1">🏆 Best Pick</p>
                        <p className="text-lg font-bold text-white">{aiData.bestPick.country}</p>
                        <p className="text-[11px] text-slate-400 max-w-[180px]">{aiData.bestPick.reason}</p>
                      </div>
                    )}
                  </div>

                  {/* ── Charts Row ── */}
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Bar Chart */}
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        {persona === "student" ? "Annual Costs Comparison (USD)" : persona === "traveler" ? "Trip Cost Breakdown (USD)" : "Economic Metrics"}
                      </h3>
                      <div className="min-h-[220px]">
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={aiData.chartData || []} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false}
                              tickFormatter={(v) => (persona === "investor") ? v : formatUSD(v)}
                            />
                            <Tooltip
                              cursor={{ fill: "rgba(255,255,255,0.04)" }}
                              contentStyle={{ background: "rgba(8,12,26,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                              formatter={(val, name) => [(persona === "investor") ? val : formatUSD(val), name]}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                            {chartKeys.map(({ key, label, color }) => (
                              <Bar key={key} dataKey={key} name={label} fill={color} radius={[4, 4, 0, 0]} barSize={22} />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="w-full lg:w-[280px] flex flex-col border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-6">
                      {/* Dynamic title */}
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-0.5 text-center">
                        {(PIE_CHART_META[persona] || PIE_CHART_META.default).title}
                      </h3>
                      <p className="text-[10px] text-slate-500 text-center mb-4">
                        {(PIE_CHART_META[persona] || PIE_CHART_META.default).subtitle}
                      </p>
                      <ResponsiveContainer width="100%" height={170}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                            paddingAngle={4} dataKey="value" stroke="none">
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: "rgba(8,12,26,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                            formatter={(val, name) => [
                              (PIE_CHART_META[persona] || PIE_CHART_META.default).isUSD ? formatUSD(val) : `${val}%`,
                              name
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Legend with values */}
                      <div className="flex flex-col gap-1.5 mt-3 px-2">
                        {pieData.map((item, i) => {
                          const meta = PIE_CHART_META[persona] || PIE_CHART_META.default;
                          const displayVal = meta.isUSD ? formatUSD(item.value) : `${item.value}%`;
                          return (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="text-[10px] text-slate-400">{item.name}</span>
                              </div>
                              <span className="text-[10px] font-semibold" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>
                                {displayVal}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ── Country-by-Country Insights ── */}
                  {aiData.countryInsights?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Country-by-Country Analysis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {aiData.countryInsights.map((item, i) => (
                          <div key={i} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-bold text-white">{item.country}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400">
                                {item.verdict}
                              </span>
                            </div>
                            <p className="text-[11px] text-green-400 mb-1">✓ {item.pros}</p>
                            <p className="text-[11px] text-red-400/80">✗ {item.cons}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Intelligence Summary ── */}
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                      Deep Intelligence · {persona} Lens
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiData.budgetFit && (
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                          <p className="text-[10px] text-brand-400 uppercase tracking-widest mb-2 font-bold">💰 Budget Analysis</p>
                          <p className="text-xs text-slate-300 leading-relaxed">{aiData.budgetFit}</p>
                        </div>
                      )}
                      {aiData.domainInsight && (
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                          <p className="text-[10px] text-[#00e68e] uppercase tracking-widest mb-2 font-bold">🎯 Domain Insight</p>
                          <p className="text-xs text-slate-300 leading-relaxed">{aiData.domainInsight}</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
