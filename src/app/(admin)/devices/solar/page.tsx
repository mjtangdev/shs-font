'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, ChevronRight, Loader2, 
  Package, CheckCircle2, 
  AlertTriangle, MapPin, FileDown,
  Zap, Lock, Unlock, Building2, Cpu,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<number, { label: string, color: string, activeColor: string, icon: React.ReactNode }> = {
  0: { 
    label: 'IN STOCK', 
    color: 'text-slate-400 border-transparent hover:text-slate-900', 
    activeColor: 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-200',
    icon: <Package size={12} /> 
  },
  1: { 
    label: 'ACTIVATED', 
    color: 'text-slate-400 border-transparent hover:text-yellow-600', 
    activeColor: 'bg-[#FFD700] text-slate-900 border-[#FFD700] shadow-md shadow-yellow-100',
    icon: <CheckCircle2 size={12} /> 
  },
  3: { 
    label: 'DAMAGED', 
    color: 'text-slate-400 border-transparent hover:text-red-600', 
    activeColor: 'bg-red-500 text-white border-red-500 shadow-md shadow-red-100',
    icon: <AlertTriangle size={12} /> 
  }
};

interface SolarDeviceRecord {
  id: number;
  shs_machine_id: string;
  solar_equipment_id: string;
  radio_id: string;
  flashlight_id: string;
  led_light_id: string;
  status: number;
  customer_name: string;
  city_name: string;
  town_name: string;
  production_date: string;
}

