import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WorldMap from "../components/WorldMap";
import CountryPanel from "../components/CountryPanel";
import PersonaSelector from "../components/PersonaSelector";
import ThemeToggle from "../components/ThemeToggle";
import UserProfileBadge from "../components/UserProfileBadge";
import LandingFlow from "../components/LandingFlow";
import PersonaNewsFeed from "../components/PersonaNewsFeed";

export default function Home() {
  const [selectedISO, setSelectedISO] = useState(null);
  const [selectedName, setSelectedName] = useState(null);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [showLanding, setShowLanding] = useState(true);

  const handleCountrySelect = (iso, name) => {
    setSelectedISO(iso);
    setSelectedName(name);
  };

  const handleDataLoaded = () => {
    // Incrementing this will trigger the WorldMap to re-fetch scores
    setMapRefreshKey(prev => prev + 1);
  };

  const handleClose = () => {
    setSelectedISO(null);
    setSelectedName(null);
  };

  const handleLandingFinish = () => {
    setShowLanding(false);
  };

  return (
    <div className="relative w-screen min-h-screen bg-surface-900" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── Landing Flow Overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {showLanding && (
          <LandingFlow onFinish={handleLandingFinish} />
        )}
      </AnimatePresence>

      {/* ── Full-screen map ─────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ height: '100vh', flexShrink: 0 }}>
        <WorldMap 
          onCountrySelect={handleCountrySelect} 
          refreshKey={mapRefreshKey}
        />
      </div>

      {/* ── Top header bar ──────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-30 px-5 pt-5 flex items-start justify-between pointer-events-none">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card px-4 py-3 pointer-events-auto"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌐</span>
            <div>
              <h1 className="font-display font-bold text-base leading-none gradient-text">
                WorldLens
              </h1>
              <p className="text-[10px] text-slate-500 mt-0.5">Global Decision Intelligence</p>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="pulse-dot" />
              <span className="text-[10px] text-brand-400 font-medium">LIVE</span>
            </div>
          </div>
        </motion.div>

        {/* Profile, Persona selector and Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pointer-events-auto flex items-center gap-3"
        >
          <UserProfileBadge />
          <PersonaSelector onChangePersona={() => setShowLanding(true)} />
          <ThemeToggle />
        </motion.div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 left-5 z-30 glass-card px-4 py-3"
      >
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">
          Sentiment Legend
        </p>
        <div className="flex flex-col gap-1.5">
          {[
            { color: "#00c878", label: "Positive  (> 0.3)"  },
            { color: "#ffb300", label: "Neutral (±0.3)"     },
            { color: "#ff4757", label: "Negative (< −0.3)"  },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: color, opacity: 0.85 }} />
              <span className="text-[10px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Click-to-explore hint ────────────────────────────────────────── */}
      <AnimatePresence>
        {!selectedISO && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 1 }}
            className="absolute bottom-6 right-5 z-30 glass-card px-4 py-3 text-center"
          >
            <p className="text-[10px] text-slate-500 mb-0.5">Click any country</p>
            <p className="text-xs text-slate-300 font-medium">to explore intelligence</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Country Detail Panel ─────────────────────────────────────────── */}
      <CountryPanel
        isoCode={selectedISO}
        countryName={selectedName}
        onClose={handleClose}
        onDataLoaded={handleDataLoaded}
      />

      {/* Dim overlay behind panel on mobile */}
      <AnimatePresence>
        {selectedISO && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Persona News Feed (always visible at bottom) ─────────────────── */}
      <PersonaNewsFeed />
    </div>
  );
}
