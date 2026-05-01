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
                    <span className="text-xs font-black tracking-[0.3em] text-brand-400 uppercase">Global Decision Intelligence</span>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-display font-bold text-white mb-6 tracking-tight leading-[1.1]">
                    See the World. <br />
                    <span className="text-brand-500">Decide with Clarity.</span>
                  </h1>
                  
                  <div className="space-y-4 mb-10 max-w-xl mx-auto md:mx-0">
                    <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
                      The persona-driven intelligence platform that turns fragmented global data into clear, actionable decisions.
                    </p>
                    <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                      Global decisions require global intelligence — but no unified system exists. Stop visiting dozens of websites and spending hours second-guessing. We aggregate news, sentiment, and economic data into one personalized view.
                    </p>
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col items-center md:items-start gap-6 pointer-events-auto"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 245, 160, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsFlowActive(true)}
                      className="group relative flex items-center gap-4 px-10 py-4 rounded-2xl bg-brand-500 text-[#06050f] font-black text-lg shadow-2xl shadow-brand-500/20 overflow-hidden"
                    >
                      <span className="relative z-10 uppercase tracking-widest">Connect Lens</span>
                      <div className="w-6 h-6 rounded-full bg-[#06050f]/10 flex items-center justify-center group-hover:translate-x-2 transition-transform text-[#06050f]">
                        ➔
                      </div>
                    </motion.button>
                    
                    {/* Feature micro-text */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
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
                  className="flex flex-1 relative h-[300px] md:h-[450px] items-center justify-center pointer-events-auto md:-translate-y-4 w-full"
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-75 md:scale-100">
                    {/* Core Glow */}
                    <div className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full bg-brand-500/10 animate-pulse blur-[80px]" />
                    
                    {/* Inner Orbit Ring */}
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                      className="absolute w-[280px] h-[280px] md:w-[420px] md:h-[420px] rounded-full border-[1px] border-brand-500/30"
                    >
                      {/* Purple node (bottom left) */}
                      <div className="absolute bottom-[14.6%] left-[14.6%] w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-400 rounded-full shadow-[0_0_15px_3px_#c084fc] animate-pulse" />
                    </motion.div>

                    {/* Outer Orbit Ring */}
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
                      className="absolute w-[340px] h-[340px] md:w-[540px] md:h-[540px] rounded-full border-[1px] border-brand-500/20"
                    >
                      {/* Bright green blinking node (top right) */}
                      <div className="absolute top-[14.6%] right-[14.6%] w-2 h-2 md:w-3 md:h-3 bg-brand-500 rounded-full shadow-[0_0_20px_5px_#00f5a0]" />
                      <div className="absolute top-[14.6%] right-[14.6%] w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-ping opacity-70" />
                    </motion.div>
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
