import React from "react";
import { motion } from "framer-motion";

export default function EconomicSummary({ data, loading, persona }) {
  if (loading && !data) {
    return <div className="space-y-3">
      <div className="h-20 w-full skeleton rounded-xl" />
      <div className="h-10 w-full skeleton rounded-xl" />
    </div>;
  }

  if (!data?.economic_data) return null;

  const { ppp, gdp_per_capita, cost_of_living, housing_score } = data.economic_data;

  // Customize layout based on persona
  const isBusiness = persona === "businessman";
  const isStudent = persona === "student";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Market Metrics
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {/* GDP per Capita */}
        <div className="glass-card-sm p-3 bg-white/[0.01] border border-white/5">
          <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">GDP / Capita</span>
          <span className="text-sm font-display font-black text-white">
            ${Math.round(gdp_per_capita / 1000)}k
          </span>
        </div>

        {/* PPP Ratio */}
        <div className="glass-card-sm p-3 bg-white/[0.01] border border-white/5">
          <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">PPP Ratio</span>
          <span className="text-sm font-display font-black text-emerald-400">
            {ppp ? ppp.toFixed(2) : "1.00"}
          </span>
        </div>

        {/* Cost Index */}
        <div className="glass-card-sm p-3 bg-white/[0.01] border border-white/5">
          <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Cost of Living</span>
          <span className="text-sm font-display font-black text-brand-400">
            {cost_of_living ? cost_of_living.toFixed(1) : "N/A"} <span className="text-[10px] text-slate-500 font-normal">/ 10</span>
          </span>
        </div>

        {/* Housing Index */}
        <div className="glass-card-sm p-3 bg-white/[0.01] border border-white/5">
          <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Housing Affordability</span>
          <span className="text-sm font-display font-black text-orange-400">
            {housing_score ? housing_score.toFixed(1) : "N/A"} <span className="text-[10px] text-slate-500 font-normal">/ 10</span>
          </span>
        </div>
      </div>
    </motion.section>
  );
}
