/**
 * ConfidenceBadge — pill badge for article confidence level.
 * Low → red   Medium → amber   High → green
 */
const CONFIG = {
  High:   { bg: "rgba(0,200,120,0.15)",  text: "#00c878", border: "rgba(0,200,120,0.3)"  },
  Medium: { bg: "rgba(255,179,0,0.15)",  text: "#ffb300", border: "rgba(255,179,0,0.3)"  },
  Low:    { bg: "rgba(255,71,87,0.15)",  text: "#ff4757", border: "rgba(255,71,87,0.3)"  },
};

export default function ConfidenceBadge({ level = "Low" }) {
  const cfg = CONFIG[level] || CONFIG.Low;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cfg.text }} />
      {level}
    </span>
  );
}
