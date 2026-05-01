import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Globe from "react-globe.gl";
import WorldMap from "../components/WorldMap";
import LandingFlow from "../components/LandingFlow";

export default function Home({ showSelection = false }) {
  const navigate = useNavigate();
  const [isFlowActive, setIsFlowActive] = useState(showSelection);

  const handleLandingFinish = (selectedPersona) => {
    setIsFlowActive(false);
    navigate(`/dashboard/${selectedPersona}`);
  };

  return (
    <div className="relative w-screen min-h-screen bg-surface-900 overflow-hidden flex flex-col">
      {/* ── Landing Flow Overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {isFlowActive && (
          <LandingFlow onFinish={handleLandingFinish} />
        )}
      </AnimatePresence>

      {/* ── Full-screen map (Background only) ───────────────────────────── */}
      <div className="relative w-full h-screen flex-shrink-0">
        <WorldMap onCountrySelect={() => setIsFlowActive(true)} />
        
        {/* Premium Welcome Heading */}
        <AnimatePresence>
          {!isFlowActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-[#06050f]/60 backdrop-blur-[4px]"
            >
              <div className="landing-mesh-bg" />
              
              <div className="w-full max-w-7xl px-6 md:px-8 flex flex-col md:flex-row items-center justify-center py-20 gap-10 md:gap-24">
                {/* Left Column: Text Content */}
                <motion.div 
                  initial={{ x: -60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring", damping: 20 }}
                  className="flex-1 text-center md:text-left"
                >
                  <div className="inline-block mb-8 px-5 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 backdrop-blur-md">
                    <span className="text-xs font-black tracking-[0.3em] text-brand-400 uppercase">Neural Global Surveillance</span>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold text-white mb-4 tracking-tighter leading-[0.9] uppercase">
                    WORLD <br />
                    <span className="text-brand-500">LENS.</span>
                  </h1>
                  
                  <p className="text-lg md:text-2xl text-slate-400 max-w-xl mb-10 md:mb-12 font-medium leading-relaxed">
                    Access the world's most advanced 
                    <span className="text-white"> neuro-intelligence network</span>. 
                    Real-time global insights, decoded for your perspective.
                  </p>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col md:flex-row items-center gap-8 pointer-events-auto"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255, 45, 149, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsFlowActive(true)}
                      className="group relative flex items-center gap-4 px-10 py-4 rounded-2xl bg-brand-500 text-white font-black text-lg shadow-2xl shadow-brand-500/40 overflow-hidden"
                    >
                      <span className="relative z-10 uppercase tracking-widest">Connect</span>
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-2 transition-transform">
                        ➔
                      </div>
                    </motion.button>
                  </motion.div>
                </motion.div>

                {/* Right Column: 3D Globe Visual */}
                <motion.div
                  initial={{ x: 60, opacity: 0, scale: 0.8 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", damping: 20 }}
                  className="flex flex-1 relative h-[300px] md:h-[450px] items-center justify-center pointer-events-auto md:-translate-y-4 w-full"
                >
                  <div className="absolute inset-0 flex items-center justify-center scale-50 md:scale-90">
                    <div className="w-[350px] h-[350px] md:w-[480px] md:h-[480px] rounded-full border border-brand-500/10 bg-brand-500/5 animate-pulse blur-3xl" />
                  </div>
                  <div className="relative z-10 w-[200px] h-[200px] md:w-[320px] md:h-[320px]">
                    <Globe
                      width={window.innerWidth < 768 ? 200 : 320}
                      height={window.innerWidth < 768 ? 200 : 320}
                      backgroundColor="rgba(0,0,0,0)"
                      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                      atmosphereColor="#00f5a0"
                      atmosphereAltitude={0.15}
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
