"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

// Dynamic import to avoid SSR issues with Leaflet
export function LocationPicker({
  latitude = 23.0225,
  longitude = 72.5714,
  onChange,
  height = "300px",
}: LocationPickerProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number) => void;
    height: string;
  }> | null>(null);

  useEffect(() => {
    // Dynamically import Leaflet only on client
    import("./LeafletMap").then((mod) => {
      setMapComponent(() => mod.LeafletMap);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div
        className="bg-cream-200 rounded-xl flex items-center justify-center text-gray-400"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin size={32} className="mx-auto mb-2" />
          <p className="text-sm">Loading map…</p>
        </div>
      </div>
    );
  }

  return <MapComponent lat={latitude} lng={longitude} onChange={onChange} height={height} />;
}
