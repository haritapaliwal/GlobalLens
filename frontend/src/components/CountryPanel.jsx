import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import useCountryData from "../hooks/useCountryData";
import SentimentGauge from "./SentimentGauge";
import InsightBox from "./InsightBox";
import TrendChart from "./TrendChart";
import NewsCard from "./NewsCard";
import EconomicSummary from "./EconomicSummary";
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

export default function CountryPanel({ isoCode, countryName, onClose, onDataLoaded }) {
  const persona = usePersonaStore((s) => s.persona);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isoCode) {
      setData(null);
      setError(null);
      return;
    }

    const fetchData = async () => {
      let isCancelled = false;
      
      setLoading(true);
      setError(null);
      setData(null); // Reset immediately so we don't show old data

      try {
        const res = await axios.get(`/api/country/${isoCode}`, {
          params: { persona },
        });
        
        if (!isCancelled) {
          setData(res.data);
          if (onDataLoaded) onDataLoaded();
        }
      } catch (err) {
        if (!isCancelled) {
          setError("Failed to load country data.");
          console.error(err);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }

      return () => { isCancelled = true; };
    };

    const cleanup = fetchData();
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, [isoCode, persona]);

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

            {/* ── Sentiment Pulse ─────────────────────────────────────────── */}
            {data?.sentiment && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {persona === "businessman" ? "Market Sentiment" : 
                     persona === "student" ? "Immigrant Reception" : "Public Opinion"}
                  </h3>
                  <div className="flex gap-2">
                    {data.sentiment.key_themes?.slice(0, 2).map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-medium border border-brand-500/20">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <SentimentGauge 
                    score={data.sentiment.overall_score} 
                    label={persona === "businessman" ? "Trade Stability" : "Overall Pulse"}
                  />
                  <div className="space-y-3">
                    <TopicBar label="Safety" score={data.sentiment.topic_scores?.safety} />
                    <TopicBar label={persona === "businessman" ? "Economy" : "Opportunity"} score={data.sentiment.topic_scores?.economy} />
                  </div>
                </div>
              </section>
            )}

            {/* ── Economic Intelligence ─────────────────────────────────── */}
            <EconomicSummary data={data} loading={loading} persona={persona} />

            {/* ── AI Intelligence Briefing ────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {persona.charAt(0).toUpperCase() + persona.slice(1)} Intelligence Briefing
              </h3>
              <InsightBox 
                insight={data?.insight} 
                loading={loading} 
                persona={persona}
              />
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
