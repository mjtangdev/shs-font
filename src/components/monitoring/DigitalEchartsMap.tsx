'use client';

import React, { useEffect, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useTheme } from "next-themes";
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { QUEZON_DISTRICTS_GEO } from "@/lib/assets/maps/quezon_districts_data";

interface Device {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'alert';
}

interface DigitalEchartsMapProps {
  devices: Device[];
  className?: string;
}

export function DigitalEchartsMap({ devices, className }: DigitalEchartsMapProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    echarts.registerMap('QuezonDigital', QUEZON_DISTRICTS_GEO as any);
    setMounted(true);
  }, []);

  const option = useMemo(() => {
    if (!mounted) return {};

    const scatterData = devices.map(d => ({
      name: d.name,
      value: [d.lng, d.lat, d.status],
      itemStyle: {
        color: d.status === 'online' ? '#22c55e' : d.status === 'alert' ? '#ef4444' : '#94a3b8'
      }
    }));

    // NextGen Minimalist Palette
    const colors = isDark
      ? {
          border: '#38bdf8', // Light blue neon
          area: 'rgba(15, 23, 42, 0.4)', // Very subtle deep slate
          glow: 'rgba(56, 189, 248, 0.4)',
          text: '#94a3b8'
        }
      : {
          border: '#0ea5e9',
          area: 'rgba(241, 245, 249, 0.5)',
          glow: 'rgba(14, 165, 233, 0.2)',
          text: '#64748b'
        };

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.seriesType === 'effectScatter' || params.seriesType === 'scatter') {
            const status = params.value[2];
            return `
              <div style="padding: 12px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white;">
                <p style="font-size: 9px; text-transform: uppercase; opacity: 0.5; margin-bottom: 4px; font-weight: 900; letter-spacing: 0.2em;">Terminal node</p>
                <p style="font-weight: 900; font-size: 15px; margin-bottom: 8px; letter-spacing: -0.02em;">${params.name}</p>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: ${params.color}; box-shadow: 0 0 12px ${params.color};"></div>
                  <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">Status: ${status}</span>
                </div>
              </div>
            `;
          }
          return `<div style="padding: 6px 12px; background: #0ea5e9; color: white; border-radius: 4px; font-size: 11px; font-weight: 900; text-transform: uppercase;">${params.name} Zone</div>`;
        },
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0
      },
      geo: {
        map: 'QuezonDigital',
        roam: true,
        zoom: 1.15,
        layoutCenter: ['50%', '50%'],
        layoutSize: '100%',
        label: {
          show: false // Hide labels by default for cleaner look
        },
        emphasis: {
          label: {
            show: true,
            color: '#fff',
            fontSize: 10,
            fontWeight: '900',
            textTransform: 'uppercase'
          },
          itemStyle: {
            areaColor: 'rgba(56, 189, 248, 0.15)',
            borderColor: '#7dd3fc',
            borderWidth: 2,
            shadowBlur: 20,
            shadowColor: 'rgba(56, 189, 248, 0.5)'
          }
        },
        itemStyle: {
          areaColor: colors.area,
          borderColor: colors.border,
          borderWidth: 1, // Fine lines
          shadowBlur: 10,
          shadowColor: colors.glow,
          shadowOffsetX: 0,
          shadowOffsetY: 0
        },
        regions: [
          { name: 'North', itemStyle: { areaColor: 'rgba(56, 189, 248, 0.05)' } },
          { name: 'Central', itemStyle: { areaColor: 'rgba(34, 197, 94, 0.05)' } },
          { name: 'South', itemStyle: { areaColor: 'rgba(239, 68, 68, 0.05)' } }
        ]
      },
      series: [
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: scatterData.filter(d => d.value[2] !== 'offline'),
          symbolSize: (val: any) => val[2] === 'alert' ? 10 : 6,
          showEffectOn: 'render',
          rippleEffect: {
            brushType: 'stroke',
            scale: 6,
            period: 6,
            number: 2
          },
          zlevel: 2
        },
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          data: scatterData.filter(d => d.value[2] === 'offline'),
          symbolSize: 4,
          itemStyle: {
             opacity: 0.4,
             color: '#64748b'
          },
          zlevel: 1
        }
      ]
    };
  }, [mounted, devices, isDark]);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary/20" size={32} />
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full relative group", className)}>
      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07] z-10"
           style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}
