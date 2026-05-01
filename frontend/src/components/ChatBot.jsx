import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import usePersonaStore from "../store/personaStore";
import axios from "axios";

export default function ChatBot({ selectedISO, countryName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm WorldLens AI. Ask me anything about global intelligence or specific countries you're exploring." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { persona, userName, userCountry, personaDetails } = usePersonaStore();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

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

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-brand-500 shadow-lg flex items-center justify-center border-2 border-white/20 overflow-hidden"
      >
        {isOpen ? (
          <span className="text-white text-xl">✕</span>
        ) : (
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="currentColor" fillOpacity="0.2"/>
            <path d="M7 11H8V13H7V11Z" fill="currentColor"/>
            <path d="M16 11H17V13H16V11Z" fill="currentColor"/>
            <path d="M9 16C9 16 10.5 17.5 12 17.5C13.5 17.5 15 16 15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 8V6M12 6C12 6 11 5 10 5M12 6C12 6 13 5 14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="5" y="9" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[calc(100vh-12rem)] h-[600px] glass-card flex flex-col overflow-hidden border border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-lg">
                  🤖
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">WorldLens Intelligence</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {selectedISO ? `Analysing ${countryName}` : "Global Mode"} • {persona}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-brand-500 text-white rounded-br-none" 
                      : "bg-white/10 text-slate-200 border border-white/5 rounded-bl-none"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-3 py-2 rounded-2xl rounded-bl-none">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-75" />
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask a question..."
                  className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all"
                >
                  <svg className="w-4 h-4 fill-current rotate-90" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                AI powered by Llama 3.3 for {persona} decisions.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
