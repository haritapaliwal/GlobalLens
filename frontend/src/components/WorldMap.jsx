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

const GEOJSON_URL = "/map.json";

export default function WorldMap({ onCountrySelect, refreshKey }) {
  const persona = usePersonaStore((s) => s.persona);
  const mapRef = useRef(null);
  const dataLayerRef = useRef(null);
  const [scores, setScores] = useState({});
  const [mapLoaded, setMapLoaded] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    id: "worldlens-map",
  });

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    
    const dataLayer = map.data;
    dataLayerRef.current = dataLayer;
    
    dataLayer.loadGeoJson(GEOJSON_URL, { idPropertyName: "ISO3166-1-Alpha-2" });

    dataLayer.setStyle((feature) => {
      const iso = feature.getProperty("ISO3166-1-Alpha-2") || feature.getId();
      const score = scores[iso] ?? null;
      
      return {
        fillColor: scoreToColor(score),
        fillOpacity: scoreToOpacity(score),
        strokeColor: "#2a3a58",
        strokeWeight: 0.8,
        cursor: "pointer",
        visible: true
      };
    });

    dataLayer.addListener("mouseover", (e) => {
      dataLayer.overrideStyle(e.feature, {
        strokeColor: "#00e68e",
        strokeWeight: 2,
        fillOpacity: 0.8,
      });
    });

    dataLayer.addListener("mouseout", (e) => {
      dataLayer.revertStyle(e.feature);
    });

    dataLayer.addListener("click", (e) => {
      const iso = e.feature.getProperty("ISO3166-1-Alpha-2") || e.feature.getId();
      const name = e.feature.getProperty("name") || iso;
      if (iso && onCountrySelect) onCountrySelect(iso, name);
    });

    setMapLoaded(true);
  }, [onCountrySelect, scores]);

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

  // Update map styles whenever scores change
  useEffect(() => {
    if (!mapLoaded || !dataLayerRef.current) return;
    
    dataLayerRef.current.setStyle((feature) => {
      const iso = feature.getProperty("ISO3166-1-Alpha-2") || feature.getId();
      const score = scores[iso] ?? null;
      return {
        fillColor: scoreToColor(score),
        fillOpacity: scoreToOpacity(score),
        strokeColor: "#2a3a58",
        strokeWeight: 0.8,
        cursor: "pointer",
      };
    });
  }, [scores, mapLoaded]);

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