export default function SolarUnitPage() {
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [units, setUnits] = useState<SolarDeviceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/solar_device/');
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setUnits(data);
    } catch (err) {
      toast.error("系统同步错误：无法访问 SHS 注册表");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/solar_device/export', {
        params: { status: statusFilter === 'all' ? undefined : statusFilter, query: searchQuery || undefined },
        responseType: 'blob', 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SHS_Registry_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("导出成功");
    } catch (err) {
      toast.error("导出失败");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDevAlert = () => {
    toast.info("功能正在开发中", {
      description: "该模块正在调试校准中，请等待后续版本更新。",
      className: "font-bold text-[12px] tracking-tight",
    });
  };

  useEffect(() => { fetchUnits(); }, []);

  const filteredUnits = units.filter(u => {
    const searchStr = searchQuery.toLowerCase();
    return (
      (u.shs_machine_id?.toLowerCase() || "").includes(searchStr) || 
      (u.customer_name?.toLowerCase() || "").includes(searchStr)
    ) && (statusFilter === 'all' || u.status.toString() === statusFilter);
  });

  return (
    <div className="py-8 px-6 md:px-[60px] max-w-[1920px] mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-3 text-slate-400">
        <Link href="/dashboard" className="flex items-center gap-2 hover:text-slate-900 transition-colors group">
          <span className="text-[10px] font-black uppercase tracking-widest group-hover:italic">dashboard</span>
        </Link>
        <ChevronRight size={12} className="text-slate-200" />
        <div className="text-slate-900 italic font-black text-[10px] uppercase tracking-widest underline decoration-yellow-400 decoration-2 underline-offset-4 tracking-[0.2em]">Solar Device Registry</div>
      </nav>

      {/* 2. Control Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-4 rounded-[32px]">
        <div className="flex items-center gap-6 flex-nowrap">
          <div className="relative w-full lg:w-[480px] group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="搜索序列号 (SN) 或 客户..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 h-[64px] bg-transparent border-b-2 border-slate-900 text-[11px] font-black uppercase tracking-[0.2em] outline-none transition-all text-slate-950 placeholder:text-slate-300"
            />
          </div>
          <div className="flex items-center h-[64px] gap-1">
            <button onClick={() => setStatusFilter('all')} className={cn("px-8 h-full rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", statusFilter === 'all' ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:text-slate-950")}>ALL</button>
            {[0, 1, 3].map((sId) => (
              <button key={sId} onClick={() => setStatusFilter(sId.toString())} className={cn("flex items-center gap-3 px-6 h-full rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", statusFilter === sId.toString() ? STATUS_MAP[sId].activeColor : "text-slate-400 hover:text-slate-950")}>
                {STATUS_MAP[sId].icon} {STATUS_MAP[sId].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 h-[64px]">
          <button onClick={handleExport} disabled={isExporting} className="w-16 h-full rounded-2xl border-2 border-slate-100 text-slate-400 transition-all hover:border-slate-900 hover:text-slate-900">
            {isExporting ? <Loader2 className="animate-spin" size={22} /> : <FileDown size={22} />}
          </button>
          <Link href="/devices/solar/create">
            <button className="bg-yellow-400 text-slate-900 rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-yellow-100 hover:bg-slate-900 hover:text-white transition-all active:scale-95">
               + New Solar Unit
            </button>
          </Link>
        </div>
      </div>

      {/* 3. Main Table */}
      {loading ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-slate-300 italic"><Loader2 className="animate-spin text-yellow-400" size={40} /><span className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing Registry...</span></div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 px-10">SHS Machine Identity & Components</th>
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 text-center">Deployment</th>
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 text-center">Status</th>
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 text-right">Production</th>
                <th className="text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 pr-12 w-40">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-900">
              {filteredUnits.map((unit) => (
                <tr key={unit.id} className="group hover:bg-slate-50/20 transition-all">
                  <td className="py-8 px-10">
                    <div className="flex items-start gap-6">
                        {/* 状态大图标 */}
                        <div className={cn(
                            "w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 shadow-sm",
                            unit.status === 1 ? "border-yellow-100 bg-yellow-50 text-yellow-600" : "border-slate-100 bg-slate-50 text-slate-300"
                        )}>
                            <Layers size={22} />
                        </div>

                        <div className="flex flex-col space-y-3">
                            {/* 主 ID 卡片样式 */}
                            <div className="bg-slate-900 text-white px-4 py-2 rounded-lg inline-flex flex-col min-w-[200px] shadow-lg shadow-slate-200">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Master Machine ID</span>
                                <span className="font-mono text-base font-black italic tracking-wider">{unit.shs_machine_id}</span>
                            </div>
                            
                            {/* 子设备树状结构 */}
                            <div className="relative pl-2 space-y-2">
                                {[
                                    { label: 'SOLAR PANEL', id: unit.solar_equipment_id },
                                    { label: 'RADIO UNIT', id: unit.radio_id },
                                    { label: 'FLASH TORCH', id: unit.flashlight_id },
                                    { label: 'LED LIGHTS', id: unit.led_light_id }
                                ].map((item, idx, arr) => (
                                    <div key={item.label} className="relative flex items-center gap-3 pl-6 h-5">
                                        {/* Tree Connectors (L-shape) */}
                                        <div className="absolute left-0 top-[-10px] bottom-1/2 w-[2px] bg-slate-100" />
                                        <div className="absolute left-0 top-1/2 w-4 h-[2px] bg-slate-100" />
                                        {idx === arr.length - 1 && <div className="absolute left-0 top-1/2 bottom-0 w-[2px] bg-white" />}
                                        
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest w-20">{item.label}</span>
                                        <span className="text-[10px] font-bold font-mono text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">{item.id}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                  </td>
                  <td className="px-8 text-center">
                    <div className="inline-flex flex-col gap-2 items-center">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase italic">
                         <Building2 size={13} className="text-slate-400" /> 
                         {unit.customer_name === "-" ? <span className="text-slate-200">Unassigned</span> : unit.customer_name}
                      </div>
                      <div className="px-3 py-1 rounded-full bg-slate-50 text-[9px] text-slate-400 font-bold tracking-widest uppercase">
                         {unit.city_name} • {unit.town_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 text-center">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest shadow-sm",
                      unit.status === 1 ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-50 text-slate-400 border-slate-100"
                    )}>
                      {unit.status === 1 ? <Unlock size={12} strokeWidth={3} /> : <Lock size={12} strokeWidth={3} />}
                      {unit.status === 1 ? "Active" : "Locked"}
                    </div>
                  </td>
                  <td className="px-8 text-right font-mono text-[10px] font-black text-slate-400 italic">
                    {unit.production_date?.split('T')[0]}
                  </td>
                  <td className="py-8 px-8 pr-12 text-right">
                    <div className="flex items-center justify-end gap-3">
                        <button onClick={handleDevAlert} className="w-11 h-11 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all active:scale-90"><MapPin size={18} /></button>
                        <button onClick={handleDevAlert} className="w-11 h-11 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all active:scale-90"><Lock size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}