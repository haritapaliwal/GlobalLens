import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import usePersonaStore from "../store/personaStore";

const PERSONAS = [
  { id: "student",       label: "Student",       emoji: "🎓", desc: "Education, visas, and student safety" },
  { id: "businessman",   label: "Businessman",   emoji: "💼", desc: "Trade, economic stability, and growth" },
  { id: "traveler",      label: "Traveler",      emoji: "✈️", desc: "Tourism, safety, and entry rules" },
  { id: "remote_worker", label: "Digital Nomad", emoji: "👨‍💻", desc: "Internet speed, cost of living, and community" },
  { id: "investor",      label: "Investor",      emoji: "📈", desc: "Market risk, ROI potential, and regulatory climate" },
];


const COUNTRIES = [
  { iso: "IN", name: "India" },
  { iso: "US", name: "United States" },
  { iso: "GB", name: "United Kingdom" },
  { iso: "DE", name: "Germany" },
  { iso: "CN", name: "China" },
  { iso: "FR", name: "France" },
  { iso: "JP", name: "Japan" },
  { iso: "CA", name: "Canada" },
  { iso: "AU", name: "Australia" },
  { iso: "BR", name: "Brazil" },
  { iso: "RU", name: "Russia" },
  { iso: "IT", name: "Italy" },
  { iso: "KR", name: "South Korea" },
  { iso: "ES", name: "Spain" },
  { iso: "MX", name: "Mexico" },
  { iso: "ID", name: "Indonesia" },
  { iso: "SA", name: "Saudi Arabia" },
  { iso: "TR", name: "Turkey" },
  { iso: "CH", name: "Switzerland" },
  { iso: "NL", name: "Netherlands" },
];

export default function LandingFlow({ onFinish }) {
  const [step, setStep] = useState("persona"); // 'persona' | 'country'
  const [selectedCountries, setSelectedCountries] = useState([]);
  const { setPersona } = usePersonaStore();

  const handlePersonaSelect = (id) => {
    setPersona(id);
    setStep("country");
  };

  const toggleCountry = (iso) => {
    setSelectedCountries(prev => 
      prev.includes(iso) 
        ? prev.filter(i => i !== iso) 
        : [...prev, iso]
    );
  };

  const handleFinish = () => {
    onFinish();
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-950/80 backdrop-blur-xl">
      <AnimatePresence mode="wait">
        {step === "persona" ? (
          <motion.div
            key="persona-step"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="w-full max-w-4xl px-6"
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl font-display font-bold text-white mb-4">
                Choose Your <span className="gradient-text">Lens</span>
              </h1>
              <p className="text-slate-400 max-w-md mx-auto">
                Select a persona to tailor the global intelligence to your specific interests and needs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {PERSONAS.map((p) => (
                <motion.button
                  key={p.id}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePersonaSelect(p.id)}
                  className="glass-card p-8 text-left group transition-all hover:border-brand-500/50"
                >
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center text-4xl mb-6 group-hover:bg-brand-500/20 transition-colors">
                    {p.emoji}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{p.label}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
                  <div className="mt-6 flex items-center text-brand-400 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Select Lens ➔
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="country-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl px-6"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-display font-bold text-white mb-3">
                Where to <span className="gradient-text">Explore?</span>
              </h2>
              <p className="text-slate-400">
                Select one or more countries to initialize your intelligence dashboard.
              </p>
            </div>

            <div className="glass-card max-h-[45vh] overflow-y-auto custom-scrollbar mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
                {COUNTRIES.map((c) => {
                  const isSelected = selectedCountries.includes(c.iso);
                  return (
                    <button
                      key={c.iso}
                      onClick={() => toggleCountry(c.iso)}
                      className={`
                        flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group
                        ${isSelected ? "bg-brand-500/20 border border-brand-500/30" : "hover:bg-white/5 border border-transparent"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl transition-all ${isSelected ? "grayscale-0" : "grayscale"}`}>
                          {c.iso.toUpperCase().split('').map(char => String.fromCodePoint(127397 + char.charCodeAt(0))).join('')}
                        </span>
                        <span className={`font-medium ${isSelected ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                          {c.name}
                        </span>
                      </div>
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center"
                        >
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <motion.button
                whileHover={{ scale: selectedCountries.length > 0 ? 1.05 : 1 }}
                whileTap={{ scale: selectedCountries.length > 0 ? 0.95 : 1 }}
                disabled={selectedCountries.length === 0}
                onClick={handleFinish}
                className={`
                  w-full py-4 rounded-2xl font-bold text-lg transition-all
                  ${selectedCountries.length > 0 
                    ? "bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-xl shadow-brand-900/20 cursor-pointer" 
                    : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"}
                `}
              >
                Start Exploring {selectedCountries.length > 0 && `(${selectedCountries.length})`}
              </motion.button>

              <button 
                onClick={() => setStep("persona")}
                className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
              >
                ← Change Lens
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

