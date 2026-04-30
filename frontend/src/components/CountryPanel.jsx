import { motion, AnimatePresence } from "framer-motion";
import useCountryData from "../hooks/useCountryData";
import SentimentGauge from "./SentimentGauge";
import InsightBox from "./InsightBox";
import TrendChart from "./TrendChart";
import NewsCard from "./NewsCard";
import usePersonaStore from "../store/personaStore";

// Map ISO2 code to flag emoji
function isoToFlag(iso) {
  if (!iso || iso.length !== 2) return "🌐";
  return iso
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

function TopicBar({ label, score = 0 }) {
  const pct = Math.round(((score + 1) / 2) * 100);
  const color = score > 0.3 ? "#00c878" : score < -0.3 ? "#ff4757" : "#ffb300";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-slate-400 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-8 text-right font-mono text-slate-400" style={{ color }}>
        {score >= 0 ? "+" : ""}{score.toFixed(2)}
      </span>
    </div>
  );
}

export default function CountryPanel({ isoCode, countryName, onClose }) {
  const persona = usePersonaStore((s) => s.persona);
  const { data, loading, error } = useCountryData(isoCode);

  return (
    <AnimatePresence>
      {isoCode && (
        <motion.div
          key={isoCode + persona}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="
            fixed right-0 top-0 bottom-0 z-40
            w-full sm:w-[400px] lg:w-[440px]
            flex flex-col
            glass-card rounded-none sm:rounded-l-2xl
            overflow-hidden
          "
          style={{ borderRight: "none" }}
          id="country-panel"
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none">{isoToFlag(isoCode)}</span>
              <div>
                <h2 className="font-display font-bold text-lg leading-tight">
                  {data?.country || countryName || isoCode}
                </h2>
                <p className="text-xs text-slate-500 capitalize">{persona} lens</p>
              </div>
            </div>
            <button
              onClick={onClose}
              id="close-panel-btn"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* ── Scrollable body ──────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Error */}
            {error && (
              <div className="glass-card-sm p-4 border-red-500/30 bg-red-500/10">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Loading skeletons */}
            {loading && !data && (
              <>
                <Skeleton className="h-32" />
                <Skeleton className="h-24" />
                <Skeleton className="h-40" />
              </>
            )}

            {/* ── Sentiment Gauge ───────────────────────────────────────── */}
            {(data?.sentiment || loading) && (
              <section>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Global Sentiment
                </h3>
                {loading && !data ? (
                  <Skeleton className="h-32" />
                ) : (
                  <>
                    <SentimentGauge score={data?.sentiment?.overall_score} />
                    <div className="mt-4 space-y-2">
                      {Object.entries(data?.sentiment?.topic_scores || {}).map(([k, v]) => (
                        <TopicBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} score={v} />
                      ))}
                    </div>
                    {data?.sentiment?.key_themes?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {data.sentiment.key_themes.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/8"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* ── AI Insight ────────────────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                AI Briefing
              </h3>
              {loading && !data ? (
                <Skeleton className="h-48" />
              ) : (
                <InsightBox insight={data?.insight} persona={persona} />
              )}
            </section>

            {/* ── Trend Chart ───────────────────────────────────────────── */}
            <section>
              <TrendChart countryCode={isoCode} />
            </section>

            {/* ── News Articles ─────────────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Live News
              </h3>
              {loading && !data ? (
                <div className="space-y-2">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : data?.articles?.length > 0 ? (
                <div className="space-y-2">
                  {data.articles.map((article, i) => (
                    <NewsCard key={i} article={article} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No articles found.</p>
              )}
            </section>

            {/* ── Footer ────────────────────────────────────────────────── */}
            {data?.last_updated && (
              <p className="text-center text-[10px] text-slate-600 pb-2">
                Updated {new Date(data.last_updated).toLocaleTimeString()}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
