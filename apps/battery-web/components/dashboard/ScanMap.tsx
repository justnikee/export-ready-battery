"use client";

import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json";

// Fallback latitude and longitude coordinates [lat, lng] for common country names
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  india: [20.5937, 78.9629],
  germany: [51.1657, 10.4515],
  "united states": [37.0902, -95.7129],
  usa: [37.0902, -95.7129],
  "united kingdom": [55.3781, -3.4360],
  uk: [55.3781, -3.4360],
  france: [46.2276, 2.2137],
  japan: [36.2048, 138.2529],
  china: [35.8617, 104.1954],
  "south korea": [35.9078, 127.7669],
  korea: [35.9078, 127.7669],
  canada: [56.1304, -106.3468],
  australia: [-25.2744, 133.7751],
  brazil: [-14.235, -51.9253],
  spain: [40.4637, -3.7492],
  italy: [41.8719, 12.5674],
  netherlands: [52.1326, 5.2913],
  sweden: [60.1282, 18.6435],
  singapore: [1.3521, 103.8198],
  development: [20.5937, 78.9629],
  local: [20.5937, 78.9629],
};

interface ScanLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  scanned_at?: string;
}

interface ScanMapProps {
  scans: ScanLocation[];
  height?: number;
}

type GeoFeature = { rsmKey: string } & Record<string, unknown>;

function ScanMapComponent({ scans, height = 420 }: ScanMapProps) {
  // Zoom scale state — initial zoom increased to 160
  const [scale, setScale] = useState(160);
  const [center] = useState<[number, number]>([20, 15]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(600, Math.round(prev * 1.35)));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(80, Math.round(prev / 1.35)));
  };

  const handleReset = () => {
    setScale(160);
  };

  // Resolve scan coordinates with country fallback
  const markers = useMemo(() => {
    const resolvedScans = scans.map((s) => {
      let lat = s.latitude;
      let lng = s.longitude;

      if ((!lat && !lng) || (lat === 0 && lng === 0)) {
        const countryKey = (s.country || "").toLowerCase().trim();
        const fallback =
          COUNTRY_COORDINATES[countryKey] || COUNTRY_COORDINATES["india"];
        lat = fallback[0];
        lng = fallback[1];
      }

      return {
        ...s,
        latitude: lat,
        longitude: lng,
      };
    });

    const locationMap = new Map<string, ScanLocation & { count: number }>();
    resolvedScans.forEach((scan) => {
      const key = `${Math.round(scan.latitude)},${Math.round(scan.longitude)}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, { ...scan, count: 1 });
      } else {
        const existing = locationMap.get(key)!;
        existing.count++;
      }
    });

    return Array.from(locationMap.values());
  }, [scans]);

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-card/40 border border-border/60"
      style={{ height }}
    >
      {/* Dark background layer */}
      <div className="absolute inset-0 bg-sidebar/80" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Map visualization with controlled scale */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale,
          center,
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const feature = geo as GeoFeature;
              return (
                <Geography
                  key={feature.rsmKey}
                  geography={geo}
                  fill="rgba(255, 255, 255, 0.07)"
                  stroke="rgba(255, 255, 255, 0.14)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "rgba(16, 185, 129, 0.25)" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Scan location markers */}
        {markers.map((marker, i) => (
          <Marker
            key={`${marker.latitude}-${marker.longitude}-${i}`}
            coordinates={[marker.longitude, marker.latitude]}
          >
            {/* Outer pulse ring */}
            <circle
              r={14}
              fill="none"
              stroke="#10b981"
              strokeWidth={1.5}
              opacity={0.4}
              className="animate-ping"
              style={{
                transformOrigin: "center",
                animationDuration: "2.5s",
                animationDelay: `${i * 0.3}s`,
              }}
            />
            {/* Middle glow ring */}
            <circle
              r={8}
              fill="none"
              stroke="#34d399"
              strokeWidth={1}
              opacity={0.7}
              className="animate-pulse"
            />
            {/* Core dot */}
            <circle
              r={5}
              fill="#10b981"
              stroke="#a7f3d0"
              strokeWidth={1.5}
              style={{
                filter: "drop-shadow(0 0 8px #10b981)",
              }}
            />
            {/* Count / location badge */}
            <text
              textAnchor="middle"
              y={-14}
              style={{
                fontFamily: "system-ui",
                fontSize: "9px",
                fontWeight: 700,
                fill: "#a7f3d0",
                textShadow: "0 0 6px rgba(0,0,0,0.9)",
              }}
            >
              {marker.city && marker.city !== "Unknown"
                ? marker.city
                : marker.country}
              {marker.count > 1 ? ` (${marker.count})` : ""}
            </text>
          </Marker>
        ))}
      </ComposableMap>

      {/* Top-left status badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/80 backdrop-blur-md border border-border/80 text-xs font-semibold text-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live Scans</span>
        </div>
      </div>

      {/* Top-right zoom controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-card/80 backdrop-blur-md border border-border/80 p-1 rounded-lg z-10 shadow-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-foreground hover:bg-accent rounded-md"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-foreground hover:bg-accent rounded-md"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-foreground hover:bg-accent rounded-md"
          onClick={handleReset}
          title="Reset View"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Bottom-right stats badge */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <div className="px-2.5 py-1 rounded-full bg-card/80 backdrop-blur-md border border-border/80 text-xs font-medium text-muted-foreground">
          {markers.length} {markers.length === 1 ? "location" : "locations"}
        </div>
      </div>
    </div>
  );
}

export const ScanMap = ScanMapComponent;
