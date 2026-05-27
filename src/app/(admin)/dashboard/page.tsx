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
import { ScrollArea } from "@/components/ui/scroll-area";
import Breadcrumbs from '@/components/Breadcrumbs';
import { cn } from "@/lib/utils";
import apiClient from "@/lib/axios";
import { toast } from "sonner";

const COLORS = ['#facc15', '#10b981', '#f43f5e']; // 黄, 绿, 红 (电力黄配色)

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    financial: {
      total: 0,
      today: 0,
      growth: 0,
      currency: "₱",
      trend: [] as any[],
      region_ranking: [] as any[]
    },
    devices: {
      total: 0,
      growth: 0,
      distribution: [
        { name: 'Active', value: 0 },
        { name: 'In Stock', value: 0 },
        { name: 'Damaged', value: 0 },
      ]
    },
    users: { total: 0, growth: 0 }
  });

  const getStoredSetupStatus = () => {
    if (typeof window === 'undefined') return { provider_config_set: true, rate_set: true, region_set: true };
    const saved = localStorage.getItem('shs_setup_status');
    try {
      return saved ? JSON.parse(saved) : { provider_config_set: false, rate_set: false, region_set: false };
    } catch (e) {
      return { provider_config_set: false, rate_set: false, region_set: false };
    }
  };

  const fetchStats = async () => {
    console.log("🚀 [Dashboard] fetchStats started...");
    setLoading(true);
    try {
      const res = await apiClient.get("/dashboard/stats");
      console.log("✅ [Dashboard] Stats Received:", res.data);
      if (res.data) {
        setStats(res.data);

        // 如果拉到了真实数据，自动补全本地初始化标记，避免重复重定向
        if (res.data.users.total > 0) {
          localStorage.setItem('shs_setup_status', JSON.stringify({
            provider_config_set: true,
            rate_set: true,
            region_set: true
          }));
          localStorage.setItem('setup_completed', 'true');
          // 同时设置 cookie 以便中间件识别
          document.cookie = "shs_setup_status=completed; path=/; max-age=31536000";
        }
      }
    } catch (err: any) {
      console.error("❌ [Dashboard] Fetch Error:", err.message);
      toast.error("Failed to sync dashboard data");
    } finally {
      setLoading(false);
      console.log("🏁 [Dashboard] fetchStats finished.");
    }
  };

  useEffect(() => {
    console.log("🖥️ [Dashboard] Component Mounted");

    // 1. 先尝试获取数据，不再直接重定向
    fetchStats();

    // 2. 检查本地状态，如果接口拉取失败或确实为空，才考虑重定向
    const status = getStoredSetupStatus();
    if (!status.provider_config_set || !status.rate_set || !status.region_set) {
       console.info("ℹ️ [Dashboard] Local setup flag missing. Waiting for API response...");
    }
  }, [router]);

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors">
        <Breadcrumbs items={[{ label: 'executive dashboard' }]} />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchStats}
            disabled={loading}
            className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none transition-all active:scale-95"
          >
            <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Live Sync
          </Button>
          <Button className="rounded-xl h-10 px-6 font-bold shadow-sm dark:shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest">
            <Zap className="h-4 w-4 mr-2" /> Load
          </Button>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10">
        <div className="max-w-[1920px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

          {/* --- [A. Stats Cards] --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Today's Revenue",
                value: `${stats.financial.currency} ${stats.financial.today.toLocaleString()}`,
                icon: Wallet,
                color: "text-primary",
                bg: "bg-primary/10",
                trend: `${stats.financial.growth > 0 ? '+' : ''}${stats.financial.growth}%`
              },
              {
                label: "Active Devices",
                value: `${stats.devices.total} Units`,
                icon: Cpu,
                color: "text-green-500",
                bg: "bg-green-500/10",
                trend: `${stats.devices.growth > 0 ? '+' : ''}${stats.devices.growth}%`
              },
              {
                label: "Registered Users",
                value: `${stats.users.total} Users`,
                icon: Users,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                trend: `${stats.users.growth > 0 ? '+' : ''}${stats.users.growth}%`
              },
              {
                label: "All-time Revenue",
                value: `${stats.financial.currency} ${stats.financial.total.toLocaleString()}`,
                icon: ShieldCheck,
                color: "text-primary",
                bg: "bg-primary/10",
                trend: "Cumulative"
              },
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
            <Card className="lg:col-span-8 bg-slate-900 dark:bg-slate-900/60 rounded-2xl p-8 h-[580px] border-none shadow-sm relative overflow-hidden group flex flex-col">
              <div className="flex justify-between items-start mb-6 relative z-10 shrink-0">
                <div>
                  <h2 className="text-xl font-black italic uppercase tracking-tight text-white dark:text-slate-100">Financial Audit</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time revenue stream analysis</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                    <BarChart3 size={20} />
                </div>
              </div>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.financial.trend}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900, letterSpacing: '0.1em' }} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: 900 }}
                      itemStyle={{ color: '#facc15' }}
                      cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#facc15" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Right: Device Status & Regions */}
            <div className="lg:col-span-4 flex flex-col gap-6 h-[580px]">
              <Card className="bg-white dark:bg-slate-900/60 border-none rounded-2xl p-5 h-[280px] shadow-sm flex flex-col hover:shadow-md transition-all duration-500 shrink-0">
                 <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic">Network Health</h4>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-slate-400">Live</span>
                    </div>
                 </div>
                 <div className="flex-1 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={stats.devices.distribution}
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={6}
                          dataKey="value"
                          stroke="none"
                          isAnimationActive={true}
                          animationBegin={0}
                          animationDuration={1000}
                        >
                          {stats.devices.distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', fontSize: '10px', fontWeight: 900, border: 'none', backgroundColor: '#0f172a', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="grid grid-cols-3 gap-1 mt-2 pt-4 border-t border-slate-100 dark:border-white/5">
                    {stats.devices.distribution.map((d, i) => (
                      <div key={i} className="text-center min-w-0">
                        <div className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter truncate mb-0.5">
                          {d.name}
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-slate-100 italic tracking-tighter tabular-nums truncate">
                          {d.value.toLocaleString()}
                        </div>
                      </div>
                    ))}
                 </div>
              </Card>

              {/* --- [Top Performing Regions] --- */}
              <Card className="bg-white dark:bg-slate-900/60 border-none rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-md transition-all duration-500 flex-1 min-h-0 overflow-hidden">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic">Top Regions by Revenue</h4>
                  <TrendingUp size={14} className="text-primary" />
                </div>
                <ScrollArea className="flex-1 -mx-2 px-2">
                  <div className="space-y-3 pb-2">
                    {stats.financial.region_ranking.length > 0 ? (
                      stats.financial.region_ranking.map((region: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 group hover:bg-primary transition-all duration-300">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-900 dark:text-slate-100 group-hover:text-white transition-colors">{region.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 group-hover:text-white/70 transition-colors">{region.customers} Customers</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black italic text-primary group-hover:text-white transition-colors">₱{region.revenue.toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center text-[10px] font-black uppercase text-slate-300 tracking-widest italic">
                        No Regional Data Yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
