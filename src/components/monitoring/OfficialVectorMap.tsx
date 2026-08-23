'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { QUEZON_GEO_DATA } from "@/lib/assets/maps/quezon_geo";

interface Device {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'alert';
}

interface OfficialVectorMapProps {
  devices: Device[];
  className?: string;
}

// Bounding box for Quebec Province projection
const GEO_BOUNDS = {
  minLng: 121.2,
  maxLng: 123.0,
  minLat: 13.1,
  maxLat: 15.3,
};

const SVG_SIZE = { width: 800, height: 1000 };

export function OfficialVectorMap({ devices, className }: OfficialVectorMapProps) {

  // Projection: Map [lng, lat] to [x, y]
  const project = useMemo(() => (lng: number, lat: number) => {
    const x = ((lng - GEO_BOUNDS.minLng) / (GEO_BOUNDS.maxLng - GEO_BOUNDS.minLng)) * SVG_SIZE.width;
    // Y is inverted in SVG
    const y = SVG_SIZE.height - ((lat - GEO_BOUNDS.minLat) / (GEO_BOUNDS.maxLat - GEO_BOUNDS.minLat)) * SVG_SIZE.height;
    return { x, y };
  }, []);

  // Construct Path Data
  const mainlandPath = useMemo(() => {
    return QUEZON_GEO_DATA.mainland.map((point, i) => {
      const { x, y } = project(point[0], point[1]);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ') + ' Z';
  }, [project]);

  const islandsPaths = useMemo(() => {
    return QUEZON_GEO_DATA.islands.map(island => {
      return island.map((point, i) => {
        const { x, y } = project(point[0], point[1]);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' ') + ' Z';
    });
  }, [project]);

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center p-4 select-none", className)}>
      <svg
        viewBox={`0 0 ${SVG_SIZE.width} ${SVG_SIZE.height}`}
        className="w-full h-full filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="qzGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
          <filter id="qzGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Mainland Shape */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          d={mainlandPath}
          className="text-primary"
          fill="url(#qzGradient)"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Islands */}
        {islandsPaths.map((path, idx) => (
          <motion.path
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + idx * 0.2 }}
            d={path}
            className="text-primary"
            fill="url(#qzGradient)"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}

        {/* Tactical Grid / Inner detail */}
        <motion.path
          d={mainlandPath}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="opacity-20"
          strokeDasharray="4 8"
        />

        {/* Dynamic Markers */}
        {devices.map((device) => {
          const { x, y } = project(device.lng, device.lat);
          const color = device.status === 'online' ? '#22c55e' : device.status === 'alert' ? '#ef4444' : '#94a3b8';

          return (
            <g key={device.id} className="cursor-pointer group">
              {/* Pulse effect */}
              <motion.circle
                cx={x}
                cy={y}
                r="10"
                fill={color}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0.3, 0, 0.3], scale: [1, 2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Center Dot */}
              <circle
                cx={x}
                cy={y}
                r="4"
                fill={color}
                className="stroke-white dark:stroke-slate-900 stroke-[1.5px]"
              />

              {/* Interaction Overlay */}
              <circle
                cx={x}
                cy={y}
                r="15"
                fill="transparent"
              />

              {/* Floating Label on Hover */}
              <foreignObject x={x + 10} y={y - 20} width="120" height="40" className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-slate-900/90 backdrop-blur-sm border border-white/10 px-2 py-1 rounded text-[10px] font-black text-white uppercase italic tracking-tighter">
                   {device.name}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      {/* Stats Overlay for the Map itself */}
      <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none">
        <h2 className="text-sm font-black italic uppercase tracking-widest text-slate-400 dark:text-slate-500">Fleet Geospatial</h2>
        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">Region: Quezon (IV-A)</p>
      </div>
    </div>
  );
}
