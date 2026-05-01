import { create } from "zustand";

/**
 * Global persona store — drives which persona lens is applied to all country data.
 */
const usePersonaStore = create((set) => ({
  persona: "student",
  userName: "",
  userCountry: "",
  setPersona: (persona) => set({ persona }),
  setUserName: (userName) => set({ userName }),
  setUserCountry: (userCountry) => set({ userCountry }),
}));

export default usePersonaStore;
