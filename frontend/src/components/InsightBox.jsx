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

  const { summary, opportunities = [], risks = [], recommendation, recommendation_reason } = insight;
  const cfg = REC_CONFIG[recommendation] || REC_CONFIG["Proceed with Caution"];

  return (
    <div className="space-y-4">
      {/* Recommendation badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl p-4"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{cfg.icon}</span>
          <span className="font-semibold text-sm" style={{ color: cfg.text }}>
            {recommendation}
          </span>
        </div>
        {recommendation_reason && (
          <p className="text-xs text-slate-400 leading-relaxed">{recommendation_reason}</p>
        )}
      </motion.div>

      {/* Metrics Grid */}
      {insight.metrics && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="grid grid-cols-2 gap-3"
        >
          {Object.entries(insight.metrics).map(([key, val], i) => (
            <div key={key} className="glass-card-sm p-3 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">
                {key.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center justify-between">
                {typeof val === 'number' ? (
                  <>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 mr-2">
                      <div 
                        className="h-full rounded-full transition-all duration-700" 
                        style={{ 
                          width: `${val * 10}%`, 
                          background: val > 7 ? "#00c878" : val > 4 ? "#ffb300" : "#ff4757" 
                        }} 
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-300">{val}/10</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-brand-400">{val}</span>
                )}
              </div>
            </div>
          ))}

        </motion.div>
      )}

      {/* Top Cities / Hotspots */}
      {insight.top_cities && insight.top_cities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="glass-card-sm p-4"
        >
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {persona === 'student' ? 'University Hotspots' : 'Recommended Hubs'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {insight.top_cities.map((city, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
                📍 {city}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Student Specific Academics */}
      {persona === 'student' && insight.student_info && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="glass-card-sm p-4 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Scores</h4>
              <p className="text-sm text-brand-400 font-bold">{insight.student_info.language_requirements}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Instruction</h4>
              <p className="text-xs text-slate-300">{insight.student_info.medium_of_instruction}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Top Specializations</h4>
            <div className="flex flex-wrap gap-1.5">
              {insight.student_info.specializations?.map((spec, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 text-[10px] font-bold border border-brand-500/20">
                  {spec.includes('STEM') ? '🚀' : spec.includes('Arts') ? '🎨' : spec.includes('Medicine') ? '🏥' : '📚'} {spec}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}


      {/* Summary */}

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-sm p-4"
        >
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Briefing
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
        </motion.div>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card-sm p-4"
        >
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Opportunities
          </h4>
          <ul className="space-y-2">
            {opportunities.map((opp, i) => (
              <ListItem key={i} text={opp} prefix="✅" />
            ))}
          </ul>
        </motion.div>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card-sm p-4"
        >
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Risks
          </h4>
          <ul className="space-y-2">
            {risks.map((risk, i) => (
              <ListItem key={i} text={risk} prefix="⚠️" />
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
