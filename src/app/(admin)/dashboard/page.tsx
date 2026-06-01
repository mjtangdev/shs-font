'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Wallet, BarChart3, ShieldCheck, Users, Cpu,
  RefreshCcw, TrendingUp, ArrowUpRight, Zap, List, MapPin, ChevronDown, ExternalLink, Loader2, Globe
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Breadcrumbs from '@/components/Breadcrumbs';
import { cn } from "@/lib/utils";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// --- [数字滚动组件] ---
function AnimatedNumber({ value, prefix = "" }: { value: string | number, prefix?: string }) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <motion.span
      key={displayValue}
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="inline-block"
    >
      {prefix}{displayValue}
    </motion.span>
  );
}

const COLORS = ['#facc15', '#10b981', '#f43f5e']; // 黄, 绿, 红 (电力黄配色)

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); // 局部同步状态
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('table');
  const [txLoading, setTxLoading] = useState(false);
  const [todayTransactions, setTodayTransactions] = useState<any[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [regions, setRegions] = useState<any[]>([]);

  const [stats, setStats] = useState({
    financial: {
      total: 0,
      today: 0,
      growth: 0,
      currency: "₱",
      trend: [] as any[],
      region_ranking: [] as any[]
    },
    loads: {
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

  const fetchStats = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsSyncing(true);

    try {
      const res = await apiClient.get("/dashboard/stats");
      if (res.data) {
        setStats(res.data);
        if (res.data.users.total > 0) {
          localStorage.setItem('shs_setup_status', JSON.stringify({
            provider_config_set: true,
            rate_set: true,
            region_set: true
          }));
          localStorage.setItem('setup_completed', 'true');
          document.cookie = "shs_setup_status=completed; path=/; max-age=31536000";
        }
      }
    } catch (err: any) {
      if (!isSilent) toast.error("Failed to sync dashboard data");
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const fetchTodayTransactions = async (isSilent = false) => {
    if (!isSilent) setTxLoading(true);
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const res = await apiClient.get("/finance/transactions", {
        params: {
          start_date: today,
          end_date: today,
          region_id: selectedRegionId || undefined,
          limit: 100
        }
      });
      setTodayTransactions(res.data.items || []);
    } catch (err) {
      console.error("❌ [Dashboard] Fetch Transactions Error:", err);
    } finally {
      setTxLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const res = await apiClient.get('/org/regions/tree');
      const data = res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];

      const flattened: any[] = [];
      const flatten = (nodes: any[], depth: number = 0) => {
        nodes.forEach(n => {
          flattened.push({ id: n.id, name: n.name, level: depth });
          if (n.children) flatten(n.children, depth + 1);
        });
      };
      flatten(data);
      setRegions(flattened);
    } catch (err) {
      console.error("Failed to fetch regions", err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRegions();

    // 每 30 秒静默刷新一次全局统计
    const statsTimer = setInterval(() => fetchStats(true), 30000);
    return () => clearInterval(statsTimer);
  }, [router]);

  useEffect(() => {
    fetchTodayTransactions();

    // 只有在列表模式下才自动刷新明细表 (1 分钟一刷，避免干扰操作)
    const txTimer = setInterval(() => {
        if (viewMode === 'table') fetchTodayTransactions(true);
    }, 60000);

    return () => clearInterval(txTimer);
  }, [viewMode, selectedRegionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full bg-slate-50 dark:bg-slate-950 transition-colors">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Synchronizing Live Feed...</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">
      
      {/* Live Sync Status - Floating */}
      <div className={cn(
        "fixed top-24 right-10 z-50 px-3 py-1.5 rounded-lg bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-100 dark:border-white/5 flex items-center gap-2 transition-all duration-500",
        isSyncing ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      )}>
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Live Syncing...</span>
      </div>

      {/* 1. Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10">
        <div className="max-w-[1920px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

          {/* --- [A. Stats Cards] --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Today's Revenue",
                value: stats.financial.today,
                prefix: stats.financial.currency + " ",
                icon: Wallet,
                color: "text-primary",
                bg: "bg-primary/10",
                trend: `${stats.financial.growth > 0 ? '+' : ''}${stats.financial.growth}%`
              },
              {
                label: "Today's Loads",
                value: stats.loads.total,
                icon: Zap,
                color: "text-green-500",
                bg: "bg-green-500/10",
                trend: `${stats.loads.growth > 0 ? '+' : ''}${stats.loads.growth}%`
              },
              {
                label: "Registered Users",
                value: stats.users.total,
                icon: Users,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                trend: `${stats.users.growth > 0 ? '+' : ''}${stats.users.growth}%`
              },
              {
                label: "All-time Revenue",
                value: stats.financial.total,
                prefix: stats.financial.currency + " ",
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
                  <h3 className="text-2xl font-black italic text-slate-900 dark:text-slate-100 mt-1 tracking-tighter">
                    <AnimatedNumber value={stat.value} prefix={stat.prefix} />
                  </h3>
                </div>
              </Card>
            ))}
          </div>
          {/* --- [B. Charts Grid] --- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left: Financial Trend / Today's Recharges */}
            <Card className="lg:col-span-8 bg-white dark:bg-slate-900/60 rounded-2xl p-8 h-[580px] border border-slate-100 dark:border-none shadow-sm relative overflow-hidden group flex flex-col transition-all duration-500">
              <div className="flex justify-between items-start mb-6 relative z-20 shrink-0">
                <div>
                  <h2 className="text-xl font-black italic uppercase tracking-tight text-slate-900 dark:text-slate-100">
                    {viewMode === 'chart' ? "Financial Audit" : "Today's Activity"}
                  </h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {viewMode === 'chart' ? "Real-time revenue stream analysis" : "Daily transaction ledger overview"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {viewMode === 'table' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10">
                          <MapPin size={12} className="mr-2 text-primary" />
                          {selectedRegionId ? regions.find(r => r.id === selectedRegionId)?.name : "All Regions"}
                          <ChevronDown size={12} className="ml-2 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white max-h-96 overflow-y-auto no-scrollbar shadow-2xl">
                        <DropdownMenuItem onClick={() => setSelectedRegionId(null)} className="text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer py-3 border-b border-slate-100 dark:border-white/5">
                          <Globe size={14} className="mr-2 text-primary" /> Global View (Clear Filter)
                        </DropdownMenuItem>
                        {regions.map(r => (
                          <DropdownMenuItem
                            key={r.id}
                            onClick={() => setSelectedRegionId(r.id)}
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer py-2.5",
                              r.level === 0 && "text-primary border-t border-slate-100 dark:border-white/5 mt-1 pt-3",
                              r.level === 1 && "text-slate-600 dark:text-slate-200",
                              r.level > 1 && "text-slate-400 dark:text-slate-400"
                            )}
                            style={{ paddingLeft: `${r.level * 16 + 12}px` }}
                          >
                            <div className={cn(
                              "w-1 h-1 rounded-full mr-2",
                              r.level === 0 ? "bg-primary" : r.level === 1 ? "bg-slate-400" : "bg-slate-600"
                            )} />
                            {r.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-primary hover:bg-slate-100 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5"
                  >
                    {viewMode === 'chart' ? <List size={20} /> : <BarChart3 size={20} />}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => router.push('/finance')}
                    className="h-10 px-4 rounded-xl bg-primary text-slate-950 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                  >
                    More <ExternalLink size={12} className="ml-2" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 w-full min-h-0 relative z-10">
                {viewMode === 'chart' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.financial.trend}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900, letterSpacing: '0.1em' }} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: 900 }}
                        itemStyle={{ color: '#facc15' }}
                        cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#facc15" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-500">
                    <div className="rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden bg-slate-50 dark:bg-slate-950/30 flex-1">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-100 dark:bg-white/5 sticky top-0 z-30">
                            <TableRow className="border-slate-200 dark:border-white/5 hover:bg-transparent">
                              <TableHead className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-6">Customer</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Amount</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Days</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Time</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-slate-500 tracking-widest text-right pr-6">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {txLoading ? (
                              <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                  <Loader2 className="animate-spin text-primary mx-auto h-8 w-8" />
                                </TableCell>
                              </TableRow>
                            ) : todayTransactions.length > 0 ? (
                              todayTransactions.map((tx, idx) => (
                                <TableRow key={idx} className="border-slate-100 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/[0.03] group/row transition-colors">
                                  <TableCell className="pl-6 font-bold text-xs text-slate-900 dark:text-white uppercase tracking-tight italic">
                                    {tx.customer_name}
                                  </TableCell>
                                  <TableCell className="font-black text-primary italic">₱{Number(tx.amount).toLocaleString()}</TableCell>
                                  <TableCell className="text-slate-400 dark:text-slate-400 font-bold text-[10px]">+{tx.days}D</TableCell>
                                  <TableCell className="text-slate-500 dark:text-slate-500 text-[9px] font-mono">{tx.transaction_time?.split('T')[1]?.substring(0, 5) || tx.transaction_time?.split(' ')[1]?.substring(0, 5)}</TableCell>
                                  <TableCell className="text-right pr-6">
                                    <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase">LOAD</Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                  <p className="text-[10px] font-black uppercase text-slate-300 dark:text-slate-600 tracking-[0.3em] italic">No Transactions Recorded Today</p>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  </div>
                )}
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
                          data={stats.loads.distribution}
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={6}
                          dataKey="value"
                          stroke="none"
                          isAnimationActive={true}
                          animationBegin={0}
                          animationDuration={1000}
                        >
                          {stats.loads.distribution.map((entry, index) => (
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
                    {stats.loads.distribution.map((d, i) => (
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
