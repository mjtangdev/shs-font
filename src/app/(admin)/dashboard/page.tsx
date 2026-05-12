'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Wallet, Calculator, BarChart3, MapPin, Building2,
  CheckCircle2, ShieldCheck, Users, Cpu, Database
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import apiClient from "@/lib/axios"; 

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

const COLORS = ['#FACC15', '#1e293b', '#94a3b8'];

export default function DashboardPage() {
  const router = useRouter();
  // --- [1. State Management / 状态管理] ---
  const [loading, setLoading] = useState(false);                  

  // 获取当前初始化状态的辅助函数
  const getStoredSetupStatus = () => {
    const saved = localStorage.getItem('shs_setup_status');
    try {
      return saved ? JSON.parse(saved) : { provider_config_set: false, rate_set: false, region_set: false };
    } catch (e) {
      return { provider_config_set: false, rate_set: false, region_set: false };
    }
  };

  // --- [2. Initialization / 初始化逻辑] ---
  useEffect(() => {
    const status = getStoredSetupStatus();
    // 如果任何一个核心配置没设，重定向回 setup 页面
    if (!status.provider_config_set || !status.rate_set || !status.region_set) {
      router.push('/setup');
    }
  }, []);
  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* 全局交互样式恢复 (Global Interaction Styles) */}
      <style jsx global>{`
        button[class*="DialogClose"] { display: none !important; }
        input::-webkit-outer-spin-button, 
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* --- [A. Stats Cards / 核心指标卡片] --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Financial Total", value: "₱ 124,500", icon: Wallet, color: "text-yellow-600", bg: "bg-yellow-50", hbr: "hover:border-yellow-400" },
          { label: "Active Devices", value: "842 Units", icon: Cpu, color: "text-blue-600", bg: "bg-blue-50", hbr: "hover:border-blue-400" },
          { label: "Registered Users", value: "1,240 Users", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", hbr: "hover:border-indigo-400" },
          { label: "Security Level", value: "Admin Access", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50", hbr: "hover:border-emerald-400" },
        ].map((stat, i) => (
          <div 
            key={i} 
            className={`bg-white border border-slate-100 p-7 rounded-3xl transition-all duration-300 cursor-default
              hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-2 ${stat.hbr} group relative overflow-hidden`}
          >
            <div className={`p-4 w-fit rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300 relative z-10`}>
              <stat.icon size={24} />
            </div>
            <div className="mt-6 relative z-10">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* --- [B. Charts Grid / 图表展示区] --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 左侧：财务趋势分析 (Financial Audit) */}
        <div className="lg:col-span-8 bg-slate-900 rounded-[2.5rem] p-10 h-[580px] shadow-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-8 text-white relative z-10">
            <div>
              <h2 className="text-2xl font-bold italic uppercase tracking-tight text-white">Financial Audit</h2>
              <p className="text-slate-500 text-xs mt-1 italic">Real-time revenue stream analysis</p>
            </div>
            <BarChart3 className="text-slate-700 group-hover:text-yellow-500 transition-colors" />
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FACC15" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff' }} 
                  itemStyle={{ color: '#FACC15' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#FACC15" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右侧：设备状态饼图与环境配置 (Device Status & Config) */}
        <div className="lg:col-span-4 space-y-8">
          {/* 优化后的饼图容器 */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 h-[400px] shadow-sm flex flex-col hover:shadow-xl transition-all duration-500">
             <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 italic">Device Status Distribution</h4>
             <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={deviceDistData} 
                      innerRadius={70} 
                      outerRadius={100} 
                      paddingAngle={8} 
                      dataKey="value"
                      animationBegin={200}
                    >
                      {deviceDistData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex justify-around mt-6 pt-6 border-t border-slate-50">
                {deviceDistData.map((d, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{d.name}</div>
                    <div className="text-base font-black text-slate-900">{d.value}</div>
                  </div>
                ))}
             </div>
          </div>

          {/* 环境配置入口 (Quick Config) */}
          <div className="bg-yellow-400 rounded-[2.5rem] p-9 flex flex-col justify-between h-[152px] shadow-lg shadow-yellow-100 group">
            <h2 className="text-slate-900 text-xl font-black italic uppercase leading-none group-hover:tracking-widest transition-all">Config<br/>Environment</h2>
            <div className="flex gap-3 mt-4">

            </div>
          </div>
        </div>
      </div>


    </div>
  );
}