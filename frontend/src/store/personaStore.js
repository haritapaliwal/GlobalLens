import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Global persona store — drives which persona lens is applied to all country data.
 */
const usePersonaStore = create(
  persist(
    (set) => ({
      persona: null,
      userName: "",
      userCountry: "",
      personaDetails: {},
      isOnboarded: false,
      selectedCountries: [],
      setPersona: (persona) => set({ persona }),
      setUserName: (userName) => set({ userName }),
      setUserCountry: (userCountry) => set({ userCountry }),
      setPersonaDetails: (details) => set((state) => ({ 
        personaDetails: { ...state.personaDetails, ...details } 
      })),
      setSelectedCountries: (countries) => set({ selectedCountries: countries }),
      setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
    }),
    {
      name: "worldlens-persona-storage", // unique name
    }
  )
);

export default usePersonaStore;
