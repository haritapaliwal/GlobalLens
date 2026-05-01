import React from "react";
import { motion } from "framer-motion";

export default function EconomicSummary({ data, loading, persona }) {
  if (loading && !data) {
    return <div className="h-24 w-full skeleton rounded-xl" />;
  }

  if (!data?.economic_data) return null;

  const { ppp, gdp_per_capita, cost_of_living, housing_score, summary } = data.economic_data;

  // Customize layout based on persona
  const isBusiness = persona === "businessman";
  const isStudent = persona === "student";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Economic Intelligence
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {/* Primary Metric 1 */}
        <div className="glass-card-sm p-3 flex flex-col justify-center">
          <span className="text-[10px] text-slate-500 uppercase">
            {isBusiness ? "PPP Ratio" : "Affordability"}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-white">
              {ppp ? ppp.toFixed(2) : "N/A"}
            </span>
          </div>
        </div>

        {/* Primary Metric 2 */}
        <div className="glass-card-sm p-3 flex flex-col justify-center">
          <span className="text-[10px] text-slate-500 uppercase">
            {isStudent ? "Housing Score" : "Cost Index"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">
              {isStudent ? (housing_score?.toFixed(1) || "N/A") : (Math.round(cost_of_living * 10) || "N/A")}
            </span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${(isStudent ? (housing_score || 0) : (cost_of_living || 0) * 10)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
          <span className="text-slate-500 block">GDP per Capita</span>
          <span className="text-emerald-400 font-bold">${Math.round(gdp_per_capita).toLocaleString()}</span>
        </div>
        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
          <span className="text-slate-500 block">Market Signal</span>
          <span className="text-blue-400 font-bold">{isBusiness ? "Stable" : "Accessible"}</span>
        </div>
      </div>

      {summary && (
        <div 
          className="text-[11px] text-slate-400 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5"
          dangerouslySetInnerHTML={{ __html: summary }}
        />
      )}
    </motion.section>
  );
}
