import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WorldMap from "../components/WorldMap";
import CountryPanel from "../components/CountryPanel";
import PersonaSelector from "../components/PersonaSelector";
import ThemeToggle from "../components/ThemeToggle";
import UserProfileBadge from "../components/UserProfileBadge";
import LandingFlow from "../components/LandingFlow";
import PersonaNewsFeed from "../components/PersonaNewsFeed";
import ChatBot from "../components/ChatBot";

export default function Home() {
  const [selectedISO, setSelectedISO] = useState(null);
  const [selectedName, setSelectedName] = useState(null);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [showLanding, setShowLanding] = useState(true);
  const [isFlowActive, setIsFlowActive] = useState(false);
  const [pendingCountry, setPendingCountry] = useState(null);

  const handleCountrySelect = (iso, name) => {
    if (showLanding) {
      setPendingCountry({ iso, name });
      setIsFlowActive(true);
    } else {
      setSelectedISO(iso);
      setSelectedName(name);
    }
  };

  const handleDataLoaded = () => {
    setMapRefreshKey(prev => prev + 1);
  };

  const handleClose = () => {
    setSelectedISO(null);
    setSelectedName(null);
  };

  const handleLandingFinish = () => {
    setShowLanding(false);
    setIsFlowActive(false);
    if (pendingCountry) {
      setSelectedISO(pendingCountry.iso);
      setSelectedName(pendingCountry.name);
      setPendingCountry(null);
    }
  };

  return (
    <div className="relative w-screen min-h-screen bg-surface-900 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── Landing Flow Overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {isFlowActive && (
          <LandingFlow onFinish={handleLandingFinish} />
        )}
      </AnimatePresence>

      {/* ── Full-screen map ─────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ height: '100vh', flexShrink: 0 }}>
        <WorldMap 
          onCountrySelect={handleCountrySelect} 
          refreshKey={mapRefreshKey}
        />
        
        {/* Premium Welcome Heading (Only shown before landing) */}
        <AnimatePresence>
          {showLanding && !isFlowActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 bg-black/10 backdrop-blur-[2px]"
            >
              <motion.div 
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", damping: 20 }}
                className="text-center px-6"
              >
                <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 backdrop-blur-md">
                   <span className="text-xs font-bold tracking-widest text-brand-400 uppercase">Intelligence for a Global World</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-display font-bold text-white mb-6 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] tracking-tight">
                  Welcome to <span className="gradient-text">WorldLens</span>
                </h1>
                <p className="text-lg md:text-2xl text-slate-200 max-w-3xl mx-auto drop-shadow-lg font-light leading-relaxed">
                  Navigate the complexities of our changing planet with 
                  <span className="text-white font-medium"> real-time AI intelligence</span> 
                  tailored to your journey.
                </p>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 1 }}
                  className="mt-12 flex flex-col items-center gap-4"
                >
                  <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                    </span>
                    <span className="text-sm font-medium text-slate-300">Click any country on the map to begin</span>
                  </div>
                  <motion.div 
                    animate={{ y: [0, 10, 0] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-2xl opacity-50"
                  >
                    🖱️
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Top header bar ──────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-40 px-5 pt-5 flex items-start justify-between pointer-events-none">
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
            {!showLanding && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="pulse-dot" />
                <span className="text-[10px] text-brand-400 font-medium">LIVE</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Profile, Persona selector and Theme Toggle (Only show after landing) */}
        {!showLanding && (
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
        )}
      </div>

      {/* ── Legend (Only show after landing) ────────────────────────────── */}
      <AnimatePresence>
        {!showLanding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-28 left-5 z-30 glass-card px-4 py-3"
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
        )}
      </AnimatePresence>

      {/* ── Click-to-explore hint (Only show after landing) ──────────────── */}
      <AnimatePresence>
        {!showLanding && !selectedISO && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 1 }}
            className="absolute bottom-24 right-24 z-30 glass-card px-4 py-3 text-center"
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

      {/* ── Chatbot (Only show after landing) ────────────────────────────── */}
      {!showLanding && (
        <ChatBot selectedISO={selectedISO} countryName={selectedName} />
      )}

      {/* ── Persona News Feed (always visible at bottom) ─────────────────── */}
      <PersonaNewsFeed forceExpand={showLanding} />
    </div>
  );
}
