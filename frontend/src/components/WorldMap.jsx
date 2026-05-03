import React, { useState, useEffect, memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker
} from "react-simple-maps";
import axios from "axios";
import usePersonaStore from "../store/personaStore";
import isoCountries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

// Register english locale for country names
isoCountries.registerLocale(enLocale);

// A lightweight TopoJSON for countries (~100KB)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Approximate centroids for the primary onboarding countries
const COUNTRY_COORDS = {
  "IN": [78.9629, 20.5937],
  "US": [-95.7129, 37.0902],
  "GB": [-3.4360, 55.3781],
  "DE": [10.4515, 51.1657],
  "JP": [138.2529, 36.2048],
  "CN": [104.1954, 35.8617],
  "FR": [2.2137, 46.2276],
  "CA": [-106.3468, 56.1304],
  "AU": [133.7751, -25.2744],
  "BR": [-51.9253, -14.2350],
  "RU": [105.3188, 61.5240],
  "KR": [127.7669, 35.9078],
  "IT": [12.5674, 41.8719],
  "ES": [-3.7492, 40.4637],
  "MX": [-102.5528, 23.6345],
  "ID": [113.9213, -0.7893],
  "NL": [5.2913, 52.1326],
  "SA": [45.0792, 23.8859],
  "TR": [35.2433, 38.9637],
  "CH": [8.2275, 46.8182],
  "AE": [53.8478, 23.4241],
  "SG": [103.8198, 1.3521],
  "ZA": [22.9375, -30.5595],
  "IL": [34.8516, 31.0461],
  "SE": [18.6435, 60.1282],
  "NO": [8.4689, 60.4720],
  "DK": [9.5018, 56.2639],
  "FI": [25.7482, 61.9241],
  "AR": [-63.6167, -38.4161],
  "EG": [30.8025, 26.8206],
  "VN": [108.2772, 14.0583],
  "TH": [100.9925, 15.8700],
  "MY": [101.9758, 4.2105],
  "NG": [8.6753, 9.0820]
};

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
  const selectedCountries = usePersonaStore((s) => s.selectedCountries);
  const [scores, setScores] = useState({});
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
  });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Map selected country names to ISO codes
  const highlightedISOs = (selectedCountries || []).map(name => isoCountries.getAlpha2Code(name, "en"));

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

  const mapScale = dimensions.width < 640 ? 100 : dimensions.width < 1024 ? 130 : 147;

  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: "var(--map-bg)" }}>
      <ComposableMap
        projectionConfig={{ scale: mapScale }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup center={[0, 10]} maxZoom={10} minZoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const iso2 = geo.id ? isoCountries.numericToAlpha2(geo.id) : null;
                const isHighlighted = highlightedISOs.includes(iso2);
                const score = iso2 ? scores[iso2] : null;
                const color = isHighlighted ? "#00f5a0" : scoreToColor(score);
                const opacity = isHighlighted ? 0.9 : scoreToOpacity(score);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    stroke={isHighlighted ? "#00f5a0" : "var(--map-stroke)"}
                    strokeWidth={isHighlighted ? 1.5 : 0.5}
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
                        transition: "all 0.3s ease"
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

          {highlightedISOs.map(iso => {
            const coords = COUNTRY_COORDS[iso];
            if (!coords) return null;
            const name = isoCountries.getName(iso, "en");

            return (
              <Marker key={iso} coordinates={coords}>
                <text
                  textAnchor="middle"
                  y={-15}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fill: "var(--map-label-fill)",
                    stroke: "var(--map-label-stroke)",
                    strokeWidth: "2px",
                    paintOrder: "stroke",
                    fontSize: "8px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    pointerEvents: "none",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                  }}
                >
                  {name}
                </text>
                <circle r={2.5} fill="var(--map-label-fill)" stroke="var(--map-label-stroke)" strokeWidth={0.5} />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export default memo(WorldMap);
