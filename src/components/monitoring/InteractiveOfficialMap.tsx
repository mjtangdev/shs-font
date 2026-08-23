'use client';

import React, { useEffect, useState, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { QUEZON_GEO_DATA } from "@/lib/assets/maps/quezon_geo";

interface Device {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'alert';
}

interface InteractiveOfficialMapProps {
  devices: Device[];
  className?: string;
}

// Global world boundary to create the mask
const WORLD_OUTER: [number, number][] = [
  [90, -180], [90, 180], [-90, 180], [-90, -180]
];

// Combine mainland and islands into a single hole array for the mask
const ALL_QUEZON_HOLES: [number, number][][] = [
  QUEZON_GEO_DATA.mainland.map(p => [p[1], p[0]] as [number, number]), // Swap to [lat, lng] for Leaflet
  ...QUEZON_GEO_DATA.islands.map(island => island.map(p => [p[1], p[0]] as [number, number]))
];

// Calculated center and bounds for Quezon
const QUEZON_CENTER: [number, number] = [14.15, 121.75];
const QUEZON_BOUNDS: L.LatLngBoundsExpression = [
  [13.1, 121.2],
  [15.3, 123.0]
];

// Fix for default marker icons
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const InteractiveOfficialMap = ({ devices, className }: InteractiveOfficialMapProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = resolvedTheme || 'light';

  // Background color matching the dashboard for perfect island effect
  const maskColor = currentTheme === 'dark' ? '#020617' : '#f8fafc';

  const createCustomIcon = (status: string) => {
    const color = status === 'online' ? '#22c55e' : status === 'alert' ? '#ef4444' : '#94a3b8';
    const shadow = status === 'online' ? '0 0 10px rgba(34,197,94,0.6)' : status === 'alert' ? '0 0 10px rgba(239,68,68,0.6)' : 'none';

    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: ${shadow};"></div>`,
      className: 'custom-div-icon',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  };

  if (!mounted) {
    return <div className={cn("w-full h-full bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl", className)}></div>;
  }

  return (
    <div className={cn("relative w-full h-full rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5", className)}>
      <MapContainer
        key={`interactive-map-${currentTheme}`}
        center={QUEZON_CENTER}
        zoom={9}
        minZoom={8}
        maxBounds={QUEZON_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%', background: maskColor }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={currentTheme === 'dark'
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
        />

        {/* MASK LAYER: The "Hole" in the world that reveals the map only for Quezon */}
        <Polygon
          positions={[WORLD_OUTER, ...ALL_QUEZON_HOLES]}
          pathOptions={{
            fillColor: maskColor,
            fillOpacity: 1.0,
            stroke: false,
          }}
        />

        {/* Outline for Quezon boundary to give it definition */}
        {ALL_QUEZON_HOLES.map((path, idx) => (
          <Polygon
            key={`outline-${idx}`}
            positions={path}
            pathOptions={{
              color: currentTheme === 'dark' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.2)',
              weight: 1,
              fillOpacity: 0,
              dashArray: '5, 10'
            }}
          />
        ))}

        <ZoomControl position="bottomright" />

        {devices.map((device) => (
          <Marker
            key={device.id}
            position={[device.lat, device.lng]}
            icon={createCustomIcon(device.status)}
          >
            <Popup className="monitoring-popup">
              <div className="p-1">
                <p className="font-black text-[10px] uppercase text-slate-500 mb-1">Device ID</p>
                <p className="font-bold text-sm text-slate-900 mb-2">{device.name}</p>
                <div className="flex items-center gap-2">
                   <div className={cn("w-2 h-2 rounded-full", device.status === 'online' ? 'bg-green-500' : device.status === 'alert' ? 'bg-red-500' : 'bg-slate-400')} />
                   <span className="text-[10px] font-black uppercase tracking-widest">{device.status}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default memo(InteractiveOfficialMap);
