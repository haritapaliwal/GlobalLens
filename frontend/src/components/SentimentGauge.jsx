import { useMemo } from "react";

/**
 * SVG arc gauge showing sentiment score from -1 to +1.
 * Animated needle with color zones.
 */
export default function SentimentGauge({ score = 0 }) {
  const clampedScore = Math.max(-1, Math.min(1, score ?? 0));

  // Convert score (-1..1) to angle (-90°..+90°) for a half-circle gauge
  const angle = clampedScore * 90; // degrees from 12 o'clock baseline

  const { color, label, glow } = useMemo(() => {
    if (clampedScore > 0.3)  return { color: "#00c878", label: "Positive", glow: "rgba(0,200,120,0.4)" };
    if (clampedScore < -0.3) return { color: "#ff4757", label: "Negative", glow: "rgba(255,71,87,0.4)"  };
    return                          { color: "#ffb300", label: "Neutral",  glow: "rgba(255,179,0,0.4)"  };
  }, [clampedScore]);

  // SVG arc helpers
  const cx = 100, cy = 100, r = 72;
  const toRad = (d) => (d * Math.PI) / 180;
  const arcPoint = (deg) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });

  // Arc: 180° → 360° (bottom half flipped to top using transform)
  const start = arcPoint(180), end = arcPoint(0);

  // Needle rotates from -90° (leftmost) to +90° (rightmost)
  const needleRotation = angle; // relative to pointing straight up (270°)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox="0 0 200 115"
        className="w-full max-w-[220px]"
        style={{ filter: `drop-shadow(0 0 18px ${glow})` }}
        aria-label={`Sentiment gauge: ${clampedScore.toFixed(2)}`}
      >
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#ff4757" />
            <stop offset="50%"  stopColor="#ffb300" />
            <stop offset="100%" stopColor="#00c878" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
          fill="none"
          stroke="var(--glass-bg-start)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Colored arc */}
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Zone labels */}
        <text x="22"  y="108" fill="#ff4757" fontSize="9" opacity="0.7" textAnchor="middle">−1</text>
        <text x="100" y="30"  fill="#ffb300" fontSize="9" opacity="0.7" textAnchor="middle">0</text>
        <text x="178" y="108" fill="#00c878" fontSize="9" opacity="0.7" textAnchor="middle">+1</text>

        {/* Needle */}
        <g transform={`rotate(${needleRotation}, ${cx}, ${cy})`}>
          <line
            x1={cx} y1={cy}
            x2={cx} y2={cy - r + 6}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            style={{ transition: "all 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}
          />
          <circle cx={cx} cy={cy} r="5" fill={color} />
          <circle cx={cx} cy={cy} r="3" fill="rgb(var(--surface-900))" />
        </g>

        {/* Score label */}
        <text
          x={cx} y={cy + 22}
          fill={color}
          fontSize="15"
          fontWeight="700"
          fontFamily="Outfit, Inter, sans-serif"
          textAnchor="middle"
        >
          {clampedScore >= 0 ? "+" : ""}{clampedScore.toFixed(2)}
        </text>
      </svg>

      <span
        className="text-xs font-semibold px-3 py-0.5 rounded-full"
        style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
      >
        {label}
      </span>
    </div>
  );
}
