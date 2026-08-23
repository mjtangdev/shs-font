'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface Device {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'alert';
}

interface VectorQuezonMapProps {
  devices: Device[];
  className?: string;
}

// Quezon Province Bounds (Tightest box around the province)
const BOUNDS = {
  minLat: 13.1,
  maxLat: 15.3,
  minLng: 121.2,
  maxLng: 123.0
};

// High-precision boundary points for Quezon Province
const QUEZON_POINTS: [number, number][] = [
  [15.118, 121.481], [15.150, 121.550], [15.220, 121.650], [15.180, 121.750],
  [14.920, 121.750], [14.850, 121.900], [14.920, 122.180], [14.850, 122.350],
  [14.720, 122.250], [14.650, 122.100], [14.420, 121.980], [14.300, 122.150],
  [14.120, 122.320], [14.050, 122.450], [14.020, 122.580], [13.920, 122.680],
  [13.880, 122.520], [13.780, 122.650], [13.720, 122.620], [13.620, 122.750],
  [13.350, 122.880], [13.250, 122.820], [13.180, 122.750], [13.250, 122.650],
  [13.320, 122.580], [13.500, 122.450], [13.580, 122.380], [13.700, 122.250],
  [13.820, 122.120], [13.780, 121.850], [13.850, 121.750], [13.880, 121.620],
  [13.920, 121.450], [14.050, 121.350], [14.150, 121.320], [14.280, 121.350],
  [14.380, 121.380], [14.450, 121.500], [14.520, 121.580], [14.650, 121.550],
  [14.750, 121.520], [14.850, 121.550], [14.950, 121.580], [15.118, 121.481]
];

const VIEW_BOX = { width: 800, height: 1000 };

export function VectorQuezonMap({ devices, className }: VectorQuezonMapProps) {

  // Projection logic: Map Lat/Lng to SVG X/Y
  const project = (lat: number, lng: number) => {
    const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * VIEW_BOX.width;
    // Invert Y because SVG coordinates start from top
    const y = VIEW_BOX.height - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * VIEW_BOX.height;
    return { x, y };
  };

  const pathData = useMemo(() => {
    return QUEZON_POINTS.map((p, i) => {
      const { x, y } = project(p[0], p[1]);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ') + ' Z';
  }, []);

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center p-4", className)}>
      <svg
        viewBox={`0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`}
        className="w-full h-full drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* The Province Shape */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          d={pathData}
          className="text-primary"
          fill="url(#mapGradient)"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Subtle Inner Grid / Mesh effect */}
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="opacity-20"
          strokeDasharray="4 4"
        />

        {/* Device Markers */}
        {devices.map((device) => {
          const { x, y } = project(device.lat, device.lng);
          const color = device.status === 'online' ? '#22c55e' : device.status === 'alert' ? '#ef4444' : '#64748b';

          return (
            <g key={device.id} className="cursor-pointer group">
              {/* Outer Glow Ring */}
              <motion.circle
                cx={x}
                cy={y}
                r="8"
                fill={color}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              {/* Main Dot */}
              <motion.circle
                cx={x}
                cy={y}
                r="4"
                fill={color}
                className="shadow-xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 + Math.random() }}
              />

              {/* Tooltip Label (Visible on hover via SVG CSS) */}
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                className="text-[14px] font-bold fill-slate-900 dark:fill-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ filter: 'url(#glow)' }}
              >
                {device.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend Overlay - Pure UI */}
      <div className="absolute bottom-8 left-8 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hidden xl:block">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Geospatial Legend</h4>
        <div className="space-y-2">
          {[
            { label: 'Operational', color: 'bg-green-500' },
            { label: 'Critical Alert', color: 'bg-red-500' },
            { label: 'Standby / Offline', color: 'bg-slate-400' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", item.color)} />
              <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
