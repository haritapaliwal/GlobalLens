import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import useThemeStore from "./store/themeStore";

export default function App() {
  const initTheme = useThemeStore(state => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing / persona selection */}
        <Route path="/" element={<Home />} />
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
