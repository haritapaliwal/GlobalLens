import { create } from "zustand";

const useThemeStore = create((set) => ({
  theme: "dark", // Default to dark as per original design
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === "dark" ? "light" : "dark";
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    return { theme: newTheme };
  }),
  initTheme: () => {
    // We want dark to be default, so we add the class initially
    document.documentElement.classList.add("dark");
    set({ theme: "dark" });
  }
}));

export default useThemeStore;
