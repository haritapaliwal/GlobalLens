import { motion } from "framer-motion";
import usePersonaStore from "../store/personaStore";

const PERSONAS = [
  { id: "student",       label: "Student",       emoji: "🎓", desc: "Education & Visas" },
  { id: "businessman",   label: "Businessman",   emoji: "💼", desc: "Trade & Economy"   },
  { id: "traveler",      label: "Traveler",      emoji: "✈️", desc: "Safety & Entry"    },
  { id: "remote_worker", label: "Digital Nomad", emoji: "👨‍💻", desc: "Cost & Internet"   },
];

export default function PersonaSelector({ onChangePersona }) {
  const { persona } = usePersonaStore();
  
  const activePersona = PERSONAS.find(p => p.id === persona) || PERSONAS[0];

  return (
    <motion.button
      id="change-persona-btn"
      onClick={onChangePersona}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-1.5 flex gap-2 items-center pointer-events-auto group hover:border-brand-500/50 transition-colors"
    >
      <div className="bg-brand-600 text-white px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-brand-700/40">
        <span className="text-base leading-none">{activePersona.emoji}</span>
        <span>{activePersona.label}</span>
      </div>
      
      <div className="pr-2 flex items-center gap-1.5 text-slate-500 group-hover:text-slate-300 transition-colors">
        <span className="text-[10px] font-bold uppercase tracking-widest">Change</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </motion.button>
  );
}
