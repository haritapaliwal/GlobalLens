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
