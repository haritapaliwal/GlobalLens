import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const LINE_COLORS = {
  overall_score: "#00c878",
  safety:        "#60a5fa",
  economy:       "#f59e0b",
  education:     "#a78bfa",
  immigration:   "#f472b6",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card-sm p-3 text-xs">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-300 capitalize">{entry.dataKey.replace("_", " ")}:</span>
          <span className="font-semibold" style={{ color: entry.color }}>
            {Number(entry.value).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TrendChart({ countryCode }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!countryCode) return;
    setLoading(true);
    axios
      .get(`/api/sentiment/${countryCode}/history`)
      .then((res) => setHistory(res.data?.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [countryCode]);

  if (loading) {
    return <div className="skeleton h-32 w-full" />;
  }

  if (!history.length) {
    return (
      <div className="flex items-center justify-center h-28 glass-card-sm">
        <p className="text-xs text-slate-500">Not enough data yet</p>
      </div>
    );
  }

  return (
    <div className="glass-card-sm p-3">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        7-Day Sentiment Trend
      </h4>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={history} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#4a5568", fontSize: 9 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[-1, 1]}
            tick={{ fill: "#4a5568", fontSize: 9 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {Object.entries(LINE_COLORS).map(([key, color]) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={1.5}
              dot={{ r: 2, fill: color }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
