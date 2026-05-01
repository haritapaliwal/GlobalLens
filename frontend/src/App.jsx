import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
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
        <Route path="/" element={<Home />} />
        <Route path="/select-lens" element={<Home showSelection={true} />} />
        <Route path="/dashboard/:persona" element={<Dashboard />} />
        <Route path="/dashboard/:persona/:iso" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
