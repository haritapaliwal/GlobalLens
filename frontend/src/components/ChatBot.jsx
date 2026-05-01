import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import usePersonaStore from "../store/personaStore";
import axios from "axios";

export default function ChatBot({ selectedISO, countryName }) {
  const {
    persona, userName, userCountry, personaDetails, isOnboarded,
    setUserName, setUserCountry, setPersonaDetails, setIsOnboarded, setSelectedCountries
  } = usePersonaStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(null);
  const [localSelectedCountries, setLocalSelectedCountries] = useState([]);
  const [isResearchMode, setIsResearchMode] = useState(false);

  const scrollRef = useRef(null);

  // Initialize onboarding if persona is selected but not onboarded
  useEffect(() => {
    if (persona && !isOnboarded && !onboardingStep) {
      setIsOpen(true);
      setOnboardingStep("name");
      setMessages([
        { role: "assistant", content: `Excellent choice. The ${persona.replace('_', ' ')} lens is a powerful perspective. To synchronize, may I ask your name?` }
      ]);
    } else if (isOnboarded && messages.length === 0) {
      setMessages([
        { role: "assistant", content: "Hello! I'm WorldLens AI. Ask me anything about global intelligence or specific countries you're exploring." }
      ]);
    }
  }, [persona, isOnboarded, onboardingStep, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleOnboardingStep = (val) => {
    if (onboardingStep === "countries") {
      setLocalSelectedCountries(prev =>
        prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]
      );
      return;
    }

    const userMsg = { role: "user", content: val };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    setTimeout(() => {
      let nextStep = onboardingStep;
      let botMsg = "";

      if (onboardingStep === "name") {
        setUserName(val);
        nextStep = "home_country";
        botMsg = `Nice to meet you, ${val}. To provide localized intelligence, which country are you currently based in?`;
      } else if (onboardingStep === "home_country") {
        setUserCountry(val);
        nextStep = "domain";
        if (persona === "traveler") {
          botMsg = `Understood. What is the primary style or purpose of your travel (e.g., adventure, luxury, backpacking)?`;
        } else {
          botMsg = `Understood. And what is your specialized domain or industry of interest?`;
        }
      } else if (onboardingStep === "domain") {
        setPersonaDetails({ domain: val });
        if (persona === "student") {
          nextStep = "budget";
          botMsg = "Got it. As a student, what is your estimated monthly budget for international studies?";
        } else if (persona === "traveler") {
          nextStep = "duration";
          botMsg = "Excellent. And roughly how many days or weeks do you plan to travel?";
        } else {
          nextStep = "countries";
          botMsg = "Select all countries you're interested in today. You can pick multiple!";
        }
      } else if (onboardingStep === "duration") {
        setPersonaDetails({ duration: val });
        if (persona === "traveler") {
          nextStep = "budget";
          botMsg = "Got it. As a traveler, what is your estimated total budget for this trip (including flights)?";
        } else {
          nextStep = "countries";
          botMsg = "Select all countries you're interested in today. You can pick multiple!";
        }
      } else if (onboardingStep === "budget") {
        setPersonaDetails({ budget: val });
        nextStep = "countries";
        botMsg = "Perfect. Select all countries you're interested in today. You can pick multiple!";
      }

      setMessages(prev => [...prev, { role: "assistant", content: botMsg }]);
      setOnboardingStep(nextStep);
      setIsLoading(false);
    }, 800);
  };

  const finalizeOnboarding = () => {
    setIsLoading(true);
    setSelectedCountries(localSelectedCountries);

    setMessages(prev => [...prev, { role: "assistant", content: "Synchronizing with the global intelligence network... Welcome to WorldLens." }]);

    setTimeout(() => {
      setIsOnboarded(true);
      setIsOpen(false);
      setIsLoading(false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!isOnboarded && onboardingStep) {
      const val = input;
      setInput("");
      handleOnboardingStep(val);
      return;
    }

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post("/api/chat", {
        message: input,
        isoCode: selectedISO,
        persona: persona,
        history: messages.slice(-6),
        isResearchMode: isResearchMode,
        userDetails: {
          name: userName,
          homeCountry: userCountry,
          personaDetails: personaDetails
        }
      });

      setMessages((prev) => [...prev, { role: "assistant", content: response.data.response }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm sorry, I'm having trouble thinking right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const countries = [
    "United States", "India", "China", "United Kingdom", "Germany", "Japan",
    "France", "Canada", "Australia", "Brazil", "Russia", "South Korea",
    "Italy", "Spain", "Mexico", "Indonesia", "Netherlands", "Saudi Arabia",
    "Turkey", "Switzerland", "United Arab Emirates", "Singapore", "South Africa",
    "Israel", "Sweden", "Norway", "Denmark", "Finland", "Argentina", "Egypt",
    "Vietnam", "Thailand", "Malaysia", "Nigeria"
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 left-6 z-50 w-14 h-14 rounded-full bg-brand-500 shadow-lg flex items-center justify-center border-2 border-white/20 overflow-hidden"
      >
        {isOpen ? (
          <span className="text-white text-xl">✕</span>
        ) : (
          <img
            src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Robot/3D/robot_3d.png"
            className="w-10 h-10"
            alt="AI"
          />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={!isOnboarded ? { opacity: 0, scale: 1.1 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed z-50 transition-all duration-500 overflow-hidden 
              ${!isOnboarded
                ? "inset-0 w-full h-full rounded-none border-none"
                : "bottom-[100px] left-4 sm:left-6 w-[calc(100vw-2rem)] sm:w-[450px] max-h-[calc(100vh-120px)] h-[500px] rounded-[32px] border border-white/10 shadow-2xl shadow-brand-500/10"
              } glass-card flex flex-col shadow-2xl`}
          >
            {/* Onboarding Mesh Background */}
            {!isOnboarded && <div className="absolute inset-0 landing-mesh-bg opacity-30 pointer-events-none" />}

            {/* Header */}
            <div className={`p-5 md:p-6 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0 relative z-10`}>
              <div className="flex items-center gap-4 max-w-4xl mx-auto w-full">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center text-2xl">
                  🤖
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-100 uppercase tracking-tighter">
                    {!isOnboarded ? "Global AI ChatBot" : "WorldLens Intelligence"}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {!isOnboarded ? `Syncing ${persona} Lens` : selectedISO ? `Analysing ${countryName}` : "Global Mode"}
                    </span>
                  </div>
                </div>

                {/* Research Toggle */}
                {isOnboarded && (
                  <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 ml-auto group hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => setIsResearchMode(!isResearchMode)}>
                    <div className="flex flex-col items-end">
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${isResearchMode ? 'text-brand-400' : 'text-slate-500'}`}>
                        {isResearchMode ? 'Web Search On' : 'Web Search Off'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold leading-none">AI Mode</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-all duration-500 ${isResearchMode ? 'bg-brand-500 shadow-[0_0_15px_rgba(255,45,149,0.4)]' : 'bg-slate-700'}`}>
                      <motion.div
                        animate={{ x: isResearchMode ? 22 : 2 }}
                        className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className={`flex-1 overflow-y-auto ${!isOnboarded ? "p-6 md:p-10 space-y-6" : "p-5 space-y-5"} custom-scrollbar relative z-10`}
            >
              <div className="max-w-4xl mx-auto w-full flex flex-col space-y-6">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`${!isOnboarded ? "max-w-[80%] px-6 py-4 text-base md:text-lg" : "max-w-[85%] px-4 py-3 text-sm"} rounded-[24px] leading-relaxed transition-all duration-500 ${msg.role === "user"
                      ? "bg-brand-500 text-white rounded-br-none shadow-xl shadow-brand-500/20 font-medium"
                      : "bg-white/10 text-slate-200 border border-white/5 rounded-bl-none backdrop-blur-xl"
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {onboardingStep === "countries" && (
                  <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
                    <div className={`grid ${!isOnboarded ? "grid-cols-2 md:grid-cols-3 gap-3" : "grid-cols-2 gap-2"} mt-8 w-full max-h-96 overflow-y-auto custom-scrollbar pr-2`}>
                      {countries.map(c => {
                        const isSelected = localSelectedCountries.includes(c);
                        return (
                          <button
                            key={c}
                            onClick={() => handleOnboardingStep(c)}
                            className={`${!isOnboarded ? "px-6 py-4 text-sm" : "px-4 py-2 text-xs"} rounded-xl ${isSelected ? "bg-brand-500 text-white border-brand-500 scale-[1.02]" : "bg-white/5 border-white/10 text-slate-300"} border hover:bg-brand-500/80 hover:text-white transition-all font-bold tracking-widest uppercase`}
                          >
                            {c} {isSelected && "✓"}
                          </button>
                        );
                      })}
                    </div>

                    {!isOnboarded && localSelectedCountries.length > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={finalizeOnboarding}
                        className="mt-10 px-12 py-5 bg-brand-500 text-white rounded-2xl font-black tracking-[0.2em] uppercase shadow-2xl shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all"
                      >
                        Proceed ({localSelectedCountries.length})
                      </motion.button>
                    )}
                  </div>
                )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`${!isOnboarded ? "px-6 py-4" : "px-4 py-3"} bg-white/10 rounded-[24px] rounded-bl-none`}>
                      <div className="flex gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className={`${!isOnboarded ? "p-6 md:p-10 border-t border-white/5 bg-black/40" : "p-5 border-t border-white/10 bg-black/40"} shrink-0 relative z-10`}>
              <div className="relative max-w-4xl mx-auto">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder={onboardingStep === "countries" ? "Select from above or type..." : "Type your response..."}
                  className={`${!isOnboarded ? "px-8 py-5 text-base md:text-lg" : "px-5 py-3.5 text-sm"} w-full bg-white/5 border border-white/10 rounded-[24px] text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-all shadow-inner backdrop-blur-md`}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`${!isOnboarded ? "right-3 w-14 h-14" : "right-2.5 w-10 h-10"} absolute top-1/2 -translate-y-1/2 rounded-xl bg-brand-500 text-white flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-brand-500/20`}
                >
                  <svg className={`${!isOnboarded ? "w-6 h-6" : "w-5 h-5"} fill-current`} viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
