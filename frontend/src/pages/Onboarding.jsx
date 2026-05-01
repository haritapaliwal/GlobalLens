import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WorldMap from "../components/WorldMap";
import ChatBot from "../components/ChatBot";
import usePersonaStore from "../store/personaStore";

export default function Onboarding() {
  const { persona: personaParam } = useParams();
  const navigate = useNavigate();
  const { persona, setPersona, isOnboarded } = usePersonaStore();

  // Sync the URL persona into the store
  useEffect(() => {
    if (personaParam && personaParam !== persona) {
      setPersona(personaParam);
    }
  }, [personaParam, persona, setPersona]);

  // If the user is already onboarded, skip to the dashboard
  useEffect(() => {
    if (isOnboarded && persona) {
      navigate(`/dashboard/${persona}`, { replace: true });
    }
  }, [isOnboarded, persona, navigate]);

  return (
    <div className="relative w-screen min-h-screen bg-surface-900 overflow-hidden flex flex-col">
      {/* Background map (decorative, non-interactive) */}
      <div className="relative w-full h-screen flex-shrink-0">
        <WorldMap onCountrySelect={() => {}} refreshKey={0} />
      </div>

      {/* Blur overlay while onboarding */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-md pointer-events-none" />

      {/* Top brand bar */}
      <div className="absolute top-0 left-0 right-0 z-50 px-5 pt-5 flex items-start pointer-events-none">
        <div className="glass-card px-5 py-3 pointer-events-auto border-brand-500/20">
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
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Onboarding</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen ChatBot for onboarding */}
      <ChatBot selectedISO={null} countryName={null} />
    </div>
  );
}
