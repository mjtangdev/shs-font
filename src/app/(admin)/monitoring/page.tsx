'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity, MapPin, ShieldAlert, Wifi,
  Layers, Loader2, Maximize2, ExternalLink, Globe, Zap, AlertCircle, TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useHardwareMode } from "@/hooks/useHardwareMode";
import { useRouter } from 'next/navigation';
import { LiveClock } from "@/components/monitoring/LiveClock";
import { DigitalEchartsMap } from "@/components/monitoring/DigitalEchartsMap";

// --- [ MOCK DATA ] ---
const MOCK_STATS = {
  total: 1248,
  online: 1102,
  offline: 146,
  alerts: 12,
  onlineRate: 88.3
};

const MOCK_EVENTS = [
  { id: 1, type: 'up', device: 'SHS-8821', location: 'Lucena City', time: 'Just now' },
  { id: 2, type: 'down', device: 'SHS-1092', location: 'Tayabas', time: '2 mins ago' },
  { id: 3, type: 'alert', device: 'SHS-3304', location: 'Sariaya', reason: 'Voltage Low', time: '5 mins ago' },
  { id: 4, type: 'up', device: 'SHS-7761', location: 'Candelaria', time: '8 mins ago' },
  { id: 5, type: 'up', device: 'SHS-9902', location: 'Pagbilao', time: '12 mins ago' },
];

const GENERATE_QUEZON_DEVICES = () => {
  const devices = [];
  // Quezon is long and narrow (NW to SE)
  // Let's generate points along the main spine of the province
  for (let i = 0; i < 40; i++) {
    const ratio = i / 40;
    // Map NW [15.0, 121.5] to SE [13.4, 122.8] roughly
    const baseLat = 15.0 - (ratio * 1.6);
    const baseLng = 121.5 + (ratio * 1.3);

    // Add some random jitter
    const lat = baseLat + (Math.random() - 0.5) * 0.3;
    const lng = baseLng + (Math.random() - 0.5) * 0.3;

    const status = Math.random() > 0.15 ? 'online' : Math.random() > 0.5 ? 'alert' : 'offline';
    devices.push({
      id: `dev-${i}`,
      name: `SHS-UNIT-${1000 + i}`,
      lat,
      lng,
      status: status as any
    });
  }
  return devices;
};

const MOCK_DEVICES = GENERATE_QUEZON_DEVICES();

// --- [ COMPONENTS ] ---

