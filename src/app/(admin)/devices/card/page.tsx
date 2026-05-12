'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, ChevronRight, Loader2, 
  Construction, Package, CheckCircle2, 
  AlertTriangle, MapPin, Trash2, FileDown
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import Breadcrumbs from '@/components/Breadcrumbs'; // 根据你的实际路径修改

/**
 * STATUS_MAP: 基于业务状态的视觉映射
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

interface CardRecord {
  id: number;
  card_number: string;
  card_uuid: string;
  status: number;
  customer_name?: string;
  customer_uuid?: string;
  city_name?: string;
  town_name?: string;
  created_at: string;
  bound_at?: string;
}

export default function CardsPage() {
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false); // 新增导出状态
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDevModal, setShowDevModal] = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/card/');
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setCards(data);
    } catch (err) {
      toast.error("ASSET SYNC ERROR: Registry access denied.");
    } finally {
      setLoading(false);
    }
  };

  // --- 导出 Excel 函数 ---
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/card/export', {
        params: { 
          status: statusFilter === 'all' ? undefined : statusFilter,
          query: searchQuery || undefined 
        },
        responseType: 'blob', 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Card_Registry_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export successful");
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => { fetchCards(); }, []);

  const filteredCards = cards.filter(c => {
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch = c.card_number.toLowerCase().includes(searchStr) || c.card_uuid.toLowerCase().includes(searchStr);
    const matchesStatus = statusFilter === 'all' || c.status.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="py-8 px-6 md:px-[60px] max-w-[1920px] mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* 1. Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'IC Card' } 
        ]}
      />


      {/* 2. Control Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-4 rounded-[32px]">
        <div className="flex items-center gap-6 flex-nowrap">
          {/* Search Box */}
          <div className="relative w-full lg:w-[480px] group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="SEARCH ASSET BY SN / UUID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 h-[64px] bg-transparent border-b-2 border-slate-900 text-[11px] font-black uppercase tracking-[0.2em] outline-none transition-all text-slate-950 placeholder:text-slate-300"
            />
          </div>

          <div className="h-8 w-px bg-slate-100 hidden sm:block" />

          {/* Status Selector */}
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

        {/* 核心动作按钮 */}
        <div className="flex items-center gap-4 h-[64px]">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              "flex items-center justify-center w-16 h-full rounded-2xl border-2 border-slate-100 text-slate-400 transition-all active:scale-95",
              isExporting ? "opacity-50" : "hover:text-slate-900 hover:border-slate-900"
            )}
          >
            {isExporting ? <Loader2 className="animate-spin" size={22} /> : <FileDown size={22} />}
          </button>
          <Link href="/devices/card/create" passHref>
                <button className="rounded-2xl h-12 px-8 font-bold shadow-lg transition-all active:scale-95">
                    + New Card
                </button>
            </Link>
        </div>
      </div>

      {/* 3. Main Registry Table */}
      {loading ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-yellow-400" size={40} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Scanning RFID Registry...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 px-8 leading-none text-center w-20">Type</th>
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 px-8 leading-none">Physical Identity</th>
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 leading-none">Ownership / Customer</th>
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 leading-none text-center">Protocol Dates</th>
                <th className="text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 pr-12 leading-none">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-900">
              {filteredCards.map((card) => (
                <tr key={card.id} className="group hover:bg-slate-50/30 transition-all">
                  <td className="py-7 px-8 text-center">
                    <div className={cn("inline-flex p-3 rounded-xl border border-slate-100", STATUS_MAP[card.status]?.color)}>
                      {STATUS_MAP[card.status]?.icon}
                    </div>
                  </td>
                  <td className="px-8">
                    <div className="flex flex-col">
                      <span className="font-black uppercase italic tracking-tighter text-base leading-tight">SN: {card.card_number}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 font-mono">UUID: {card.card_uuid}</span>
                    </div>
                  </td>
                  <td className="px-8">
                    {card.customer_name ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
                           <CheckCircle2 size={12} className="text-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]" /> {card.customer_name}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold tracking-widest uppercase italic">
                           <MapPin size={10} /> {card.city_name} / {card.town_name}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest italic border border-slate-50 px-3 py-1 rounded-lg">Available in Stock</span>
                    )}
                  </td>
                  <td className="px-8 text-center">
                    <div className="inline-flex flex-col gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 italic leading-none">
                      <div className="flex items-center gap-2">IN: {card.created_at?.split('T')[0]}</div>
                      {card.bound_at && <div className="flex items-center gap-2 text-yellow-600 font-bold underline underline-offset-2">OUT: {card.bound_at.split('T')[0]}</div>}
                    </div>
                  </td>
                  <td className="py-7 px-8 pr-12 text-right">
                    <button onClick={() => toast.info("PROTOCAL: Edit function locked.")} className="w-10 h-10 rounded-xl border border-slate-100 inline-flex items-center justify-center text-slate-300 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90">
                      <Plus className="rotate-45" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCards.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Package size={48} strokeWidth={1} />
                      <span className="text-[11px] font-black uppercase tracking-[0.4em]">No Inventory Matched</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Dev Modal --- */}
      <Dialog open={showDevModal} onOpenChange={setShowDevModal}>
        <DialogContent className="max-w-[400px] rounded-2xl border-none bg-white p-0 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="h-2 bg-yellow-400" />
          <div className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-900 ring-8 ring-slate-50/50">
              <Construction size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">LOGISTICS LOCKED</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Asset entry is restricted during <br/>automated batch synchronization.</p>
            </div>
            <button onClick={() => setShowDevModal(false)} className="w-full h-14 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-yellow-400 hover:text-slate-900 transition-all shadow-xl">Confirm Registry Integrity</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}