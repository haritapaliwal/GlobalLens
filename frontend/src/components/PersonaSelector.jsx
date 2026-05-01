import { motion } from "framer-motion";
import usePersonaStore from "../store/personaStore";

const PERSONAS = [
  { id: "student",       label: "Student",       emoji: "🎓", desc: "Education & Visas" },
  { id: "businessman",   label: "Businessman",   emoji: "💼", desc: "Trade & Economy"   },
  { id: "traveler",      label: "Traveler",      emoji: "✈️", desc: "Safety & Entry"    },
  { id: "remote_worker", label: "Digital Nomad", emoji: "👨‍💻", desc: "Cost & Internet"   },
  { id: "investor",      label: "Investor",      emoji: "📈", desc: "Risk & Growth"     },
];

export default function PersonaSelector() {
  const { persona, setPersona } = usePersonaStore();

  return (
    <div className="glass-card p-1.5 flex gap-1 items-center">
      {PERSONAS.map((p) => {
        const active = persona === p.id;
        return (
          <motion.button
            key={p.id}
            id={`persona-${p.id}`}
            onClick={() => setPersona(p.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
              transition-all duration-200 cursor-pointer select-none
              ${active
                ? "bg-brand-600 text-white shadow-lg shadow-brand-700/40"
                : "text-slate-400 hover:text-white hover:bg-white/5"
              }
            `}
          >
            <span className="text-base leading-none">{p.emoji}</span>
            <span className="hidden sm:block">{p.label}</span>
            {active && (
              <motion.div
                layoutId="persona-pill"
                className="absolute inset-0 rounded-xl bg-brand-600 -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
