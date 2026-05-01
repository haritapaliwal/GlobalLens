import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import useThemeStore from "./store/themeStore";
import usePersonaStore from "./store/personaStore";

/**
 * Smart redirect: if the user has already completed onboarding,
 * send them straight to their dashboard instead of showing the landing page.
 */
function HomeGuard() {
  const { persona, isOnboarded } = usePersonaStore();
  if (persona && isOnboarded) {
    return <Navigate to={`/dashboard/${persona}`} replace />;
  }
  return <Home />;
}

export default function App() {
  const initTheme = useThemeStore(state => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing / persona selection */}
        <Route path="/" element={<HomeGuard />} />
        <Route path="/select-lens" element={<Home showSelection={true} />} />

        {/* Conversational onboarding (after persona chosen, before dashboard) */}
        <Route path="/onboarding/:persona" element={<Onboarding />} />

        {/* Main dashboard */}
        <Route path="/dashboard/:persona" element={<Dashboard />} />
        <Route path="/dashboard/:persona/:iso" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
