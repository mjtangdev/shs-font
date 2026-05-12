'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, Edit3, ArrowLeft, Clock, User, 
  TrendingUp, Calculator, CalendarDays, ShieldCheck, Landmark 
} from 'lucide-react';
import Link from 'next/link';
import { 
  Dialog, DialogContent, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import apiClient from '@/lib/axios'; 

import Breadcrumbs from "@/components/Breadcrumbs"

export default function RatesPage() {
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [dailyRate, setDailyRate] = useState(""); 
  const [currentDisplayRate, setCurrentDisplayRate] = useState("0.00");
  const [lastUpdate, setLastUpdate] = useState("---");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const renderRoleBadge = (role: number) => {
    if (role === 1) {
      return (
        <div className="flex items-center gap-1.5 text-xs bg-slate-900 text-white px-2.5 py-1 rounded-md font-bold uppercase tracking-tighter w-fit">
          <ShieldCheck size={13} /> Admin
        </div>
      );
    }
    if (role === 2) {
      return (
        <div className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-2.5 py-1 rounded-md font-bold uppercase tracking-tighter w-fit">
          <Landmark size={13} /> Finance
        </div>
      );
    }
    return <span className="text-sm text-slate-400 font-bold uppercase italic">Staff</span>;
  };

  const fetchRateData = useCallback(async () => {
    try {
      const [currentRes, historyRes] = await Promise.all([
        apiClient.get('/rates/daily/current'),
        apiClient.get('/rates/daily')
      ]);
      if (currentRes.data) {
        const data = currentRes.data;
        const rate = data.daily_rate !== undefined ? data.daily_rate.toString() : "0.00";
        setCurrentDisplayRate(parseFloat(rate).toFixed(2));
        setDailyRate(rate);
        setLastUpdate(data.updated_at || "---");
      }
      if (historyRes.data) {
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, []);

  useEffect(() => { fetchRateData(); }, [fetchRateData]);

  const handleRateSubmit = async () => {
    const rateValue = parseFloat(dailyRate);
    if (!dailyRate || isNaN(rateValue) || rateValue <= 0) return toast.error("Invalid amount");
    setLoading(true);
    try {
      await apiClient.post('/rates/daily/update', null, { params: { new_rate: rateValue } });
      toast.success("Daily rate updated successfully");
      setShowRateDialog(false);
      fetchRateData();
    } catch (err: any) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 px-4 md:px-[50px] max-w-[1920px] mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <Breadcrumbs 
          items={[
            { label: 'Rates' } 
          ]}

        />
        <button 
          onClick={() => setShowRateDialog(true)}
          className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-sm hover:bg-yellow-400 hover:text-slate-900 transition-all active:scale-95 shadow-2xl shadow-slate-200 uppercase"
        >
          Update Daily Rate
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        
        {/* 左侧：3/12 占比 */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 rounded-[3.5rem] p-8 text-white relative overflow-hidden shadow-2xl h-full flex flex-col justify-between border border-white/5">
            <CalendarDays className="absolute -right-12 -bottom-12 text-white/[0.03] w-56 h-56" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-yellow-400 text-slate-900 rounded-3xl flex items-center justify-center mb-10 shadow-xl shadow-yellow-400/20">
                <CalendarDays size={32} />
              </div>
              <h3 className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[11px] mb-3">Active Rate</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black italic tracking-tighter tabular-nums">{currentDisplayRate}</span>
                <span className="text-yellow-400 font-black text-base italic">PHP/D</span>
              </div>

              <div className="mt-14 pt-10 border-t border-white/5 space-y-6">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Live Status</p>
                  <div className="flex items-center gap-2.5 text-emerald-400 font-black text-xs uppercase tracking-widest">
                    <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                    System Active
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Last Modified</p>
                  <span className="text-xs font-bold font-mono text-slate-300">{lastUpdate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：9/12 占比 */}
        <div className="lg:col-span-9">
          <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-slate-50 rounded-2xl text-slate-400"><History size={20} /></div>
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 italic">Modification History</h3>
            </div>

            <div className="flex-1 overflow-auto">
              <Table className="border-none">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="py-6 font-black uppercase text-xs tracking-[0.15em] text-slate-400">Rate Value</TableHead>
                    <TableHead className="py-6 font-black uppercase text-xs tracking-[0.15em] text-slate-400">Modified By</TableHead>
                    <TableHead className="py-6 font-black uppercase text-xs tracking-[0.15em] text-slate-400">Access Role</TableHead>
                    <TableHead className="py-6 text-right font-black uppercase text-xs tracking-[0.15em] text-slate-400">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length > 0 ? history.map((item) => (
                    <TableRow key={item.id} className="border-none even:bg-slate-50/70 hover:bg-yellow-50/50 transition-all group">
                      <TableCell className="py-7 border-none">
                        <div className="flex items-center gap-3 text-slate-900 font-black italic tracking-tighter text-xl">
                          <TrendingUp size={16} className="text-slate-300 group-hover:text-yellow-500 transition-colors" />
                          {parseFloat(item.daily_rate).toFixed(2)}
                          <span className="text-[10px] font-bold text-slate-400 not-italic uppercase tracking-widest ml-1">PHP</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-7 border-none">
                        <div className="flex items-center gap-2.5 text-slate-900 font-black text-sm uppercase">
                          <User size={14} className="text-slate-300" />
                          {item.modifier_name}
                        </div>
                      </TableCell>
                      <TableCell className="py-7 border-none">{renderRoleBadge(item.modifier_role)}</TableCell>
                      <TableCell className="py-7 text-right border-none">
                        {/* 修正点：日期改为黑色 text-slate-900，字号提升到 text-sm */}
                        <div className="flex items-center justify-end gap-2.5 text-slate-900 font-mono text-sm font-bold">
                          <Clock size={14} className="text-slate-300" />
                          {item.updated_at}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow className="border-none">
                      <TableCell colSpan={4} className="h-72 text-center border-none">
                        <div className="flex flex-col items-center justify-center text-slate-300 gap-3 opacity-40">
                          <History size={48} strokeWidth={1} />
                          <p className="font-black uppercase tracking-widest text-sm">No Audit Logs Found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Accessible Dialog */}
      <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[3.5rem] bg-white shadow-2xl">
          <div className="sr-only">
            <DialogTitle>Update System Rate</DialogTitle>
            <DialogDescription>Change global daily rate.</DialogDescription>
          </div>
          <div className="p-12 pb-0 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-yellow-50 rounded-3xl flex items-center justify-center mb-8">
              <Calculator className="text-yellow-500" size={36} />
            </div>
            <h2 className="text-slate-900 text-3xl font-black italic uppercase tracking-tight">Update Rate</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Set Global Standard Daily Rate</p>
          </div>
          <div className="p-12 space-y-10">
            <input 
              type="number" step="0.01" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} 
              className="w-full text-center py-12 bg-slate-50 border-none rounded-[2rem] outline-none font-black text-7xl text-slate-900 focus:ring-8 ring-yellow-400/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            />
            <button 
              onClick={handleRateSubmit} disabled={loading}
              className="w-full bg-slate-900 text-white py-8 rounded-[2rem] font-black text-xl uppercase tracking-widest hover:bg-yellow-400 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-200"
            >
              {loading ? "PROCESSING..." : "CONFIRM UPDATE"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}