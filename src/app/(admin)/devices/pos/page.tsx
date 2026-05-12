'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, ChevronRight, Loader2, 
  Package, CheckCircle2, 
  AlertTriangle, MapPin, FileDown,
  TabletSmartphone, Lock, Unlock, Building2
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * STATUS_MAP: 顶部切换状态样式定义 - 严格保持原样
 */
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

interface POSRecord {
  id: number;
  pos_sn: string;
  status: number;
  lock_status: number;
  branch_office: string | null;
  region_id: number | null;
  created_at: string;
}

export default function POSPage() {
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [terminals, setTerminals] = useState<POSRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchTerminals = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/pos/');
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setTerminals(data);
    } catch (err) {
      toast.error("系统同步错误：无法访问 POS 注册表");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/pos/export', {
        params: { 
          status: statusFilter === 'all' ? undefined : statusFilter,
          query: searchQuery || undefined 
        },
        responseType: 'blob', 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `POS_Registry_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  useEffect(() => { fetchTerminals(); }, []);

  const filteredTerminals = terminals.filter(t => {
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch = t.pos_sn.toLowerCase().includes(searchStr);
    const matchesStatus = statusFilter === 'all' || t.status.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="py-8 px-6 md:px-[60px] max-w-[1920px] mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-3 text-slate-400">
        <Link href="/dashboard" className="flex items-center gap-2 hover:text-slate-900 transition-colors group">
          <span className="text-[10px] font-black uppercase tracking-widest group-hover:italic">dashboard</span>
        </Link>
        <ChevronRight size={12} className="text-slate-200" />
        <div className="text-slate-900 italic font-black text-[10px] uppercase tracking-widest underline decoration-yellow-400 decoration-2 underline-offset-4 tracking-[0.2em]">POS Assets Registry</div>
      </nav>

      {/* 2. Control Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-4 rounded-[32px]">
        <div className="flex items-center gap-6 flex-nowrap">
          <div className="relative w-full lg:w-[480px] group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="搜索终端序列号 (SN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 h-[64px] bg-transparent border-b-2 border-slate-900 text-[11px] font-black uppercase tracking-[0.2em] outline-none transition-all text-slate-950 placeholder:text-slate-300"
            />
          </div>

          <div className="h-8 w-px bg-slate-100 hidden sm:block" />

          <div className="flex items-center h-[64px] gap-1">
            <button 
              onClick={() => setStatusFilter('all')}
              className={cn(
                "px-8 h-full rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                statusFilter === 'all' ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:text-slate-950 hover:bg-slate-50"
              )}
            >
              ALL
            </button>
            {[0, 1, 3].map((sId) => (
              <button 
                key={sId}
                onClick={() => setStatusFilter(sId.toString())}
                className={cn(
                  "flex items-center gap-3 px-6 h-full rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                  statusFilter === sId.toString() ? STATUS_MAP[sId].activeColor : "text-slate-400 hover:text-slate-950 hover:bg-slate-50"
                )}
              >
                {STATUS_MAP[sId].icon}
                {STATUS_MAP[sId].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 h-[64px]">
          <button 
            onClick={handleExport} 
            disabled={isExporting}
            className={cn(
              "flex items-center justify-center w-16 h-full rounded-2xl border-2 border-slate-100 text-slate-400 transition-all active:scale-95",
              isExporting ? "opacity-50 cursor-not-allowed" : "hover:text-slate-900 hover:border-slate-900"
            )}
          >
            {isExporting ? <Loader2 className="animate-spin" size={22} /> : <FileDown size={22} />}
          </button>
          
          <Link href="/devices/pos/create">
            <button className="bg-yellow-400 text-slate-900 rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-yellow-100 hover:bg-slate-900 hover:text-white transition-all active:scale-95">
               + New Terminal
            </button>
          </Link>
        </div>
      </div>

      {/* 3. Main Table */}
      {loading ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-slate-300">
          <Loader2 className="animate-spin text-yellow-400" size={40} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing Registry...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 px-10 leading-none">Terminal Identity</th>
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 leading-none text-center">Location & Branch</th>
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 leading-none text-center">Security Status</th>
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 leading-none text-right">Audit Date</th>
                <th className="text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 pr-12 leading-none w-40">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-900">
              {filteredTerminals.map((pos) => (
                <tr key={pos.id} className="group hover:bg-slate-50/30 transition-all">
                  <td className="py-7 px-10">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-10 h-10 rounded-xl border flex items-center justify-center transition-all",
                            pos.status === 1 ? "border-yellow-200 bg-yellow-50 text-yellow-600" : "border-slate-100 bg-slate-50 text-slate-400"
                        )}>
                            <TabletSmartphone size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black uppercase italic tracking-tighter text-base leading-tight">SN: {pos.pos_sn}</span>
                            <span className={cn("text-[8px] font-bold uppercase tracking-widest mt-1", pos.status === 1 ? "text-yellow-600 font-black" : "text-slate-400")}>
                                {pos.status === 1 ? '• SYSTEM ACTIVE' : '• STANDBY STOCK'}
                            </span>
                        </div>
                    </div>
                  </td>
                  <td className="px-8 text-center">
                    <div className="inline-flex flex-col gap-1.5 items-center text-slate-900">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
                         <Building2 size={12} className="text-slate-400" /> 
                         {pos.branch_office || <span className="text-slate-200 italic">Unassigned</span>}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold tracking-widest uppercase italic leading-none">
                         <MapPin size={10} className="text-slate-300" /> 
                         Region: {pos.region_id || 'Global'}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 text-center">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.1em]",
                      pos.lock_status === 0 ? "bg-green-50 text-green-600 border-green-100 shadow-sm" : "bg-red-50 text-red-600 border-red-100 shadow-sm"
                    )}>
                      {pos.lock_status === 0 ? <Unlock size={10} strokeWidth={3} /> : <Lock size={10} strokeWidth={3} />}
                      {pos.lock_status === 0 ? "Unlocked" : "Locked"}
                    </div>
                  </td>
                  <td className="px-8 text-right font-mono text-[10px] font-black text-slate-400 tracking-tighter uppercase italic">
                    {pos.created_at?.split('T')[0]}
                  </td>
                  <td className="py-7 px-8 pr-12 text-right">
                    <div className="flex items-center justify-end gap-3">
                        <button 
                            onClick={handleDevAlert}
                            className="w-10 h-10 rounded-xl border border-slate-100 inline-flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
                        >
                            <MapPin size={16} />
                        </button>
                        <button 
                            onClick={handleDevAlert}
                            className="w-10 h-10 rounded-xl border border-slate-100 inline-flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
                        >
                            {pos.lock_status === 0 ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
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