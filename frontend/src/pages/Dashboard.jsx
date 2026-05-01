import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import WorldMap from "../components/WorldMap";
import CountryPanel from "../components/CountryPanel";
import PersonaSelector from "../components/PersonaSelector";
import ThemeToggle from "../components/ThemeToggle";
import UserProfileBadge from "../components/UserProfileBadge";
import PersonaNewsFeed from "../components/PersonaNewsFeed";
import ChatBot from "../components/ChatBot";
import usePersonaStore from "../store/personaStore";
import isoCountries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

isoCountries.registerLocale(enLocale);

export default function Dashboard() {
  const { persona: personaParam, iso: isoParam } = useParams();
  const navigate = useNavigate();
  const [mapRefreshKey, setMapRefreshKey] = useState(0);

  const { persona, setPersona, isOnboarded } = usePersonaStore();

  // Sync URL persona with store
  useEffect(() => {
    if (personaParam && personaParam !== persona) {
      setPersona(personaParam);
    }
  }, [personaParam, persona, setPersona]);

  const handleCountrySelect = (iso, name) => {
    navigate(`/dashboard/${personaParam}/${iso}`);
  };

  const handleDataLoaded = () => {
    setMapRefreshKey(prev => prev + 1);
  };

  const handleClose = () => {
    navigate(`/dashboard/${personaParam}`);
  };

  const selectedISO = isoParam ? isoParam.toUpperCase() : null;
  const selectedName = selectedISO ? isoCountries.getName(selectedISO, "en") : null;

  // Prevent flicker/crash before persona is synced from URL
  if (personaParam && !persona) {
    return (
      <div className="w-screen h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-screen min-h-screen bg-surface-900 overflow-hidden flex flex-col">
      {/* ── Full-screen map ─────────────────────────────────────────────── */}
      <div className="relative w-full h-screen flex-shrink-0">
        <WorldMap
          onCountrySelect={handleCountrySelect}
          refreshKey={mapRefreshKey}
        />
      </div>

      {/* ── Top header bar ──────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-40 px-5 pt-5 flex items-start justify-between pointer-events-none">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card px-5 py-3 pointer-events-auto border-brand-500/20"
          onClick={() => navigate("/")}
          style={{ cursor: 'pointer' }}
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
            <div className="flex items-center gap-1.5 ml-2">
              <span className="pulse-dot" />
              <span className="text-[10px] text-brand-500 font-bold uppercase">{personaParam}</span>
            </div>
          </div>
        </motion.div>

        {/* Profile, Persona selector and Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="pointer-events-auto flex items-center gap-3"
        >
          <UserProfileBadge />
          <PersonaSelector onChangePersona={() => navigate("/select-lens")} />
          <ThemeToggle />
        </motion.div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-44 left-6 z-30 glass-card px-4 py-3"
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
      </motion.div> */}

      {/* ── Click-to-explore hint ───────────────────────────────────────── */}
      <AnimatePresence>
        {!selectedISO && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
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

      {/* ── Chatbot ─────────────────────────────────────────────────────── */}
      <ChatBot selectedISO={selectedISO} countryName={selectedName} />

      {/* ── Persona News Feed ───────────────────────────────────────────── */}
      <PersonaNewsFeed forceExpand={false} />

      {/* ── Onboarding Overlay ──────────────────────────────────────────── */}
      {persona && !isOnboarded && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-md pointer-events-none" />
      )}
    </div>
  );
}
