import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useRef, useCallback, useState } from "react";
import usePersonaStore from "../store/personaStore";
import axios from "axios";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Dark map style matching the dashboard aesthetic
const DARK_STYLE = [
  { elementType: "geometry",        stylers: [{ color: "#0d1220" }] },
  { elementType: "labels.text.fill",stylers: [{ color: "#4a5568" }] },
  { elementType: "labels.text.stroke",stylers:[{ color: "#0d1220" }] },
  { featureType: "administrative",  elementType: "geometry.stroke", stylers: [{ color: "#1a2438" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#2a3a58" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "landscape",       elementType: "geometry", stylers: [{ color: "#0d1220" }] },
  { featureType: "poi",             stylers: [{ visibility: "off" }] },
  { featureType: "road",            stylers: [{ visibility: "off" }] },
  { featureType: "transit",         stylers: [{ visibility: "off" }] },
  { featureType: "water",           elementType: "geometry", stylers: [{ color: "#060d1a" }] },
  { featureType: "water",           elementType: "labels.text.fill", stylers: [{ color: "#1a2438" }] },
];

const MAP_OPTIONS = {
  styles: DARK_STYLE,
  disableDefaultUI: true,
  zoomControl: true,
  zoomControlOptions: { position: 9 }, // BOTTOM_RIGHT
  gestureHandling: "greedy",
  minZoom: 2,
  maxZoom: 8,
  restriction: {
    latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
    strictBounds: true,
  },
};

const CENTER = { lat: 20, lng: 10 };

// Score → fill color
function scoreToColor(score) {
  if (score === null || score === undefined) return "#1e2d45";
  if (score > 0.3)  return "#00c878"; // green
  if (score < -0.3) return "#ff4757"; // red
  return "#ffb300"; // amber
}
function scoreToOpacity(score) {
  if (score === null || score === undefined) return 0.15;
  return 0.45 + Math.abs(score) * 0.35;
}

// GeoJSON source for world countries
const GEOJSON_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

export default function WorldMap({ onCountrySelect }) {
  const persona = usePersonaStore((s) => s.persona);
  const mapRef = useRef(null);
  const dataLayerRef = useRef(null);
  const sentimentCache = useRef({});
  const [mapLoaded, setMapLoaded] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    id: "worldlens-map",
  });

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMapLoaded(true);

    // Load country GeoJSON data layer
    const dataLayer = new window.google.maps.Data({ map });
    dataLayerRef.current = dataLayer;
    dataLayer.loadGeoJson(GEOJSON_URL);

    // Default style
    dataLayer.setStyle((feature) => {
      const iso = feature.getProperty("ISO3166-1-Alpha-2");
      const score = sentimentCache.current[iso] ?? null;
      return {
        fillColor: scoreToColor(score),
        fillOpacity: scoreToOpacity(score),
        strokeColor: "#2a3a58",
        strokeWeight: 0.6,
        cursor: "pointer",
      };
    });

    // Hover effects
    let lastHovered = null;
    dataLayer.addListener("mouseover", (e) => {
      if (lastHovered) dataLayer.revertStyle(lastHovered.feature);
      lastHovered = e;
      dataLayer.overrideStyle(e.feature, {
        strokeColor: "#00e68e",
        strokeWeight: 1.5,
        fillOpacity: Math.min(scoreToOpacity(
          sentimentCache.current[e.feature.getProperty("ISO3166-1-Alpha-2")] ?? null
        ) + 0.15, 0.85),
      });
    });

    dataLayer.addListener("mouseout", (e) => {
      dataLayer.revertStyle(e.feature);
    });

    // Click → select country
    dataLayer.addListener("click", (e) => {
      const iso  = e.feature.getProperty("ISO3166-1-Alpha-2");
      const name = e.feature.getProperty("name") || iso;
      if (iso && onCountrySelect) onCountrySelect(iso, name);
    });
  }, [onCountrySelect]);

  // Re-color all countries when persona changes or map loads
  useEffect(() => {
    if (!mapLoaded || !dataLayerRef.current) return;

    const fetchSeedSentiments = async () => {
      const seedCodes = ["US","GB","DE","IN","CN","FR","JP","BR","AU","CA","RU","ZA"];
      await Promise.allSettled(
        seedCodes.map(async (iso) => {
          if (sentimentCache.current[iso] !== undefined) return;
          try {
            const res = await axios.get(`/api/country/${iso}`, { params: { persona } });
            sentimentCache.current[iso] = res.data?.sentiment?.overall_score ?? 0;
          } catch {
            sentimentCache.current[iso] = 0;
          }
        })
      );
      // Trigger re-style
      dataLayerRef.current?.setStyle((feature) => {
        const iso = feature.getProperty("ISO3166-1-Alpha-2");
        const score = sentimentCache.current[iso] ?? null;
        return {
          fillColor: scoreToColor(score),
          fillOpacity: scoreToOpacity(score),
          strokeColor: "#2a3a58",
          strokeWeight: 0.6,
          cursor: "pointer",
        };
      });
    };

    fetchSeedSentiments();
  }, [mapLoaded, persona]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">
        Failed to load Google Maps. Check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading map…</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerClassName="map-container"
      center={CENTER}
      zoom={2.5}
      options={MAP_OPTIONS}
      onLoad={onMapLoad}
    />
  );
}
