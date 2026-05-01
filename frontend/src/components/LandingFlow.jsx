import { motion, AnimatePresence } from "framer-motion";
import usePersonaStore from "../store/personaStore";

const PERSONAS = [
  { id: "student", label: "Student", emoji: "🎓", accent: "#00f5a0", tagline: "Neural Academic", desc: "Global education streams." },
  { id: "businessman", label: "Businessman", emoji: "💼", accent: "#00f5a0", tagline: "Market Matrix", desc: "Trade and corporate surveillance." },
  { id: "traveler", label: "Traveler", emoji: "✈️", accent: "#00f5a0", tagline: "Global Path", desc: "Safe zones and transit status." },
  { id: "remote_worker", label: "Digital Nomad", emoji: "👨‍💻", accent: "#00f5a0", tagline: "Node Lifestyle", desc: "Bandwidth and cost of operation." },
  { id: "investor", label: "Investor", emoji: "📈", accent: "#00f5a0", tagline: "Capital Risk", desc: "FDI and market data." },
];

export default function LandingFlow({ onFinish }) {
  const { setPersona } = usePersonaStore();

  const handlePersonaSelect = (id) => {
    setPersona(id);
    onFinish(id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-950/95 backdrop-blur-3xl overflow-hidden">
      <div className="landing-mesh-bg" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl px-6 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-display font-bold text-white mb-2 tracking-tight"
          >
            Choose Your <span className="gradient-text">Lens</span>
          </motion.h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto opacity-80">
            Each lens filters global data through a specialized perspective.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PERSONAS.map((p, idx) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handlePersonaSelect(p.id)}
              className="group relative flex flex-col items-center bg-[#0d0b1a]/80 border border-white/5 rounded-[24px] overflow-hidden transition-all hover:border-brand-500/50 hover:shadow-[0_0_30px_rgba(0,245,160,0.2)]"
            >
              {/* Top Visual Section */}
              <div className="relative w-full h-32 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-brand-500/5 blur-xl" />
                <motion.span
                  className="text-6xl relative z-10 filter drop-shadow-2xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  {p.emoji}
                </motion.span>
              </div>

              {/* Content Section */}
              <div className="p-5 pt-0 flex flex-col items-center text-center w-full">
                <span className="text-[9px] font-black tracking-widest text-brand-400 mb-1 uppercase opacity-60">
                  {p.tagline}
                </span>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                  {p.label}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-6 max-w-[160px]">
                  {p.desc}
                </p>
                <div className="w-full">
                  <div className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-[10px] group-hover:bg-brand-500 transition-all uppercase tracking-widest">
                    Activate
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
