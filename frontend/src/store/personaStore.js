import { create } from "zustand";

/**
 * Global persona store — drives which persona lens is applied to all country data.
 */
const usePersonaStore = create((set) => ({
  persona: "student",
  userName: "",
  userCountry: "",
  personaDetails: {}, // Stores persona-specific details
  setPersona: (persona) => set({ persona }),
  setUserName: (userName) => set({ userName }),
  setUserCountry: (userCountry) => set({ userCountry }),
  setPersonaDetails: (details) => set((state) => ({ 
    personaDetails: { ...state.personaDetails, ...details } 
  })),
}));

export default usePersonaStore;
