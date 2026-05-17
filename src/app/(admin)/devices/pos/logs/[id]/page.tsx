'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  History, Loader2, ChevronLeft, Calendar, User, Info, ShieldCheck, ShieldAlert
} from 'lucide-react';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface POSLog {
    action_type: string;
    operator: string;
    role: string | null;
    remark: string | null;
    timestamp: string;
}

export default function POSLogsPage() {
    const params = useParams();
    const router = useRouter();
    const posSn = params.id as string;
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<POSLog[]>([]);

    useEffect(() => {
        if (!posSn) return;
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get(`/pos/${posSn}/logs`);
                setLogs(res.data || []);
            } catch (err) {
                toast.error("Failed to load audit logs");
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [posSn]);

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">
            <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl border border-slate-200 dark:border-slate-800 h-10 w-10">
                        <ChevronLeft size={20} />
                    </Button>
                    <Breadcrumbs items={[
                        { label: 'pos', href: '/devices/pos' },
                        { label: 'Audit Ledger' }
                    ]} />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Asset Serial</span>
                    <span className="text-lg font-black italic tracking-tighter text-slate-900 dark:text-white uppercase leading-none">{posSn}</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-10 bg-slate-50/50 dark:bg-transparent transition-colors">
                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-lg text-primary">
                            <History size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white tracking-tighter leading-none">Security Audit Trail</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 opacity-60">Full history of state transitions and human interventions</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-slate-300">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Decoding ledger history...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <Card className="border-none shadow-sm dark:shadow-none rounded-2xl p-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900/60 transition-colors">
                            <ShieldCheck className="text-slate-200 dark:text-slate-800 mb-4" size={60} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No events found for this terminal</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log, i) => (
                                <Card key={i} className="group border-none shadow-sm dark:shadow-none rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 transition-all hover:bg-slate-100/50 dark:hover:bg-white/[0.03]">
                                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <Badge className={cn("px-4 py-1.5 rounded-full font-black text-[10px] uppercase border-none shadow-sm",
                                                    log.action_type.includes('LOCK') ? 'bg-red-500 text-white' :
                                                    log.action_type.includes('UNLOCK') ? 'bg-green-500 text-white' :
                                                    'bg-slate-900 text-white dark:bg-white dark:text-slate-900')}>
                                                    {log.action_type}
                                                </Badge>
                                                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                                                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <Calendar size={12} />
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="mt-1">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                        <User size={16} />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black italic text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                                                        Authenticated Operator: <span className="text-primary">@{log.operator}</span>
                                                        {log.role && <span className="ml-2 opacity-40">[{log.role}]</span>}
                                                    </p>
                                                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
                                                        <Info size={14} className="text-primary mt-0.5 shrink-0" />
                                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic uppercase tracking-wide">
                                                            {log.remark || "NO REMARK PROVIDED"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
