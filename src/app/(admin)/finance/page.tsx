"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Download, Wallet, TrendingUp, AlertCircle, 
  ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, XCircle,
  MapPin, Calendar, ChevronDown, ChevronRight, Loader2,
  Users, Home, Building2, RefreshCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from '@/lib/axios';
import { toast } from "sonner";

import Breadcrumbs from '@/components/Breadcrumbs';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RegionData {
  id: number;
  name: string;
  level: number;
  children: RegionData[];
  is_occupied: boolean;
}

const MOCK_STATS = [
  { label: "Total Revenue", value: "₱ 2,450,000.00", trend: "+12.5%", isPositive: true, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
  { label: "Monthly Recurring", value: "₱ 840,000.00", trend: "+5.2%", isPositive: true, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
  { label: "Pending Collections", value: "₱ 124,500.00", trend: "-2.4%", isPositive: false, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" }
];

const MOCK_TRANSACTIONS = [
  { id: "TRX-9982-A", customer: "Juan Dela Cruz", amount: "₱ 1,500.00", date: "2026-05-12 10:30 AM", status: "completed", method: "NFC Card" },
  { id: "TRX-9983-B", customer: "Maria Santos", amount: "₱ 2,100.00", date: "2026-05-12 09:15 AM", status: "pending", method: "Bank Transfer" },
  { id: "TRX-9984-C", customer: "Pedro Penduko", amount: "₱ 850.00", date: "2026-05-11 15:45 PM", status: "failed", method: "POS Terminal" },
  { id: "TRX-9985-D", customer: "Ana Reyes", amount: "₱ 3,200.00", date: "2026-05-11 11:20 AM", status: "completed", method: "NFC Card" },
  { id: "TRX-9986-E", customer: "Lito Lapid", amount: "₱ 1,500.00", date: "2026-05-10 14:10 PM", status: "completed", method: "Cash" },
  { id: "TRX-9987-F", customer: "Jose Rizal", amount: "₱ 4,500.00", date: "2026-05-09 08:00 AM", status: "completed", method: "NFC Card" },
];

function RegionNode({
  node, 
  selectedId, 
  onSelect, 
  depth = 0 
}: { 
  node: RegionData, 
  selectedId: number | null, 
  onSelect: (id: number | null) => void, 
  depth?: number 
}) {
  const isRoot = node.level === 0;
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const getIcon = () => {
    if (isRoot) return <Building2 className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-primary")} />;
    if (node.level === 1) return <MapPin className={cn("h-3 w-3", isSelected ? "text-white" : "text-slate-400")} />;
    return <Home className={cn("h-3 w-3", isSelected ? "text-white" : "text-slate-400")} />;
  };
  return (
    <div className="w-full select-none">
      <div onClick={() => onSelect(isSelected ? null : node.id)} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group mb-1", isSelected ? "bg-primary text-white shadow-lg shadow-primary/20" : isRoot ? "bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-100 dark:hover:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400")} style={{ paddingLeft: `${depth * 16 + 12}px` }}>
        <div onClick={(e) => { if (isRoot) return; e.stopPropagation(); setIsOpen(!isOpen); }} className={cn("w-4 h-4 flex items-center justify-center rounded transition-colors", !isRoot && "hover:bg-black/5 dark:hover:bg-white/10")}>
          {hasChildren && !isRoot && (isOpen ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />)}
          {isRoot && <div className="w-1 h-3.5 bg-primary/20 rounded-full mr-1" /> }
        </div>
        {getIcon()}
        <span className={cn("text-sm truncate flex-1 tracking-tight", isRoot ? "text-base font-black uppercase" : "font-semibold", isSelected ? "text-white" : "text-slate-700 dark:text-slate-300")}>{node.name}</span>
      </div>
      {hasChildren && (isRoot || isOpen) && (
        <div className="relative my-0.5">
          {node.children.map((child: RegionData) => <RegionNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

export default function FinancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [fetchingRegions, setFetchingRegions] = useState(true);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRegionData = async () => {
      try {
        const res = await apiClient.get('/org/regions/tree');
        const data = res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
        setRegions(data);
      } catch (err) {
        toast.error("Failed to load regional data");
      } finally {
        setFetchingRegions(false);
      }
    };
    fetchRegionData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed': return <CheckCircle2 size={12} className="mr-1" />;
      case 'pending': return <Clock size={12} className="mr-1" />;
      case 'failed': return <XCircle size={12} className="mr-1" />;
      default: return null;
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed': return "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400";
      case 'pending': return "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case 'failed': return "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400";
      default: return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    }
  };

  const filteredTransactions = MOCK_TRANSACTIONS.filter(trx => {
    const matchesSearch = trx.customer.toLowerCase().includes(searchQuery.toLowerCase()) || trx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || trx.status.toUpperCase() === statusFilter;
    
    let matchesDate = true;
    const trxDateStr = trx.date.split(' ')[0];
    if (startDate && trxDateStr < startDate) matchesDate = false;
    if (endDate && trxDateStr > endDate) matchesDate = false;

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors gap-8">
        <div className="flex items-center gap-8 flex-1">
          <Breadcrumbs items={[{ label: 'finance' }]} />
          <div className="relative max-w-md w-full flex items-center h-11 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-slate-400 group-focus-within:text-primary transition-colors mr-2 shrink-0" size={14} />
            <input
              type="text" placeholder="SEARCH TRANSACTIONS OR CUSTOMERS..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none text-slate-950 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none transition-all active:scale-95">
            <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
          <Button variant="outline" className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none transition-all active:scale-95">
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="relative z-10 w-80 border-r border-slate-200 dark:border-slate-800/50 bg-white/90 dark:bg-slate-950/50 backdrop-blur-xl p-5 flex flex-col gap-6 shrink-0 shadow-sm transition-colors">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Regional Filter</h3>
              <button
                onClick={() => setSelectedRegionId(null)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold border",
                  selectedRegionId === null
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl dark:bg-white dark:text-slate-900 dark:border-white scale-[1.02]"
                    : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50"
                )}
              >
                <Users className="h-4 w-4" />
                <span>All Regions</span>
              </button>
            </div>

            <ScrollArea className="h-[300px] pr-2">
              {fetchingRegions ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
                </div>
              ) : (
                regions.map(node => (
                  <RegionNode key={node.id} node={node} selectedId={selectedRegionId} onSelect={setSelectedRegionId} />
                ))
              )}
            </ScrollArea>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
               <div className="space-y-2">
                  <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Status</h3>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-11 pl-4 pr-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-none text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none cursor-pointer appearance-none"
                    >
                      <option value="ALL">ALL STATUS</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
               </div>

               <div className="space-y-2">
                  <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Date Range</h3>
                  <div className="flex flex-col gap-2">
                      <div className="relative flex items-center h-11 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl group transition-all">
                        <Calendar size={14} className="text-slate-400 mr-3 shrink-0" />
                        <input
                          type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-transparent border-none text-[10px] font-black text-slate-600 dark:text-slate-300 outline-none uppercase tracking-widest cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0"
                        />
                        <span className="absolute right-4 text-[8px] font-black text-slate-300 uppercase pointer-events-none">Start</span>
                      </div>
                      <div className="relative flex items-center h-11 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl group transition-all">
                        <Calendar size={14} className="text-slate-400 mr-3 shrink-0" />
                        <input
                          type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-transparent border-none text-[10px] font-black text-slate-600 dark:text-slate-300 outline-none uppercase tracking-widest cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0"
                        />
                        <span className="absolute right-4 text-[8px] font-black text-slate-300 uppercase pointer-events-none">End</span>
                      </div>
                  </div>
               </div>
            </div>
          </div>
        </aside>

        <main className="relative z-10 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10">
          <div className="max-w-[1920px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {MOCK_STATS.map((stat, i) => (
                <Card key={i} className="bg-white dark:bg-slate-900/60 rounded-2xl p-6 border-none shadow-sm dark:shadow-none relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 cursor-default flex items-center gap-5">
                  <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500", stat.bg, stat.color)}>
                    <stat.icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] pr-2">{stat.label}</p>
                      <div className={cn("flex items-center gap-0.5 text-[10px] font-black tracking-tighter", stat.isPositive ? "text-green-500" : "text-red-500")}>
                        {stat.isPositive ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                        {stat.trend}
                      </div>
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-slate-100 truncate">{stat.value}</h3>
                  </div>
                </Card>
              ))}
            </div>

            {/* Transaction Table */}
            <Card className="border-none shadow-sm dark:shadow-none rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 transition-colors">
              <Table className="table-fixed">
                <TableHeader className="bg-transparent border-b border-slate-100 dark:border-white/5 transition-colors">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="w-[30%] py-6 px-10 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Transaction Detail</TableHead>
                    <TableHead className="w-[20%] font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Amount</TableHead>
                    <TableHead className="w-[20%] font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Method</TableHead>
                    <TableHead className="w-[15%] font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Date & Time</TableHead>
                    <TableHead className="w-[15%] text-right pr-10 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredTransactions.map((trx, idx) => (
                    <TableRow key={idx} className="group hover:bg-slate-100/80 dark:hover:bg-white/[0.08] transition-colors border-none even:bg-slate-50 dark:even:bg-white/[0.03]">
                      <TableCell className="py-6 px-10 align-middle">
                        <div className="flex flex-col gap-1">
                          <span className="font-black italic text-slate-900 dark:text-slate-100 text-[16px] uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{trx.customer}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest font-mono">{trx.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="text-[18px] font-black italic text-slate-900 dark:text-slate-100 tracking-tighter">{trx.amount}</span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">{trx.method}</span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{trx.date.split(' ')[0]}</span>
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{trx.date.split(' ').slice(1).join(' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10 align-middle">
                        <Badge className={cn("px-3 py-1.5 rounded-lg border-none text-[9px] font-black uppercase tracking-widest inline-flex items-center shadow-sm", getStatusStyle(trx.status))}>
                          {getStatusIcon(trx.status)}
                          {trx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <AlertCircle size={48} strokeWidth={1} />
                          <span className="text-[11px] font-black uppercase tracking-[0.4em]">No Transactions Found</span>
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
