'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Loader2,
  Package, CheckCircle2, 
  AlertTriangle, TabletSmartphone, Lock, Unlock, Building2, Zap, Edit2, History, ShieldAlert, KeyRound, AlertCircle, ShieldCheck
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const STATUS_MAP: Record<number, { label: string, badgeVariant: string }> = {
  0: { label: 'IN STOCK', badgeVariant: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  1: { label: 'ACTIVATED', badgeVariant: "bg-primary/10 text-primary border-primary/20" },
  3: { label: 'DAMAGED', badgeVariant: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" }
};

interface POSRecord {
  pos_sn: string;
  status: number;
  lock_status: number;
  branch_office: string | null;
  assigned_user_name?: string;
  last_lock_reason?: string;
  last_action_by?: string;
  created_at: string;
}

export default function POSPage() {
  const [loading, setLoading] = useState(true);
  const [terminals, setTerminals] = useState<POSRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // --- Security Dialog States ---
  const [securityModal, setSecurityModal] = useState({
    isOpen: false,
    type: 'lock' as 'lock' | 'unlock',
    currentLockStatus: 0, // 0: Normal, 1: Admin, 2: Finance
    targetSN: '',
    password: '',
    remark: '',
    isLoading: false
  });

  const fetchTerminals = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/pos/');
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setTerminals(data);
    } catch (err) {
      toast.error("DATA SYNC ERROR: POS Registry inaccessible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTerminals(); }, []);

  const handleSecurityAction = async () => {
    if (!securityModal.password) return toast.error("Admin password required");

    setSecurityModal(prev => ({ ...prev, isLoading: true }));
    const endpoint = securityModal.type === 'lock' ? '/pos/lock' : '/pos/unlock';

    try {
        await apiClient.post(endpoint, {
            pos_sn: securityModal.targetSN,
            password: securityModal.password,
            remark: securityModal.remark || undefined
        });

        toast.success(`Device ${securityModal.type}ed successfully`);
        setSecurityModal(prev => ({ ...prev, isOpen: false, password: '', remark: '' }));
        fetchTerminals();
    } catch (err: any) {
        toast.error(err.response?.data?.detail || "Authorization failed");
    } finally {
        setSecurityModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const filteredTerminals = terminals.filter(t => {
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch = (t.pos_sn || '').toLowerCase().includes(searchStr);
    const matchesStatus = statusFilter === 'all' || t.status.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openSecurityModal = (pos: POSRecord, type: 'lock' | 'unlock') => {
      setSecurityModal({
          ...securityModal,
          isOpen: true,
          type: type,
          currentLockStatus: pos.lock_status,
          targetSN: pos.pos_sn,
          password: '',
          remark: ''
      });
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors gap-8">
        <div className="flex items-center gap-8 flex-1">
          <Breadcrumbs items={[{ label: "pos assets" }]} />
          <div className="relative max-w-md w-full flex items-center h-11 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-slate-400 group-focus-within:text-primary transition-colors mr-2 shrink-0" size={14} />
            <input 
              type="text" placeholder="SEARCH BY SERIAL NUMBER (SN)..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none text-slate-950 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchTerminals} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none"><Loader2 className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh</Button>
          <Link href="/devices/pos/create" passHref>
            <Button asChild className="rounded-xl h-10 px-6 font-bold shadow-sm dark:shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest">
              <span><Zap className="h-4 w-4 mr-2" /> New Terminal</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="relative z-10 w-80 border-r border-slate-200 dark:border-slate-800/50 bg-white/90 dark:bg-slate-950/50 backdrop-blur-xl p-5 flex flex-col gap-4 shrink-0 shadow-sm transition-colors">
          <div className="space-y-2">
            <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-2">Inventory Filter</h3>
            <button onClick={() => setStatusFilter('all')} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-4 text-sm font-bold border", statusFilter === 'all' ? "bg-slate-900 text-white border-slate-900 shadow-xl dark:bg-white dark:text-slate-900 scale-[1.02]" : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50")}><TabletSmartphone className="h-4 w-4" /><span>Full Inventory</span></button>
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
                      <TableHead className="w-[30%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Terminal Identity</TableHead>
                      <TableHead className="w-[20%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Custodian</TableHead>
                      <TableHead className="w-[20%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Security Status</TableHead>
                      <TableHead className="w-[15%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-right">Registered</TableHead>
                      <TableHead className="w-[15%] text-right pr-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Ops</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredTerminals.map((pos) => (
                      <TableRow key={pos.pos_sn} className="group hover:bg-slate-100/80 dark:hover:bg-white/[0.08] transition-colors border-none even:bg-slate-50 dark:even:bg-white/[0.03]">
                        <TableCell className="py-5 px-8 align-middle">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center transition-all shrink-0", pos.status === 1 ? "border-primary/20 bg-primary/5 text-primary" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400")}>
                                <TabletSmartphone size={18} />
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-black uppercase italic tracking-tighter text-slate-900 dark:text-white text-[15px] leading-tight group-hover:text-primary transition-colors truncate">SN: {pos.pos_sn}</span>
                                <Badge className={cn("w-fit px-2 py-0.5 rounded-full font-black text-[7px] uppercase border-none", STATUS_MAP[pos.status]?.badgeVariant)}>{STATUS_MAP[pos.status]?.label}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-center">
                          <div className="flex flex-col gap-1 items-center min-w-0">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase italic text-slate-900 dark:text-slate-300 w-full justify-center">
                               <Building2 size={12} className="text-primary shrink-0" />
                               <span className="truncate">{pos.branch_office || pos.assigned_user_name || "UNASSIGNED"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-center">
                           <div className="flex flex-col items-center gap-1">
                                <Badge variant="outline" className={cn("px-3 py-1 rounded-full font-black text-[8px] uppercase border-2 mx-auto", pos.lock_status === 0 ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400" : "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400")}>
                                    {pos.lock_status === 0 ? "Normal" : pos.lock_status === 1 ? "Admin Locked" : "Finance Lock"}
                                </Badge>
                                {pos.lock_status !== 0 && pos.last_lock_reason && (
                                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 italic max-w-[100px] truncate uppercase">
                                        {pos.last_lock_reason}
                                    </span>
                                )}
                           </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-right font-mono text-[10px] font-black text-slate-400 italic whitespace-nowrap">{pos.created_at?.split(' ')[0]}</TableCell>
                        <TableCell className="py-5 px-8 pr-8 text-right align-middle whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                              <Link href={`/devices/pos/edit/${pos.pos_sn}`} passHref><Button variant="ghost" size="icon" className="text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all h-9 w-9"><Edit2 size={16} /></Button></Link>

                              {pos.lock_status === 0 ? (
                                <Button variant="ghost" size="icon" onClick={() => openSecurityModal(pos, 'lock')} className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg h-9 w-9"><Lock size={16} /></Button>
                              ) : (
                                <Button variant="ghost" size="icon" onClick={() => openSecurityModal(pos, 'unlock')} className="text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg h-9 w-9"><Unlock size={16} /></Button>
                              )}

                              <Link href={`/devices/pos/logs/${pos.pos_sn}`} passHref>
                                <Button variant="ghost" size="icon" className="text-slate-300 dark:text-slate-600 hover:text-primary rounded-lg h-9 w-9">
                                    <History size={16} />
                                </Button>
                              </Link>
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

      <Dialog open={securityModal.isOpen} onOpenChange={(open) => !open && setSecurityModal(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="max-w-[440px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
            <div className="p-10 space-y-6 text-center">
                {/* DYNAMIC ICON & COLOR */}
                <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center mx-auto ring-8 transition-all",
                    securityModal.type === 'lock'
                        ? "bg-red-50 text-red-500 ring-red-50/50 dark:bg-red-500/10"
                        : securityModal.currentLockStatus === 2
                            ? "bg-amber-50 text-amber-500 ring-amber-50/50 dark:bg-amber-500/10"
                            : "bg-green-50 text-green-500 ring-green-50/50 dark:bg-green-500/10"
                )}>
                    {securityModal.type === 'lock' ? <ShieldAlert size={40} /> :
                     securityModal.currentLockStatus === 2 ? <AlertCircle size={40} /> : <ShieldCheck size={40} />}
                </div>

                <div>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                        {securityModal.type === 'lock' ? 'Authorize Lockout' :
                         securityModal.currentLockStatus === 2 ? 'Reconciliation Unlock' : 'System Restoration'}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {securityModal.currentLockStatus === 2
                            ? "Authorize manual unlock for overdue device"
                            : `Security protocol for terminal: ${securityModal.targetSN}`}
                    </DialogDescription>
                </div>

                <div className="space-y-3 pt-4">
                    <Input type="password" placeholder="Admin Password" value={securityModal.password} onChange={(e) => setSecurityModal({ ...securityModal, password: e.target.value })} className="h-14 rounded-xl text-center font-bold text-lg focus:ring-primary/20" />
                    <Input
                        placeholder={securityModal.currentLockStatus === 2 ? "Confirm reconciliation status..." : "Reason for intervention..."}
                        value={securityModal.remark} onChange={(e) => setSecurityModal({ ...securityModal, remark: e.target.value })}
                        className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-center"
                    />
                </div>

                <div className="flex flex-col gap-2 pt-4">
                    <Button onClick={handleSecurityAction} disabled={securityModal.isLoading} className={cn("h-14 rounded-xl font-black uppercase tracking-widest text-xs",
                        securityModal.type === 'lock' ? 'bg-red-600' : 'bg-green-600')}>
                        {securityModal.isLoading ? <Loader2 className="animate-spin" /> :
                         securityModal.currentLockStatus === 2 ? 'Authorize & Unlock' : 'Confirm Restoration'}
                    </Button>
                    <Button variant="ghost" onClick={() => setSecurityModal(prev => ({ ...prev, isOpen: false }))} className="h-12 rounded-xl text-slate-400 text-xs font-black uppercase">Abort</Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
