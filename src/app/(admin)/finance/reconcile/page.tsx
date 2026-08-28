'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, TabletSmartphone,
  CheckCircle2, AlertCircle, Building2,
  Calendar, RefreshCcw, ShieldCheck, MapPin, Home, Users, ChevronDown, ChevronRight
} from 'lucide-react';
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface POSReconcileRecord {
  id: number;
  pos_sn: string;
  branch_office: string | null;
  assigned_user_name?: string;
  total_collected: number;
  pending_amount: number;
  last_reconciled_at: string | null;
  status: number;
}

interface RegionData {
  id: number;
  name: string;
  level: number;
  children: RegionData[];
}

function RegionNode({
  node,
  selectedId,
  onSelect,
  depth = 0,
}: {
  node: RegionData;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  depth?: number;
}) {
  const isRoot = node.level === 0;
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  const getIcon = () => {
    if (isRoot) return <Building2 className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", isSelected ? "text-white" : "text-primary")} />;
    if (node.level === 1) return <MapPin className={cn("h-3 w-3 shrink-0 mt-0.5", isSelected ? "text-white" : "text-slate-400")} />;
    return <Home className={cn("h-3 w-3 shrink-0 mt-0.5", isSelected ? "text-white" : "text-slate-400")} />;
  };

  return (
    <div className="w-full min-w-0 select-none">
      <div
        onClick={() => onSelect(isSelected ? null : node.id)}
        className={cn(
          "flex items-start gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group mb-1 w-full min-w-0 box-border",
          isSelected
            ? "bg-primary text-white shadow-lg shadow-primary/20"
            : isRoot
              ? "bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <div
          onClick={(e) => {
            if (isRoot) return;
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={cn(
            "w-4 h-4 flex items-center justify-center rounded transition-colors shrink-0 mt-0.5",
            !isRoot && "hover:bg-black/5 dark:hover:bg-white/10"
          )}
        >
          {hasChildren && !isRoot && (isOpen ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />)}
          {isRoot && <div className="w-1 h-3.5 bg-primary/20 rounded-full mr-1 shrink-0" />}
        </div>
        {getIcon()}
        <span className={cn("text-sm break-all whitespace-normal min-w-0 flex-1 tracking-tight leading-snug", isRoot ? "text-base font-black uppercase" : "font-semibold", isSelected ? "text-white" : "text-slate-700 dark:text-slate-300")}>
          {node.name}
        </span>
      </div>
      {hasChildren && (isRoot || isOpen) && (
        <div className="relative my-0.5">
          {node.children.map((child) => (
            <RegionNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReconcilePage() {
  const [loading, setLoading] = useState(true);
  const [terminals, setTerminals] = useState<POSReconcileRecord[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reconcileDate, setReconcileDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role === '1' || role === '0' || role === '3') {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      toast.error("Access Denied: Administrative privileges required.");
      window.location.href = '/dashboard';
    }
  }, []);

  const fetchTerminals = async () => {
    if (isAuthorized === false) return;
    setLoading(true);
    try {
      // Mocking API for reconciliation data
      const res = await apiClient.get('/pos/');
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
      // Add some mock financial data for reconciliation
      const reconcileData = data.map((pos: any) => ({
        ...pos,
        total_collected: Math.floor(Math.random() * 50000),
        pending_amount: Math.floor(Math.random() * 5000),
        last_reconciled_at: pos.created_at
      }));
      setTerminals(reconcileData);
    } catch (err) {
      toast.error("Failed to sync terminal data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = useCallback(async () => {
    try {
      const res = await apiClient.get("/org/regions/tree");
      const data = res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      setRegions(data);
    } catch {
      toast.error("Failed to load regions");
    }
  }, []);

  useEffect(() => {
    fetchTerminals();
    fetchRegions();
  }, [fetchRegions]);

  const handleReconcileConfirm = async (id: number) => {
    setSubmittingId(id);
    try {
      // Logic for reconciliation confirmation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Reconciliation confirmed for " + reconcileDate);
      fetchTerminals();
    } catch (err) {
      toast.error("Confirmation failed");
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredTerminals = terminals.filter(t => {
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch = (t.pos_sn || '').toLowerCase().includes(searchStr);
    return matchesSearch;
  });

  if (isAuthorized === null) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (isAuthorized === false) return null;

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">

      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors gap-8">
        <div className="flex items-center gap-8 flex-1 min-w-0">
          <Breadcrumbs items={[{ label: 'finance', href: '/finance' }, { label: "reconciliation" }]} />

          <div className="flex items-center gap-4 flex-1 max-w-2xl">
              <div className="relative flex-1 flex items-center h-11 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Search className="text-slate-400 group-focus-within:text-primary transition-colors mr-2 shrink-0" size={14} />
                <input
                  type="text" placeholder="SEARCH TERMINAL SN..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none text-slate-950 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div className="relative flex items-center h-11 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl group transition-all shrink-0">
                <Calendar size={14} className="text-slate-400 mr-3 shrink-0" />
                <input
                  type="date" value={reconcileDate} onChange={(e) => setReconcileDate(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black text-slate-600 dark:text-slate-300 outline-none uppercase tracking-widest cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0"
                />
                <span className="ml-2 text-[8px] font-black text-slate-400 uppercase pointer-events-none">TARGET DATE</span>
              </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchTerminals} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none transition-all active:scale-95">
            <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh
          </Button>
        </div>
      </header>

      {/* 2. Main Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="relative z-10 w-80 border-r border-slate-200 dark:border-slate-800/50 bg-white/90 dark:bg-slate-950/50 backdrop-blur-xl p-5 flex flex-col gap-4 shrink-0 shadow-sm transition-colors">
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-3">
              <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-2">Regional Filter</h3>
              <button
                onClick={() => setSelectedRegionId(null)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-6 text-sm font-bold border",
                  selectedRegionId === null
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl dark:bg-white dark:text-slate-900 dark:border-white scale-[1.02]"
                    : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50"
                )}
              >
                <Users className="h-4 w-4" />
                <span>All Locations</span>
              </button>
              {regions.map((node) => (
                <RegionNode key={node.id} node={node} selectedId={selectedRegionId} onSelect={setSelectedRegionId} />
              ))}
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10">
          <div className="max-w-[1920px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            <Card className="border-none shadow-sm dark:shadow-none rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 transition-colors">
                <Table className="table-fixed">
                  <TableHeader className="bg-transparent border-b border-slate-100 dark:border-white/5 transition-colors">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="w-[25%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Terminal Identity</TableHead>
                      <TableHead className="w-[20%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Custodian</TableHead>
                      <TableHead className="w-[15%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-right">Revenue (PHP)</TableHead>
                      <TableHead className="w-[15%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-right">Last Sync</TableHead>
                      <TableHead className="w-[25%] text-right pr-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Operations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-[400px] text-center">
                          <div className="flex flex-col items-center justify-center gap-4 text-slate-300 italic">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synching Ledger...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredTerminals.map((pos) => (
                      <TableRow key={pos.id} className="group hover:bg-slate-100/80 dark:hover:bg-white/[0.08] transition-colors border-none even:bg-slate-50 dark:even:bg-white/[0.03]">
                        <TableCell className="py-5 px-8 align-middle">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl border border-primary/20 bg-primary/5 text-primary flex items-center justify-center transition-all shrink-0">
                                <TabletSmartphone size={18} />
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-black uppercase italic tracking-tighter text-slate-900 dark:text-white text-[15px] leading-tight group-hover:text-primary transition-colors truncate">SN: {pos.pos_sn}</span>
                                <Badge className="w-fit px-2 py-0.5 rounded-full font-black text-[7px] uppercase border-none bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">READY FOR AUDIT</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-center">
                          <div className="inline-flex flex-col gap-1 items-center">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase italic text-slate-900 dark:text-slate-300">
                               <Building2 size={12} className="text-primary" /> {pos.branch_office || pos.assigned_user_name || "CENTRAL"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-right">
                           <div className="flex flex-col items-end">
                                <span className="text-lg font-black italic text-slate-900 dark:text-slate-100 tracking-tighter">₱ {pos.total_collected.toLocaleString()}</span>
                                <span className="text-[8px] font-bold text-red-500 uppercase">Pending: {pos.pending_amount.toLocaleString()}</span>
                           </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-right font-mono text-[10px] font-black text-slate-400 italic whitespace-nowrap">{pos.last_reconciled_at?.split(' ')[0] || "NEVER"}</TableCell>
                        <TableCell className="py-5 px-8 pr-8 text-right align-middle whitespace-nowrap">
                          <Button
                            onClick={() => handleReconcileConfirm(pos.id)}
                            disabled={submittingId === pos.id}
                            className="h-10 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/10 active:scale-95 transition-all"
                          >
                            {submittingId === pos.id ? <Loader2 className="animate-spin h-4 w-4" /> : <><ShieldCheck className="h-4 w-4 mr-2" /> Verify & Settle</>}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredTerminals.length === 0 && !loading && (
                  <div className="py-32 text-center flex flex-col items-center opacity-20">
                    <AlertCircle size={48} strokeWidth={1} />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] mt-4">No Reconciliation Data</span>
                  </div>
                )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