function StatCard({ label, value, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    'bg-blue-500': 'text-blue-600 dark:text-blue-400',
    'bg-green-500': 'text-green-600 dark:text-green-400',
    'bg-primary': 'text-primary',
  };

  const accentColor = colorMap[color] || colorMap['bg-primary'];

  return (
    <div className="flex items-center gap-4 px-10 h-full group">
      <div className={cn("shrink-0 transition-transform group-hover:scale-110 duration-500", accentColor)}>
        <Icon size={18} className="stroke-[2.5px]" />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}:</span>
        <h3 className={cn("text-xl font-black italic tracking-tighter tabular-nums leading-none", accentColor)}>
          {value}
        </h3>
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  const { isNextGen, mounted } = useHardwareMode();
  const router = useRouter();
  const [devices, setDevices] = useState(MOCK_DEVICES);

  // Simulate real-time status changes
  useEffect(() => {
    if (!mounted || !isNextGen) return;
    const interval = setInterval(() => {
      setDevices(prev => prev.map(d => {
        if (Math.random() > 0.9) { // 10% chance of status change per tick
          const statuses: ('online' | 'offline' | 'alert')[] = ['online', 'offline', 'alert'];
          return { ...d, status: statuses[Math.floor(Math.random() * 3)] };
        }
        return d;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [mounted, isNextGen]);

  useEffect(() => {
    if (mounted && !isNextGen) {
      router.push('/dashboard');
    }
  }, [mounted, isNextGen, router]);

  if (!mounted || !isNextGen) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 px-6 overflow-hidden font-sans transition-colors duration-500">

      <header className="flex flex-col xl:flex-row items-center gap-6 mb-6">
        {/* Left Capsule: Metrics Section */}
        <div className="flex items-center h-20 flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-none px-6">
          <div className="flex items-center h-full w-full justify-start gap-2">
            <StatCard label="Total Fleet" value={MOCK_STATS.total} icon={Layers} color="bg-blue-500" />
            <div className="h-8 w-px bg-slate-100 dark:bg-white/5 mx-2" />
            <StatCard label="Active Online" value={MOCK_STATS.online} icon={Wifi} color="bg-green-500" />
            <div className="h-8 w-px bg-slate-100 dark:bg-white/5 mx-2" />
            <StatCard label="System Health" value={`${MOCK_STATS.onlineRate}%`} icon={Activity} color="bg-primary" />
          </div>
        </div>

        {/* Right Capsule: Time & Clock Section */}
        <div className="flex items-center justify-center h-20 min-w-[420px] bg-white dark:bg-slate-900 rounded-2xl shadow-none px-8 transition-colors">
          <LiveClock />
        </div>
      </header>

      <div className="relative grid grid-cols-12 gap-6 h-[calc(100vh-165px)]">

        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <DigitalEchartsMap devices={devices} className="h-full w-full" />
        </div>

        <div className="col-span-12 lg:col-span-3 z-10 flex flex-col h-full overflow-hidden">
          <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 flex flex-col h-full shadow-2xl dark:shadow-none transition-colors">
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Activity size={14} className="text-primary" /> Live Event Stream
              </h4>
            </div>
            <ScrollArea className="flex-1 p-4">
               <div className="space-y-4">
                 {MOCK_EVENTS.map((ev) => (
                   <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={ev.id}
                    className="flex gap-3 border-l-2 border-slate-100 dark:border-white/5 pl-4 pb-2"
                   >
                      <div className={cn(
                        "mt-1 w-2 h-2 rounded-full",
                        ev.type === 'up' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                        ev.type === 'down' ? 'bg-slate-400 dark:bg-slate-600' : 'bg-red-500'
                      )}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white">{ev.device}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">{ev.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {ev.type === 'up' ? 'Re-established connection' :
                           ev.type === 'down' ? 'Signal lost' : `Critical: ${ev.reason}`}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter italic">
                          <MapPin size={8} /> {ev.location}
                        </div>
                      </div>
                   </motion.div>
                 ))}
               </div>
            </ScrollArea>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-6 pointer-events-none"></div>

        <div className="col-span-12 lg:col-span-3 z-10 flex flex-col h-full overflow-hidden">
          <Card className="bg-red-500/5 backdrop-blur-xl border-red-500/10 dark:border-red-500/20 p-6 flex flex-col gap-4 shadow-2xl dark:shadow-none transition-colors h-full overflow-hidden">
             <div className="flex items-center gap-2 text-red-500 shrink-0">
                <AlertCircle size={18} />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Critical Failures</h4>
             </div>

             <ScrollArea className="flex-1 pr-2">
               <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white/50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-tighter italic tabular-nums">Fault_Code_Ex_{i}</span>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest tabular-nums">4h ago</span>
                       </div>
                       <p className="text-[10px] text-slate-700 dark:text-white font-medium mb-2">SHS Unit #{Math.floor(Math.random()*9000 + 1000)} reported Battery Degradation.</p>
                       <button className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[8px] font-black uppercase tracking-[0.3em] rounded-lg transition-colors border border-red-500/10">Dispatch</button>
                    </div>
                  ))}
               </div>
             </ScrollArea>
          </Card>

          <div className="pt-2 text-center shrink-0">
            <p className="text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">shs.nextgen.kernel.v2.monitoring</p>
          </div>
        </div>
      </div>
    </div>
  );
}
