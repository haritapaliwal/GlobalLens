import { create } from "zustand";

/**
 * Global persona store — drives which persona lens is applied to all country data.
 */
const usePersonaStore = create((set) => ({
  persona: "student",
  setPersona: (persona) => set({ persona }),
}));

export default usePersonaStore;
