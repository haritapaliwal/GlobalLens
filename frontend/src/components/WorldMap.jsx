import React, { useState, useEffect, memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";
import axios from "axios";
import usePersonaStore from "../store/personaStore";
import isoCountries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

// Register english locale for country names
isoCountries.registerLocale(enLocale);

// A lightweight TopoJSON for countries (~100KB)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function scoreToColor(score) {
  if (score === null || score === undefined) return "var(--map-fill-null)";
  if (score > 0.3)  return "#00c878"; // green
  if (score < -0.3) return "#ff4757"; // red
  return "#ffb300"; // amber
}

function scoreToOpacity(score) {
  if (score === null || score === undefined) return 0.5;
  return 0.45 + Math.abs(score) * 0.35;
}

const WorldMap = ({ onCountrySelect, refreshKey }) => {
  const persona = usePersonaStore((s) => s.persona);
  const [scores, setScores] = useState({});

  // Fetch all cached scores on mount / persona change / refreshKey change
  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await axios.get("/api/map-scores", { params: { persona } });
        setScores(res.data || {});
      } catch (err) {
        console.error("[WorldMap] Failed to fetch map scores", err);
      }
    };
    fetchScores();
  }, [persona, refreshKey]);

  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: "var(--map-bg)" }}>
      <ComposableMap
        projectionConfig={{ scale: 147 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup center={[0, 10]} maxZoom={10} minZoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // geo.id in world-atlas is the numeric ISO code
                const iso2 = geo.id ? isoCountries.numericToAlpha2(geo.id) : null;
                const score = iso2 ? scores[iso2] : null;
                const color = scoreToColor(score);
                const opacity = scoreToOpacity(score);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    stroke="var(--map-stroke)"
                    strokeWidth={0.5}
                    onClick={() => {
                      if (iso2 && onCountrySelect) {
                        const name = geo.properties.name || isoCountries.getName(iso2, "en") || iso2;
                        onCountrySelect(iso2, name);
                      }
                    }}
                    style={{
                      default: {
                        fill: color,
                        fillOpacity: opacity,
                        outline: "none",
                      },
                      hover: {
                        fill: "#00e68e",
                        fillOpacity: 0.8,
                        stroke: "#00e68e",
                        strokeWidth: 1.5,
                        outline: "none",
                        cursor: iso2 ? "pointer" : "default",
                      },
                      pressed: {
                        fill: "#00b36e",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export default memo(WorldMap);
