'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Loader2,
  Package, CheckCircle2,
  AlertTriangle, MapPin, FileDown,
  RefreshCcw, CreditCard
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const STATUS_MAP: Record<number, { label: string, badgeVariant: string, icon: React.ReactNode }> = {
  0: { 
    label: 'IN STOCK', 
    badgeVariant: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    icon: <Package size={12} /> 
  },
  1: { 
    label: 'ACTIVATED', 
    badgeVariant: "bg-primary/10 text-primary border-primary/20",
    icon: <CheckCircle2 size={12} /> 
  },
  3: { 
    label: 'DAMAGED', 
    badgeVariant: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
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
  const [isExporting, setIsExporting] = useState(false);
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/card/');
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setCards(data);
    } catch (err) {
      toast.error("ASSET SYNC ERROR: Card registry inaccessible.");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors gap-8">
        <div className="flex items-center gap-8 flex-1">
          <Breadcrumbs items={[{ label: "ic card assets" }]} />
          <div className="relative max-w-md w-full flex items-center h-11 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-slate-400 group-focus-within:text-primary transition-colors mr-2 shrink-0" size={14} />
            <input 
              type="text" placeholder="SEARCH BY CARD SN OR UUID..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none text-slate-950 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} disabled={isExporting} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none">
            {isExporting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <FileDown className="h-4 w-4 mr-2" />} Export
          </Button>
          <Button variant="outline" onClick={fetchCards} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none">
            <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh
          </Button>
          <Link href="/devices/card/create" passHref>
            <Button asChild className="rounded-xl h-10 px-6 font-bold shadow-sm dark:shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest">
              <span><Plus className="h-4 w-4 mr-2" /> New Card</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="relative z-10 w-80 border-r border-slate-200 dark:border-slate-800/50 bg-white/90 dark:bg-slate-950/50 backdrop-blur-xl p-5 flex flex-col gap-4 shrink-0 shadow-sm transition-colors">
          <div className="space-y-2">
            <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-2">Inventory Filter</h3>
            <button onClick={() => setStatusFilter('all')} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-4 text-sm font-bold border", statusFilter === 'all' ? "bg-slate-900 text-white border-slate-900 shadow-xl dark:bg-white dark:text-slate-900 scale-[1.02]" : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50")}><CreditCard className="h-4 w-4" /><span>Full Registry</span></button>
            {[0, 1, 3].map((sId) => (
              <button key={sId} onClick={() => setStatusFilter(sId.toString())} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold border mb-1", statusFilter === sId.toString() ? "bg-primary text-white border-transparent" : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50")}>
                {STATUS_MAP[sId].label}
              </button>
            ))}
          </div>
        </aside>

        <main className="relative z-10 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10">
          <div className="max-w-[1920px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-none shadow-sm dark:shadow-none rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 transition-colors">
                <Table>
                  <TableHeader className="bg-transparent border-b border-slate-100 dark:border-white/5 transition-colors">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="w-[8%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Type</TableHead>
                      <TableHead className="w-[32%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Physical Identity</TableHead>
                      <TableHead className="w-[30%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Ownership / Customer</TableHead>
                      <TableHead className="w-[20%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Protocol Dates</TableHead>
                      <TableHead className="w-[10%] text-right pr-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-[400px] text-center">
                            <div className="flex flex-col items-center justify-center gap-4 text-slate-300 italic">
                              <Loader2 className="animate-spin text-primary" size={40} />
                              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Scanning RFID Registry...</span>
                            </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredCards.map((card) => (
                      <TableRow key={card.id} className="group hover:bg-slate-100/80 dark:hover:bg-white/[0.08] transition-colors border-none even:bg-slate-50 dark:even:bg-white/[0.03]">
                        <TableCell className="py-7 px-8 text-center align-middle">
                          <div className={cn("inline-flex p-3 rounded-xl border transition-all",
                             card.status === 1 ? "bg-primary/5 border-primary/20 text-primary" : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400")}>
                            {STATUS_MAP[card.status]?.icon || <CreditCard size={18} />}
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-black uppercase italic tracking-tighter text-[15px] leading-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">SN: {card.card_number}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">UUID: {card.card_uuid}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle">
                          {card.customer_name ? (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-slate-900 dark:text-slate-200">
                                 <CheckCircle2 size={12} className="text-green-500" /> {card.customer_name}
                              </div>
                              <div className="flex items-center gap-2 text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase italic">
                                 <MapPin size={10} /> {card.city_name} / {card.town_name}
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest italic border-slate-100 dark:border-slate-800 px-3 py-1">Available in Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-8 text-center align-middle">
                          <div className="inline-flex flex-col gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 italic leading-none">
                            <div className="flex items-center justify-center gap-2">IN: {card.created_at?.split('T')[0]}</div>
                            {card.bound_at && <div className="flex items-center justify-center gap-2 text-primary font-bold underline underline-offset-2">OUT: {card.bound_at.split('T')[0]}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="py-7 px-8 pr-8 text-right align-middle">
                          <Button variant="ghost" size="icon" onClick={() => toast.info("PROTOCOL: Edit function locked.")} className="text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white rounded-lg h-9 w-9">
                            <Plus className="rotate-45" size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && filteredCards.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-32 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-20">
                            <Package size={48} strokeWidth={1} />
                            <span className="text-[11px] font-black uppercase tracking-[0.4em]">No Inventory Matched</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
