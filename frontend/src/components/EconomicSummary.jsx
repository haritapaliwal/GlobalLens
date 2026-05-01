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

      <div className="grid grid-cols-3 gap-2">
        {/* GDP per Capita */}
        <div className="glass-card-sm p-3 bg-white/[0.01] border border-white/5">
          <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">GDP/Capita</span>
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
          <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Living Cost</span>
          <span className="text-sm font-display font-black text-brand-400">
            {Math.round(cost_of_living * 10)}%
          </span>
        </div>
      </div>

      {/* Main Comparative Bar */}
      <div className="glass-card-sm p-4 bg-white/[0.02] border border-white/5 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Economic Vitality</span>
            <span className="text-xs font-black text-white">
              {isBusiness ? "High Growth" : isStudent ? "Accessible" : "Moderate"}
            </span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "68%" }}
              className="h-full bg-gradient-to-r from-brand-600 to-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
          <div>
            <span className="text-[9px] text-slate-500 uppercase block">Housing Index</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{housing_score?.toFixed(1) || "6.5"}</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full">
                <div className="h-full bg-orange-500 w-2/3 rounded-full" />
              </div>
            </div>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block">Local Stability</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">8.2</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full">
                <div className="h-full bg-emerald-500 w-[82%] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
