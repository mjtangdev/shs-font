'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, TrendingUp, Calculator, CalendarDays, ShieldCheck, Landmark,
  RefreshCcw, Clock, User
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import apiClient from '@/lib/axios'; 
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        <div className="flex items-center gap-1.5 text-[8px] bg-slate-900 dark:bg-slate-800 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest w-fit border border-white/5">
          <ShieldCheck size={10} /> Admin
        </div>
      );
    }
    if (role === 2) {
      return (
        <div className="flex items-center gap-1.5 text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-widest w-fit border border-primary/20">
          <Landmark size={10} /> Finance
        </div>
      );
    }
    return <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Staff</span>;
  };

  const fetchRateData = useCallback(async () => {
    setLoading(true);
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
      toast.error("Failed to sync rate data");
    } finally {
      setLoading(false);
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
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors">
        <Breadcrumbs items={[{ label: 'system rates' }]} />
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchRateData} disabled={loading} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none transition-all active:scale-95">
            <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh
          </Button>
          <Button onClick={() => setShowRateDialog(true)} className="rounded-xl h-10 px-6 font-bold shadow-sm dark:shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest">
            <TrendingUp className="h-4 w-4 mr-2" /> Update Daily Rate
          </Button>
        </div>
      </header>

      {/* 2. Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10">
        <div className="max-w-[1920px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* Active Rate Card */}
            <Card className="lg:col-span-4 bg-slate-900 dark:bg-slate-900/60 rounded-2xl p-10 text-white relative overflow-hidden border-none shadow-sm dark:shadow-none h-full flex flex-col justify-between">
              <CalendarDays className="absolute -right-12 -bottom-12 text-white/[0.03] w-56 h-56" />
              <div className="relative z-10 space-y-12">
                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                  <CalendarDays size={32} />
                </div>
                <div>
                  <h3 className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mb-3">Active Standard Rate</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black italic tracking-tighter tabular-nums">{currentDisplayRate}</span>
                    <span className="text-primary font-black text-xl italic uppercase">PHP/Day</span>
                  </div>
                </div>

                <div className="pt-10 border-t border-white/5 space-y-6">
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">Status Registry</p>
                    <div className="flex items-center gap-2.5 text-green-400 font-black text-[10px] uppercase tracking-[0.2em]">
                      <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                      Protocol Active
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">Last Modified</p>
                    <span className="text-xs font-bold font-mono text-slate-400">{lastUpdate}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* History Table */}
            <Card className="lg:col-span-8 bg-white dark:bg-slate-900/60 border-none rounded-2xl p-10 shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-primary"><History size={20} /></div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 italic">Audit Ledger</h3>
              </div>

              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader className="bg-transparent border-b border-slate-100 dark:border-white/5">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="py-4 font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Value (PHP)</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Authorized By</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Security Clearance</TableHead>
                      <TableHead className="py-4 text-right font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                    {history.length > 0 ? history.map((item) => (
                      <TableRow key={item.id} className="border-none even:bg-slate-50/50 dark:even:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all group">
                        <TableCell className="py-6 border-none">
                          <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100 font-black italic tracking-tighter text-xl group-hover:text-primary transition-colors">
                            {parseFloat(item.daily_rate).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell className="py-6 border-none">
                          <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-300 font-black text-[12px] uppercase">
                            <User size={14} className="text-slate-400" />
                            {item.modifier_name}
                          </div>
                        </TableCell>
                        <TableCell className="py-6 border-none">{renderRoleBadge(item.modifier_role)}</TableCell>
                        <TableCell className="py-6 text-right border-none">
                          <div className="flex items-center justify-end gap-2.5 text-slate-400 font-mono text-[10px] font-bold">
                            <Clock size={12} />
                            {item.updated_at}
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow className="border-none">
                        <TableCell colSpan={4} className="h-72 text-center border-none">
                          <div className="flex flex-col items-center justify-center text-slate-300 gap-3 opacity-20">
                            <History size={48} strokeWidth={1} />
                            <p className="font-black uppercase tracking-widest text-[10px]">No Audit Records Sync'd</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Accessible Dialog */}
      <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-3xl bg-white dark:bg-slate-900 shadow-2xl">
          <div className="sr-only">
            <DialogTitle>Update System Rate</DialogTitle>
            <DialogDescription>Change global daily rate protocol.</DialogDescription>
          </div>
          <div className="p-12 pb-6 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Calculator className="text-primary" size={36} />
            </div>
            <div>
              <h2 className="text-slate-900 dark:text-slate-100 text-3xl font-black italic uppercase tracking-tighter">Adjust Protocol</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Standard Global Daily Rate Adjustment</p>
            </div>
          </div>
          <div className="p-12 space-y-8">
            <div className="relative group">
               <input
                type="number" step="0.01" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)}
                className="w-full text-center py-10 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl outline-none font-black text-7xl text-slate-900 dark:text-white focus:ring-4 ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
               />
               <span className="absolute bottom-4 right-8 text-xs font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest italic">PHP / DAY</span>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleRateSubmit} disabled={loading}
                className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/10"
              >
                {loading ? <RefreshCcw className="animate-spin" /> : "Authorize & Deploy Protocol"}
              </Button>
              <Button variant="ghost" onClick={() => setShowRateDialog(false)} className="h-12 rounded-xl text-slate-400 font-black uppercase text-[10px] tracking-widest">Abort Change</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
