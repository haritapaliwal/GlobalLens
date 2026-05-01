import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Globe from "react-globe.gl";
import WorldMap from "../components/WorldMap";
import LandingFlow from "../components/LandingFlow";
import usePersonaStore from "../store/personaStore";

export default function Home({ showSelection = false }) {
  const [isFlowActive, setIsFlowActive] = useState(showSelection);
  const navigate = useNavigate();
  const { setIsOnboarded } = usePersonaStore();

  const handleLandingFinish = (personaId) => {
    // Persona has been selected — navigate to the onboarding route
    setIsOnboarded(false);
    navigate(`/onboarding/${personaId}`);
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
          onCountrySelect={() => {}} 
          refreshKey={0}
        />
        
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
                    
                    <div className="hidden lg:flex items-center gap-6">
                      <div className="flex -space-x-3">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-10 h-10 rounded-full border-2 border-[#06050f] bg-slate-800" />
                        ))}
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span className="text-white">12.4k</span> Active Nodes
                      </div>
                    </div>
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
                      hexPolygonColor={() => "#00f5a0"}
                      hexPolygonMargin={0.3}
                      hexPolygonDashOffset={() => Math.random()}
                      hexPolygonDashLength={() => Math.random()}
                    />
                  </div>

                  {/* Decorative Neural Elements around Globe */}
                  <div className="absolute top-[15%] right-[10%] w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_20px_rgba(255,45,149,1)] animate-ping" />
                  <div className="absolute bottom-[25%] left-[5%] w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,1)]" />
                  
                  {/* Glowing Rings - Reduced Radius */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] md:w-[450px] md:h-[450px] rounded-full border border-brand-500/20" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] md:w-[500px] md:h-[500px] rounded-full border border-brand-500/5" />
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
          </div>
        </motion.div>
      </div>
    </div>
  );
}
