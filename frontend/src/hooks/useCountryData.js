import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import usePersonaStore from "../store/personaStore";

/**
 * Custom hook — fetches country data from /api/country/{iso}?persona={persona}.
 * Re-fetches automatically when iso code, persona, userCountry, or personaDetails changes.
 */
export default function useCountryData(isoCode) {
  const persona = usePersonaStore((s) => s.persona);
  const userCountry = usePersonaStore((s) => s.userCountry);
  const personaDetails = usePersonaStore((s) => s.personaDetails);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!isoCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/country/${isoCode}`, {
        params: { 
          persona,
          homeCountry: userCountry,
          details: JSON.stringify(personaDetails)
        },
      });
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Failed to load country data.");
      console.error("[useCountryData] Error:", err?.response?.status, err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [isoCode, persona, userCountry, personaDetails]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
