import { motion } from "framer-motion";

const REC_CONFIG = {
  "Favorable":             { bg: "rgba(0,200,120,0.15)",  border: "rgba(0,200,120,0.35)",  text: "#00c878", icon: "✅" },
  "Proceed with Caution":  { bg: "rgba(255,179,0,0.15)",  border: "rgba(255,179,0,0.35)",  text: "#ffb300", icon: "⚠️" },
  "Not Recommended":       { bg: "rgba(255,71,87,0.15)",   border: "rgba(255,71,87,0.35)",  text: "#ff4757", icon: "🚫" },
};

function ListItem({ text, prefix, color }) {
  return (
    <li className="flex gap-2 items-start text-sm text-slate-300 leading-snug">
      <span className="text-base shrink-0 mt-0.5">{prefix}</span>
      <span>{text}</span>
    </li>
  );
}

export default function InsightBox({ insight, persona }) {
  if (!insight) return null;

  const { summary, opportunities = [], risks = [], recommendation, recommendation_reason, metrics, specific_details } = insight;
  const cfg = REC_CONFIG[recommendation] || REC_CONFIG["Proceed with Caution"];

  const primaryMetric = persona === 'businessman' ? metrics?.market_growth : 
                        persona === 'student' ? metrics?.academic_reputation : 
                        metrics?.safety_score;

  const indexScore = primaryMetric ? (primaryMetric * 10).toFixed(0) : "75";

  return (
    <div className="space-y-4">
      {/* Primary Score Cockpit */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card bg-surface-950/50 p-5 border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-[60px] rounded-full -mr-16 -mt-16" />
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Recommendation</h4>
            <div className="flex items-center gap-2">
              <span className="text-xl">{cfg.icon}</span>
              <span className="text-lg font-display font-bold" style={{ color: cfg.text }}>{recommendation}</span>
            </div>
          </div>
          <div className="text-right">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              {persona === 'businessman' ? 'Growth Index' : 'Success Index'}
            </h4>
            <span className="text-2xl font-display font-black text-white">
              {indexScore}%
            </span>
          </div>
        </div>

        {/* Metrics Progress Grid */}
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(metrics || {}).map(([key, val], i) => {
            if (typeof val !== 'number') return null;
            const pct = val * 10;
            const color = val > 7 ? "#00c878" : val > 4 ? "#ffb300" : "#ff4757";
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                  <span className="text-slate-400">{key.replace(/_/g, ' ')}</span>
                  <span style={{ color }}>{val} / 10</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.3 + (i * 0.1) }}
                    className="h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{ background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Academics / Stats */}
      {persona === 'student' && insight.student_info && (
        <div className="glass-card-sm p-4 bg-brand-500/[0.03] border border-brand-500/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📊</span>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admission Data</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4 mb-4">
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">Min. Language Score</span>
              <span className="text-sm font-bold text-brand-400">{insight.student_info.language_requirements}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">Success Probability</span>
              <span className="text-sm font-bold text-emerald-400">{insight.metrics?.visa_success_rate || "82%"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {insight.student_info.specializations?.map((spec, i) => (
              <span key={i} className="px-2 py-1 rounded bg-brand-600/20 text-[10px] text-brand-300 font-bold border border-brand-500/20">
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Compact Briefing */}
      {summary && (
        <div className="px-1">
          <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-brand-500/30 pl-3">
            "{summary}"
          </p>
        </div>
      )}

      {/* Opportunities & Risks - Data Style */}
      <div className="grid grid-cols-2 gap-2">
        <div className="glass-card-sm p-3 border-emerald-500/10 bg-emerald-500/[0.02]">
          <h5 className="text-[10px] font-bold text-emerald-500 uppercase mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Upsides
          </h5>
          <div className="space-y-1.5">
            {opportunities.slice(0, 2).map((opp, i) => (
              <p key={i} className="text-[10px] text-slate-400 leading-tight">+ {opp}</p>
            ))}
          </div>
        </div>
        <div className="glass-card-sm p-3 border-red-500/10 bg-red-500/[0.02]">
          <h5 className="text-[10px] font-bold text-red-400 uppercase mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Downsides
          </h5>
          <div className="space-y-1.5">
            {risks.slice(0, 2).map((risk, i) => (
              <p key={i} className="text-[10px] text-slate-400 leading-tight">- {risk}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
