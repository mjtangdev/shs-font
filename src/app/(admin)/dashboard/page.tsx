'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Wallet, BarChart3, ShieldCheck, Users, Cpu,
  RefreshCcw, TrendingUp, ArrowUpRight, Zap
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Breadcrumbs from '@/components/Breadcrumbs';
import { cn } from "@/lib/utils";

// --- [Mock Data / 模拟数据] ---
const revenueData = [
  { date: '04-08', amount: 2400 }, { date: '04-09', amount: 1800 },
  { date: '04-10', amount: 3200 }, { date: '04-11', amount: 2100 },
  { date: '04-12', amount: 4500 }, { date: '04-13', amount: 3800 },
  { date: '04-14', amount: 5200 },
];

const deviceDistData = [
  { name: 'Active', value: 842 },
  { name: 'Inactive', value: 120 },
  { name: 'Maintenance', value: 45 },
];

const COLORS = ['oklch(0.65 0.25 300)', 'oklch(0.75 0.2 150)', 'oklch(0.45 0.05 280)'];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const getStoredSetupStatus = () => {
    if (typeof window === 'undefined') return { provider_config_set: true, rate_set: true, region_set: true };
    const saved = localStorage.getItem('shs_setup_status');
    try {
      return saved ? JSON.parse(saved) : { provider_config_set: false, rate_set: false, region_set: false };
    } catch (e) {
      return { provider_config_set: false, rate_set: false, region_set: false };
    }
  };

  useEffect(() => {
    const status = getStoredSetupStatus();
    if (!status.provider_config_set || !status.rate_set || !status.region_set) {
      router.push('/setup');
    }
  }, []);

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors">
        <Breadcrumbs items={[{ label: 'executive dashboard' }]} />
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none transition-all active:scale-95">
            <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Live Sync
          </Button>
          <Button className="rounded-xl h-10 px-6 font-bold shadow-sm dark:shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest">
            <Zap className="h-4 w-4 mr-2" /> Quick Action
          </Button>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10">
        <div className="max-w-[1920px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

          {/* --- [A. Stats Cards] --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Financial Total", value: "₱ 124,500", icon: Wallet, color: "text-primary", bg: "bg-primary/10", trend: "+12%" },
              { label: "Active Devices", value: "842 Units", icon: Cpu, color: "text-green-500", bg: "bg-green-500/10", trend: "+5%" },
              { label: "Registered Users", value: "1,240 Users", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+8%" },
              { label: "Security Level", value: "Admin Access", icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-500/10", trend: "Stable" },
            ].map((stat, i) => (
              <Card
                key={i}
                className="bg-white dark:bg-slate-900/60 border-none p-6 rounded-2xl transition-all duration-300 cursor-default
                  shadow-sm dark:shadow-none hover:-translate-y-1 group relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className={cn("p-4 rounded-xl transition-transform duration-300 group-hover:scale-110", stat.bg, stat.color)}>
                    <stat.icon size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                    <TrendingUp size={12} /> {stat.trend}
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                  <h3 className="text-2xl font-black italic text-slate-900 dark:text-slate-100 mt-1 tracking-tighter">{stat.value}</h3>
                </div>
              </Card>
            ))}
          </div>

          {/* --- [B. Charts Grid] --- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left: Financial Trend */}
            <Card className="lg:col-span-8 bg-slate-900 dark:bg-slate-900/60 rounded-2xl p-10 h-[580px] border-none shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tight text-white dark:text-slate-100">Financial Audit</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time revenue stream analysis</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                    <BarChart3 size={24} />
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.65 0.25 300)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="oklch(0.65 0.25 300)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900, letterSpacing: '0.1em' }} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: 900 }}
                      itemStyle={{ color: 'oklch(0.65 0.25 300)' }}
                      cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="oklch(0.65 0.25 300)" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Right: Device Status & Config */}
            <div className="lg:col-span-4 space-y-8">
              <Card className="bg-white dark:bg-slate-900/60 border-none rounded-2xl p-8 h-[400px] shadow-sm flex flex-col hover:shadow-md transition-all duration-500">
                 <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic">Network Health</h4>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-slate-400">Live</span>
                    </div>
                 </div>
                 <div className="flex-1 w-full min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceDistData}
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {deviceDistData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '10px', fontWeight: 900 }} />
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                    {deviceDistData.map((d, i) => (
                      <div key={i} className="text-center">
                        <div className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter truncate">{d.name}</div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-100 italic tracking-tighter">{d.value}</div>
                      </div>
                    ))}
                 </div>
              </Card>

              {/* Quick Config Link / Style consistency */}
              <Card className="bg-primary rounded-2xl p-8 flex flex-col justify-between h-[152px] border-none shadow-lg shadow-primary/20 group cursor-pointer transition-all hover:scale-[1.02]">
                <div className="flex justify-between items-start">
                    <h2 className="text-white text-xl font-black italic uppercase leading-none tracking-tight">System<br/>Calibration</h2>
                    <Zap className="text-white/50 group-hover:text-white transition-colors" />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Adjust Network Parameters</span>
                    <ArrowUpRight className="text-white" size={20} />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
