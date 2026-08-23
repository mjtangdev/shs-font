'use client';

import React, { useEffect, useState, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface Device {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'alert';
}

interface MonitoringMapProps {
  devices: Device[];
  className?: string;
}

// Quezon Province focus configuration
const QUEZON_CENTER: [number, number] = [14.15, 121.75];
const QUEZON_BOUNDS: L.LatLngBoundsExpression = [
  [13.1, 121.2], // Southwest
  [15.3, 123.0], // Northeast
];

const WORLD_POLYGON: [number, number][] = [
  [90, -180], [90, 180], [-90, 180], [-90, -180]
];

/**
 * Accurate Quezon Province Mainland Polygon
 * High-precision coordinates capturing the elongated "hook" shape.
 */
const QUEZON_POLYGON: [number, number][] = [
  [15.118, 121.481], [15.050, 121.650], [14.920, 121.750], [14.850, 121.900],
  [14.920, 122.180], [14.850, 122.350], [14.720, 122.250], [14.650, 122.100],
  [14.420, 121.980], [14.300, 122.150], [14.120, 122.320], [14.050, 122.450],
  [14.020, 122.580], [13.920, 122.680], [13.880, 122.520], [13.780, 122.650],
  [13.720, 122.620], [13.620, 122.750], [13.350, 122.880], [13.250, 122.820],
  [13.180, 122.750], [13.250, 122.650], [13.320, 122.580], [13.500, 122.450],
  [13.580, 122.380], [13.700, 122.250], [13.820, 122.120], [13.780, 121.850],
  [13.850, 121.750], [13.880, 121.620], [13.920, 121.450], [14.050, 121.350],
  [14.150, 121.320], [14.280, 121.350], [14.380, 121.380], [14.450, 121.500],
  [14.520, 121.580], [14.650, 121.550], [14.750, 121.520], [14.850, 121.550],
  [14.950, 121.580], [15.118, 121.481]
];

// Fix for default marker icons - outside component to run only once
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const MonitoringMap = ({ devices, className }: MonitoringMapProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use resolvedTheme (handles 'system' mode correctly)
  const currentTheme = resolvedTheme || 'light';

  // Custom marker component to show status colors with a high-tech glow
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
    <div className={cn("relative w-full h-full rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-900", className)}>
      <MapContainer
        key={`map-instance-${currentTheme}`} // Force complete remount on theme change
        center={[14.25, 121.9]} // Adjusted center for better balance
        zoom={8} // Zoomed out slightly to see the full elongated shape
        minZoom={7}
        maxBounds={QUEZON_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={currentTheme === 'dark'
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
        />

        {/* Visual Mask: Opaque layer everything outside Quezon Province */}
        <Polygon
          positions={[WORLD_POLYGON, QUEZON_POLYGON]}
          pathOptions={{
            fillColor: currentTheme === 'dark' ? '#020617' : '#f8fafc',
            fillOpacity: 1.0,
            stroke: false,
          }}
        />

        {/* Highlight Border for Quezon Province */}
        <Polygon
          positions={QUEZON_POLYGON}
          pathOptions={{
            color: '#22c55e',
            weight: 2,
            fillOpacity: 0,
            dashArray: '10, 10'
          }}
        />

        <ZoomControl position="bottomright" />

        {devices.map((device) => (
          <Marker
            key={device.id}
            position={[device.lat, device.lng]}
            icon={createCustomIcon(device.status)}
          >
            <Popup className="monitoring-popup">
              <div className="p-1">
                <p className="font-black text-[10px] uppercase text-slate-500 mb-1">Unit Identity</p>
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

      {/* Legend */}
      <div className="absolute top-6 left-6 z-[1000] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl pointer-events-none select-none">
         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Live Fleet Map</h4>
         <div className="space-y-2">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500" />
               <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase">Operational</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-red-500" />
               <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase">Alert/Locked</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-slate-400" />
               <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase">Offline</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default memo(MonitoringMap);
