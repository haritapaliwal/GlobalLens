import { useState, useEffect } from "react";
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
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLandingFinish = (personaId) => {
    setIsOnboarded(false);
    navigate(`/onboarding/${personaId}`);
  };

  const globeSize = dimensions.width < 768 ? 280 : 350;

  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden overflow-y-auto md:overflow-hidden bg-[#060B11]" style={{ display: 'flex', flexDirection: 'column' }}>
      <AnimatePresence>
        {isFlowActive && (
          <LandingFlow onFinish={handleLandingFinish} />
        )}
      </AnimatePresence>

      <div className="relative w-full flex items-center min-h-screen" style={{ flexShrink: 0 }}>
        <div className="absolute inset-0 z-0">
          <WorldMap 
            onCountrySelect={() => {}} 
            refreshKey={0}
          />
        </div>
        
        <AnimatePresence>
          {!isFlowActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-[#060B11]/85 backdrop-blur-sm overflow-y-auto"
            >
              <div className="w-full max-w-7xl px-6 md:px-12 flex flex-col md:flex-row items-center justify-between py-12 md:py-20 gap-10 md:gap-20">
                
                {/* Left Column: Text Content */}
                <motion.div 
                   initial={{ x: -60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring", damping: 20 }}
                  className="flex-1 text-center md:text-left z-30"
                >
                  <div className="inline-block mb-6 px-4 py-2 rounded-full border border-[#00f5a0]/30 bg-[#00f5a0]/10 backdrop-blur-md">
                    <span className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-[#00f5a0] uppercase">Global Decision Intelligence</span>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
                    See the World.<br />
                    <span className="text-[#00f5a0]">Decide with<br />Clarity.</span>
                  </h1>
                  
                  <p className="text-base md:text-lg text-white max-w-xl mx-auto md:mx-0 mb-4 font-semibold leading-relaxed">
                    The persona-driven intelligence platform that turns fragmented global data into clear, actionable decisions.
                  </p>

                  <p className="hidden sm:block text-xs md:text-sm text-slate-400 max-w-xl mx-auto md:mx-0 mb-10 leading-relaxed">
                    Global decisions require global intelligence — but no unified system exists. Stop visiting dozens of websites and spending hours second-guessing. We aggregate news, sentiment, and economic data into one personalized view.
                  </p>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col items-center md:items-start gap-8 pointer-events-auto"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsFlowActive(true)}
                      className="group relative flex items-center gap-3 px-8 py-4 rounded-xl bg-[#00f5a0] text-black font-bold text-sm shadow-[0_0_20px_rgba(0,245,160,0.3)] overflow-hidden"
                    >
                      <span className="relative z-10 tracking-widest uppercase">Connect Lens</span>
                      <span className="relative z-10 font-black text-lg leading-none group-hover:translate-x-1 transition-transform">➔</span>
                    </motion.button>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 mt-2">
                      <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="text-[#00f5a0] text-sm">✦</span> AI-POWERED
                      </div>
                      <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="text-[#00f5a0] text-sm">✦</span> LIVE SENTIMENT
                      </div>
                      <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="text-[#00f5a0] text-sm">✦</span> ECONOMIC DATA
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Right Column: 3D Globe Visual */}
                <motion.div
                  initial={{ x: 60, opacity: 0, scale: 0.8 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", damping: 20 }}
                  className="flex flex-1 relative h-[300px] sm:h-[400px] md:h-[600px] items-center justify-center pointer-events-auto w-full z-10"
                >
                  <div className="absolute inset-0 flex items-center justify-center scale-90 pointer-events-none">
                    <div className="w-[300px] h-[300px] md:w-[480px] md:h-[480px] rounded-full bg-[#00f5a0]/5 blur-[60px] md:blur-[80px]" />
                  </div>
                  
                  <div className="relative z-10" style={{ width: globeSize, height: globeSize }}>
                    <Globe
                      width={globeSize}
                      height={globeSize}
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

                  {/* Rings and dots container */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
                    {/* Glowing Rings */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] md:w-[550px] md:h-[550px] rounded-full border border-[#00f5a0]/20" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[750px] md:h-[750px] rounded-full border border-[#00f5a0]/10" />
                    
                    {/* Dot on outer orbit */}
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-[#00f5a0] shadow-[0_0_20px_rgba(0,245,160,1)] -mt-2 ml-[290px] md:ml-[367px]" />
                    {/* Dot on inner orbit */}
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-[#b876f5] shadow-[0_0_15px_rgba(184,118,245,1)] mt-[150px] md:mt-[194px] ml-[150px] md:ml-[194px]" />
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
