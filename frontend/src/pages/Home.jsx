import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Globe from "react-globe.gl";
import WorldMap from "../components/WorldMap";
import CountryPanel from "../components/CountryPanel";
import PersonaSelector from "../components/PersonaSelector";
import ThemeToggle from "../components/ThemeToggle";
import UserProfileBadge from "../components/UserProfileBadge";
import LandingFlow from "../components/LandingFlow";
import PersonaNewsFeed from "../components/PersonaNewsFeed";
import ChatBot from "../components/ChatBot";
import usePersonaStore from "../store/personaStore";
// import ComparativeAnalysis from "../components/ComparativeAnalysis";

export default function Home() {
  const [selectedISO, setSelectedISO] = useState(null);
  const [selectedName, setSelectedName] = useState(null);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [showLanding, setShowLanding] = useState(true);
  const [isFlowActive, setIsFlowActive] = useState(false);
  const [pendingCountry, setPendingCountry] = useState(null);
  const [showComparative, setShowComparative] = useState(false);

  const { persona, isOnboarded, setIsOnboarded } = usePersonaStore();

  const handleCountrySelect = (iso, name) => {
    if (showLanding || !isOnboarded) {
      // In the new flow, we use the "Get Started" button instead of map clicks
      return;
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
    // LandingFlow is finished (persona selected), now conversational onboarding starts
    setShowLanding(false);
    setIsFlowActive(false);
    // Reset onboarding so ChatBot enters its full-screen onboarding flow
    setIsOnboarded(false);
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
              exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
              className="absolute inset-0 flex items-center pointer-events-none z-20 bg-[#06050f]/60 backdrop-blur-[4px]"
            >
              <div className="landing-mesh-bg" />

              <div className="w-full max-w-7xl mx-auto px-8 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                {/* Left Column: Text Content */}
                <motion.div
                  initial={{ x: -60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring", damping: 20 }}
                  className="flex-1 max-w-[550px] text-center md:text-left"
                >
                  <div className="inline-block mb-6 px-5 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 backdrop-blur-md">
                    <span className="text-[10px] font-black tracking-[0.3em] text-brand-400 uppercase">Global Decision Intelligence</span>
                  </div>

                  <h1 className="font-display font-bold text-white mb-5 tracking-tight leading-[1.1]" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}>
                    <span style={{ fontStyle: 'italic' }}>See the World.</span> <br />
                    <span className="text-brand-500" style={{ fontStyle: 'italic' }}>Decide with{'\n'}Clarity.</span>
                  </h1>

                  <div className="space-y-3 mb-8 max-w-md mx-auto md:mx-0">
                    <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
                      The persona-driven intelligence platform that turns
                      fragmented global data into clear, actionable decisions.
                    </p>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                      Global decisions require global intelligence — but no unified system
                      exists. Stop visiting dozens of websites and spending hours second-guessing. We aggregate news, sentiment, and economic data into one
                      personalized view.
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col items-center md:items-start gap-5 pointer-events-auto"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 245, 160, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsFlowActive(true)}
                      className="group relative flex items-center gap-4 px-8 py-3.5 rounded-2xl bg-brand-500 text-[#06050f] font-black text-base shadow-2xl shadow-brand-500/20 overflow-hidden"
                    >
                      <span className="relative z-10 uppercase tracking-widest">Connect Lens</span>
                      <div className="w-6 h-6 rounded-full bg-[#06050f]/10 flex items-center justify-center group-hover:translate-x-2 transition-transform text-[#06050f]">
                        ➔
                      </div>
                    </motion.button>

                    {/* Feature micro-text */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      <span className="flex items-center gap-1.5"><span className="text-brand-500 text-sm">✦</span> AI-Powered</span>
                      <span className="flex items-center gap-1.5"><span className="text-brand-500 text-sm">✦</span> Live Sentiment</span>
                      <span className="flex items-center gap-1.5"><span className="text-brand-500 text-sm">✦</span> Economic Data</span>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Right Column: 3D Globe Visual */}
                <motion.div
                  initial={{ x: 60, opacity: 0, scale: 0.8 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", damping: 20 }}
                  className="flex-1 relative flex items-center justify-center pointer-events-auto"
                  style={{ height: 'min(450px, 60vh)' }}
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-75 md:scale-90 lg:scale-100">
                    {/* Core Glow */}
                    <div className="absolute w-[280px] h-[280px] md:w-[350px] md:h-[350px] rounded-full bg-brand-500/10 animate-pulse blur-[80px]" />

                    {/* Inner Orbit Ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                      className="absolute w-[250px] h-[250px] md:w-[370px] md:h-[370px] rounded-full border-[1px] border-brand-500/30"
                    >
                      <div className="absolute bottom-[14.6%] left-[14.6%] w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-400 rounded-full shadow-[0_0_15px_3px_#c084fc] animate-pulse" />
                    </motion.div>

                    {/* Outer Orbit Ring */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
                      className="absolute w-[310px] h-[310px] md:w-[470px] md:h-[470px] rounded-full border-[1px] border-brand-500/20"
                    >
                      <div className="absolute top-[14.6%] right-[14.6%] w-2 h-2 md:w-3 md:h-3 bg-brand-500 rounded-full shadow-[0_0_20px_5px_#00f5a0]" />
                      <div className="absolute top-[14.6%] right-[14.6%] w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-ping opacity-70" />
                    </motion.div>
                  </div>

                  <div className="relative z-10 w-[180px] h-[180px] md:w-[280px] md:h-[280px]">
                    <Globe
                      width={window.innerWidth < 768 ? 180 : 280}
                      height={window.innerWidth < 768 ? 180 : 280}
                      backgroundColor="rgba(0,0,0,0)"
                      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                      atmosphereColor="#00f5a0"
                      atmosphereAltitude={0.15}
                    />
                  </div>

                  {/* Decorative Neural Elements around Globe */}
                  <div className="absolute top-[15%] right-[10%] w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_20px_rgba(255,45,149,1)] animate-ping" />
                  <div className="absolute bottom-[25%] left-[5%] w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,1)]" />

                  {/* Glowing Rings */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] md:w-[400px] md:h-[400px] rounded-full border border-brand-500/20" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] md:w-[440px] md:h-[440px] rounded-full border border-brand-500/5" />
                </motion.div>
              </div>

              {/* Bottom Decorative Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
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
          className="glass-card px-5 py-3 pointer-events-auto border-brand-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <img
                src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Brain/3D/brain_3d.png"
                alt="WorldLens Brain"
                className="w-7 h-7"
              />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none tracking-tight text-white">
                World<span className="text-brand-500">Lens</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Neuro-Intelligence</p>
            </div>
            {!showLanding && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="pulse-dot" />
                <span className="text-[10px] text-brand-500 font-bold">ACTIVE</span>
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
            <button
              onClick={() => setShowComparative(true)}
              className="glass-card px-3 py-1.5 flex items-center gap-2 hover:bg-white/5 transition-colors text-xs font-medium text-slate-200"
            >
              📊 Compare
            </button>
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
            className="absolute bottom-44 left-6 z-30 glass-card px-4 py-3"
          >
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">
              Sentiment Legend
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { color: "#00c878", label: "Positive  (> 0.3)" },
                { color: "#ffb300", label: "Neutral (±0.3)" },
                { color: "#ff4757", label: "Negative (< −0.3)" },
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

      {/* ── Chatbot (Only show after persona selection AND landing dismissed) ── */}
      {!showLanding && persona && (
        <ChatBot selectedISO={selectedISO} countryName={selectedName} />
      )}

      {/* ── Persona News Feed (visible after onboarding) ─────────────────── */}
      {isOnboarded && (
        <PersonaNewsFeed forceExpand={showLanding} />
      )}

      {/* ── Onboarding Overlay (Blur map while chatting) ────────────────── */}
      {!showLanding && persona && !isOnboarded && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-md pointer-events-none" />
      )}

      {/* ── Comparative Analysis Modal ────────────────────────────────────── */}
      {/* <ComparativeAnalysis
        isOpen={showComparative}
        onClose={() => setShowComparative(false)}
        selectedISO={selectedISO}
      /> */}
    </div>
  );
}
