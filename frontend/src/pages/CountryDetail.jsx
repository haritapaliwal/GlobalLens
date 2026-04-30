import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import useCountryData from "../hooks/useCountryData";
import SentimentGauge from "../components/SentimentGauge";
import InsightBox from "../components/InsightBox";
import TrendChart from "../components/TrendChart";
import NewsCard from "../components/NewsCard";
import PersonaSelector from "../components/PersonaSelector";
import usePersonaStore from "../store/personaStore";

function isoToFlag(iso) {
  if (!iso || iso.length !== 2) return "🌐";
  return iso.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
}

export default function CountryDetail() {
  const { iso } = useParams();
  const navigate = useNavigate();
  const persona = usePersonaStore((s) => s.persona);
  const { data, loading, error } = useCountryData(iso?.toUpperCase());

  return (
    <div className="min-h-screen bg-surface-900 px-4 py-6 sm:px-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Map
          </button>
          <PersonaSelector />
        </div>

        {error && (
          <div className="glass-card p-6 text-red-400 text-sm text-center mb-6">{error}</div>
        )}

        {/* Country header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6 flex items-center gap-4"
        >
          <span className="text-5xl">{isoToFlag(iso)}</span>
          <div>
            <h1 className="font-display font-bold text-2xl gradient-text">
              {loading ? iso?.toUpperCase() : (data?.country || iso?.toUpperCase())}
            </h1>
            <p className="text-sm text-slate-400 mt-1 capitalize">{persona} intelligence briefing</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sentiment */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Sentiment Analysis
            </h2>
            {loading ? (
              <div className="skeleton h-40 w-full" />
            ) : (
              <SentimentGauge score={data?.sentiment?.overall_score} />
            )}
          </motion.div>

          {/* Trend */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6"
          >
            <TrendChart countryCode={iso?.toUpperCase()} />
          </motion.div>

          {/* Insight */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 md:col-span-2"
          >
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              AI Briefing
            </h2>
            {loading ? (
              <div className="skeleton h-48 w-full" />
            ) : (
              <InsightBox insight={data?.insight} persona={persona} />
            )}
          </motion.div>

          {/* News */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-6 md:col-span-2"
          >
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Live News
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(data?.articles || []).map((a, i) => <NewsCard key={i} article={a} />)}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
