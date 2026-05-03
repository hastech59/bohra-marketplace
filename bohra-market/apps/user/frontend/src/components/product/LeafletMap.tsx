"use client";

import { useEffect, useRef } from "react";

interface LeafletMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height: string;
}

export function LeafletMap({ lat, lng, onChange, height }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  // Keep onChange in a ref so the map init effect doesn't need it as a dependency
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Initialise the map once on mount
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView([lat, lng], 13);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChangeRef.current(pos.lat, pos.lng);
      });

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng]);
        onChangeRef.current(e.latlng.lat, e.latlng.lng);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  // lat/lng intentionally omitted — initial position only; updates handled below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker position when lat/lng props change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      (markerRef.current as { setLatLng: (pos: [number, number]) => void }).setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-xl z-0" />
    </>
  );
}
