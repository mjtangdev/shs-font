'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Loader2,
  Package, CheckCircle2, 
  AlertTriangle, MapPin, FileDown,
  Zap, Lock, Unlock, Building2, Layers,
  RefreshCcw
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
      toast.error("SYSTEM SYNC ERROR: Solar registry inaccessible.");
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
      toast.success("Export successful");
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDevAlert = () => {
    toast.info("Feature in development", {
      description: "Module undergoing calibration. Please wait for the next update.",
      className: "font-bold text-[12px] tracking-tight",
    });
  };

  useEffect(() => { fetchUnits(); }, []);

  const filteredUnits = units.filter(u => {
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch = (u.shs_machine_id?.toLowerCase() || "").includes(searchStr) ||
                          (u.customer_name?.toLowerCase() || "").includes(searchStr);
    const matchesStatus = statusFilter === 'all' || u.status.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors gap-8">
        <div className="flex items-center gap-8 flex-1">
          <Breadcrumbs items={[{ label: "solar assets" }]} />
          <div className="relative max-w-md w-full flex items-center h-11 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-slate-400 group-focus-within:text-primary transition-colors mr-2 shrink-0" size={14} />
            <input 
              type="text" placeholder="SEARCH BY MACHINE ID OR CUSTOMER..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none text-slate-950 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} disabled={isExporting} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none">
            {isExporting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <FileDown className="h-4 w-4 mr-2" />} Export
          </Button>
          <Button variant="outline" onClick={fetchUnits} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none">
            <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh
          </Button>
          <Link href="/devices/solar/create" passHref>
            <Button asChild className="rounded-xl h-10 px-6 font-bold shadow-sm dark:shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest">
              <span><Zap className="h-4 w-4 mr-2" /> Reg. Unit</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="relative z-10 w-80 border-r border-slate-200 dark:border-slate-800/50 bg-white/90 dark:bg-slate-950/50 backdrop-blur-xl p-5 flex flex-col gap-4 shrink-0 shadow-sm transition-colors">
          <div className="space-y-2">
            <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-2">Inventory Filter</h3>
            <button onClick={() => setStatusFilter('all')} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-4 text-sm font-bold border", statusFilter === 'all' ? "bg-slate-900 text-white border-slate-900 shadow-xl dark:bg-white dark:text-slate-900 scale-[1.02]" : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50")}><Layers className="h-4 w-4" /><span>Full Registry</span></button>
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
                <Table className="table-fixed">
                  <TableHeader className="bg-transparent border-b border-slate-100 dark:border-white/5 transition-colors">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="w-[40%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">SHS Machine Identity & Components</TableHead>
                      <TableHead className="w-[20%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Deployment</TableHead>
                      <TableHead className="w-[15%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Status</TableHead>
                      <TableHead className="w-[15%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-right">Production</TableHead>
                      <TableHead className="w-[10%] text-right pr-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Ops</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                       <TableRow>
                          <TableCell colSpan={5} className="h-[400px] text-center">
                              <div className="flex flex-col items-center justify-center gap-4 text-slate-300 italic">
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing Registry...</span>
                              </div>
                          </TableCell>
                       </TableRow>
                    ) : filteredUnits.map((unit) => (
                      <TableRow key={unit.id} className="group hover:bg-slate-100/80 dark:hover:bg-white/[0.08] transition-colors border-none even:bg-slate-50 dark:even:bg-white/[0.03]">
                        <TableCell className="py-8 px-8 align-middle">
                          <div className="flex items-start gap-6">
                              <div className={cn(
                                  "w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 shadow-sm",
                                  unit.status === 1 ? "border-primary/20 bg-primary/5 text-primary" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400"
                              )}>
                                  <Layers size={22} />
                              </div>

                              <div className="flex flex-col space-y-4">
                                  <div className="bg-slate-900 dark:bg-slate-800 text-white px-4 py-2 rounded-lg inline-flex flex-col min-w-[220px] shadow-lg dark:shadow-none border border-white/5">
                                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Master Machine ID</span>
                                      <span className="font-mono text-base font-black italic tracking-wider">{unit.shs_machine_id}</span>
                                  </div>

                                  <div className="relative pl-2 space-y-2">
                                      {[
                                          { label: 'SOLAR PANEL', id: unit.solar_equipment_id },
                                          { label: 'RADIO UNIT', id: unit.radio_id },
                                          { label: 'FLASH TORCH', id: unit.flashlight_id },
                                          { label: 'LED LIGHTS', id: unit.led_light_id }
                                      ].map((item, idx, arr) => (
                                          <div key={item.label} className="relative flex items-center gap-3 pl-6 h-5">
                                              <div className="absolute left-0 top-[-10px] bottom-1/2 w-[2px] bg-slate-200 dark:bg-slate-800" />
                                              <div className="absolute left-0 top-1/2 w-4 h-[2px] bg-slate-200 dark:bg-slate-800" />
                                              {idx === arr.length - 1 && <div className="absolute left-0 top-1/2 bottom-0 w-[2px] bg-white dark:bg-slate-900" />}

                                              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20">{item.label}</span>
                                              <span className="text-[10px] font-bold font-mono text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase tracking-tight">{item.id}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-center">
                          <div className="inline-flex flex-col gap-2 items-center">
                            <div className="flex items-center gap-2 text-[11px] font-black uppercase italic text-slate-900 dark:text-slate-100">
                               <Building2 size={13} className="text-primary" />
                               {unit.customer_name === "-" ? <span className="text-slate-300 dark:text-slate-700 font-bold not-italic">Unassigned</span> : unit.customer_name}
                            </div>
                            <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase">
                               {unit.city_name} • {unit.town_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-center">
                          <div className="flex flex-col items-center gap-2">
                             <Badge className={cn("px-4 py-1.5 rounded-full font-black text-[9px] uppercase border-none shadow-sm", STATUS_MAP[unit.status]?.badgeVariant)}>
                                {STATUS_MAP[unit.status]?.label}
                             </Badge>
                             <div className={cn(
                                "flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.1em]",
                                unit.status === 1 ? "text-green-600 dark:text-green-400" : "text-slate-400"
                             )}>
                                {unit.status === 1 ? <Unlock size={10} strokeWidth={3} /> : <Lock size={10} strokeWidth={3} />}
                                {unit.status === 1 ? "Active Protocol" : "Standby/Locked"}
                             </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-right font-mono text-[10px] font-black text-slate-400 italic">
                          {unit.production_date?.split('T')[0]}
                        </TableCell>
                        <TableCell className="py-8 px-8 pr-8 text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={handleDevAlert} className="text-slate-300 dark:text-slate-600 hover:text-primary rounded-lg h-9 w-9"><MapPin size={16} /></Button>
                              <Button variant="ghost" size="icon" onClick={handleDevAlert} className="text-slate-300 dark:text-slate-600 hover:text-red-500 rounded-lg h-9 w-9"><Lock size={16} /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
