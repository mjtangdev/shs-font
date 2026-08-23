"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  Search, Download, Wallet, TrendingUp, AlertCircle, 
  ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, XCircle,
  MapPin, Calendar as CalendarIcon, ChevronDown, ChevronRight, ChevronLeft, Loader2,
  Users, Home, Building2, RefreshCcw, Copy, ArrowUp
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface RegionData {
  id: number;
  name: string;
  level: number;
  children: RegionData[];
  is_occupied: boolean;
}

// --- [INDUSTRIAL CALENDAR PICKER] ---
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function IndustrialCalendarPicker({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'calendar' | 'years'>('calendar');

  const now = useMemo(() => (value ? new Date(value) : new Date()), [value]);
  const [currentViewDate, setCurrentViewDate] = useState(now);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const arr = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      arr.push({ day: prevMonthDays - i, current: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - arr.length;
    for (let i = 1; i <= remaining; i++) {
      arr.push({ day: i, current: false, date: new Date(year, month + 1, i) });
    }
    return arr;
  }, [year, month]);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 50 }, (_, i) => (current + 5) - i);
  }, []);

  const handleSelect = (date: Date) => {
    const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setOpen(false);
  };

  const getDisplayValue = (val: string) => {
    if (!val) return placeholder;
    const d = new Date(val);
    return `${MONTHS_EN[d.getMonth()].substring(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="h-8 min-w-[130px] bg-slate-50 dark:bg-slate-950 px-3 rounded-lg border border-slate-100 dark:border-white/5 flex items-center justify-between gap-2 hover:border-primary transition-all outline-none">
          <span className={cn("text-[10px] font-black uppercase tracking-tight", value ? "text-slate-900 dark:text-slate-100" : "text-slate-400")}>
            {getDisplayValue(value)}
          </span>
          <CalendarIcon size={12} className={cn(value ? "text-primary" : "text-slate-400")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 bg-white dark:bg-slate-950 border-none shadow-2xl rounded-[24px] overflow-hidden w-[300px] z-50" align="start">
        <div className="bg-slate-900 p-4 border-b border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setView(view === 'years' ? 'calendar' : 'years')} className="text-[12px] font-black uppercase tracking-widest text-white hover:text-primary flex items-center gap-1 transition-colors">
              {year} <ChevronDown size={12} className={cn("transition-transform", view === 'years' && "rotate-180")} />
            </button>
            <div className="flex items-center gap-1">
               <button type="button" onClick={() => setCurrentViewDate(new Date(year, month - 1))} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-all"><ChevronLeft size={14} /></button>
               <button type="button" onClick={() => setCurrentViewDate(new Date(year, month + 1))} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-all"><ChevronRight size={14} /></button>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
             {MONTHS_EN.map((m, idx) => (
               <button key={m} type="button" onClick={() => { setCurrentViewDate(new Date(year, idx)); setView('calendar'); }} className={cn("px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all shrink-0", month === idx ? "bg-primary text-slate-950" : "bg-white/5 text-slate-500 hover:text-white")}>
                 {m.substring(0, 3)}
               </button>
             ))}
          </div>
        </div>
        <div className="p-3 relative min-h-[260px]">
          {view === 'calendar' ? (
            <div className="animate-in fade-in zoom-in-95 duration-200">
               <div className="grid grid-cols-7 mb-1">
                 {DAYS_EN.map(d => <div key={d} className="text-center text-[8px] font-black text-slate-500 uppercase py-1">{d}</div>)}
               </div>
               <div className="grid grid-cols-7 gap-0.5">
                 {calendarDays.map((d, idx) => {
                   const isSelected = value && new Date(value).toDateString() === d.date.toDateString();
                   const isToday = new Date().toDateString() === d.date.toDateString();
                   return (
                     <button key={idx} type="button" onClick={() => handleSelect(d.date)} className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all", !d.current ? "text-slate-800 pointer-events-none opacity-10" : "text-slate-400 hover:bg-primary hover:text-slate-950", isSelected && "bg-primary text-slate-950 shadow-lg", isToday && !isSelected && "border border-primary/30 text-primary")}>
                       {d.day}
                     </button>
                   );
                 })}
               </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-slate-950 z-20 p-2 animate-in slide-in-from-top duration-300">
              <ScrollArea className="h-[240px]">
                <div className="grid grid-cols-3 gap-1 p-1">
                  {years.map(y => (
                    <button key={y} type="button" onClick={() => { setCurrentViewDate(new Date(y, month)); setView('calendar'); }} className={cn("py-2 rounded-lg text-[10px] font-black transition-all", year === y ? "bg-primary text-slate-950" : "bg-white/5 text-slate-500 hover:text-white")}>{y}</button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
  const [quickFilter, setQuickFilter] = useState<string>("ALL");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchingRegions, setFetchingRegions] = useState(true);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_amount: 0, total_days: 0, transaction_count: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [isSummaryExporting, setIsSummaryExporting] = useState(false);

  // Back to Top logic
  const mainRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowScrollTop(scrollTop > 400);
  };

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20); // 默认改为 20

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleQuickFilter = (type: string) => {
    setQuickFilter(type);
    const now = new Date();
    let start = "";
    let end = formatDate(now);

    if (type === 'TODAY') {
      start = end;
    } else if (type === 'WEEK') {
      const day = now.getDay(); // 0 is Sun, 1 is Mon...
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      const monday = new Date(now.setDate(diff));
      start = formatDate(monday);
      end = formatDate(new Date()); // Reset end to today because now.setDate modified the object
    } else if (type === 'MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      start = formatDate(firstDay);
    } else if (type === 'ALL') {
      start = "";
      end = "";
    }

    setStartDate(start);
    setEndDate(end);
  };

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

  const fetchFinanceData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        region_id: selectedRegionId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: searchQuery || undefined,
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
      };

      const [txRes, sumRes] = await Promise.all([
        apiClient.get('/finance/transactions', { params }),
        apiClient.get('/finance/summary', { params })
      ]);

      setTransactions(txRes.data.items || []);
      setTotalCount(txRes.data.total || 0);
      setSummary(sumRes.data);
    } catch (err) {
      toast.error("Failed to sync financial ledger");
    } finally {
      setLoading(false);
    }
  }, [selectedRegionId, startDate, endDate, searchQuery, currentPage, pageSize]);

  useEffect(() => {
    const timer = setTimeout(fetchFinanceData, 300);
    return () => clearTimeout(timer);
  }, [fetchFinanceData]);

  // Handle SSE data refresh
  useEffect(() => {
    const handleRefresh = (e: any) => {
      if (e.detail?.event === 'POS_RECHARGE_UPLOADED' || e.detail?.event === 'POS_DATA_SYNCED') {
        fetchFinanceData();
      }
    };
    window.addEventListener('shs-data-refresh', handleRefresh as EventListener);
    return () => window.removeEventListener('shs-data-refresh', handleRefresh as EventListener);
  }, [fetchFinanceData]);

  // Reset to page 1 when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRegionId, searchQuery, startDate, endDate, quickFilter, pageSize]);

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Generating financial report...");
    try {
      const params = new URLSearchParams();
      if (selectedRegionId) params.append('region_id', selectedRegionId.toString());
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (searchQuery) params.append('search', searchQuery);

      const response = await apiClient.get(`/finance/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `SHS_Finance_Report_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to generate report", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSummary = async () => {
    setIsSummaryExporting(true);
    const toastId = toast.loading("Generating customer financial summary...");
    try {
      const params = new URLSearchParams();
      if (selectedRegionId) params.append('region_id', selectedRegionId.toString());

      const response = await apiClient.get(`/finance/export-customer-summary?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Customer_Financial_Summary_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Summary report downloaded successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to generate summary report", { id: toastId });
    } finally {
      setIsSummaryExporting(false);
    }
  };

  const getStatusIcon = (action: string) => {
    if (action === 'RECHARGE') return <CheckCircle2 size={12} className="mr-1" />;
    return <Clock size={12} className="mr-1" />;
  };

  const getStatusStyle = (action: string) => {
    if (action === 'RECHARGE') return "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400";
    return "bg-primary/10 text-primary";
  };

  const stats = [
    { label: "Total Revenue", value: `₱ ${summary.total_amount.toLocaleString()}`, trend: "Real-time", isPositive: true, color: "text-primary" },
    { label: "Total Days Sold", value: `${summary.total_days.toLocaleString()} Days`, trend: "Lifetime", isPositive: true, color: "text-green-500" },
    { label: "Transaction Volume", value: summary.transaction_count.toString(), trend: "Sync OK", isPositive: true, color: "text-primary" }
  ];

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-slate-50 dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors gap-8">
        <div className="flex items-center gap-8 flex-1">
          <Breadcrumbs items={[{ label: 'finance' }]} />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportSummary}
            disabled={isSummaryExporting}
            className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none dark:border-slate-800 dark:text-slate-300 transition-all active:scale-95"
          >
            {isSummaryExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
            Financial Summary
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none dark:border-slate-800 dark:text-slate-300 transition-all active:scale-95"
          >
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Transactions
          </Button>
          <Button
            variant="outline"
            onClick={fetchFinanceData}
            disabled={loading}
            className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none dark:border-slate-800 dark:text-slate-300 transition-all active:scale-95"
          >
            <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh
          </Button>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="relative z-10 w-80 border-r border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl shrink-0 shadow-sm transition-colors">
          <ScrollArea className="h-full">
            <div className="p-5 space-y-6">
              {/* Regional Filter */}
              <div className="space-y-2">
                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Regional Ledger</h3>
                <button
                  onClick={() => setSelectedRegionId(null)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold border",
                    selectedRegionId === null
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xl scale-[1.02]"
                      : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50"
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span>All Regions</span>
                </button>

                <div className="space-y-1 mt-2">
                  {fetchingRegions ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
                    </div>
                  ) : (
                    regions.map(node => (
                      <RegionNode key={node.id} node={node} selectedId={selectedRegionId} onSelect={setSelectedRegionId} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="relative z-10 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10"
        >
          <div className="max-w-[1920px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Filter Controls Row (Sticky with glassmorphism) */}
            <div className="sticky top-0 z-30 flex flex-wrap items-center gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm mb-8 transition-all">
                {/* Quick Range */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-white/5">
                  {[
                    { id: 'ALL', label: 'All Time' },
                    { id: 'TODAY', label: 'Today' },
                    { id: 'WEEK', label: 'Week' },
                    { id: 'MONTH', label: 'Month' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => handleQuickFilter(f.id)}
                      className={cn(
                        "px-4 h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                        quickFilter === f.id
                          ? "bg-primary text-slate-950 shadow-sm"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block" />

                {/* Manual Range */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-50 dark:bg-slate-950 rounded-xl p-1 gap-1 border border-slate-100 dark:border-white/5">
                    <IndustrialCalendarPicker
                      value={startDate}
                      onChange={(val) => {
                        setStartDate(val);
                        setEndDate(val); // 自动同步结束日期，实现点击一次即选定一天
                        setQuickFilter("CUSTOM");
                      }}
                      placeholder="START DATE"
                    />
                    <span className="text-slate-300 dark:text-slate-700 text-xs mx-1">/</span>
                    <IndustrialCalendarPicker
                      value={endDate}
                      onChange={(val) => { setEndDate(val); setQuickFilter("CUSTOM"); }}
                      placeholder="END DATE"
                    />
                  </div>
                </div>

                <div className="relative max-w-[260px] w-full flex items-center h-10 px-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-white/5 group focus-within:ring-2 focus-within:ring-primary/20 transition-all ml-auto">
                  <Search className="text-slate-400 group-focus-within:text-primary transition-colors mr-2 shrink-0" size={12} />
                  <input
                    type="text" placeholder="SEARCH..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-full bg-transparent border-none text-[9px] font-black uppercase tracking-[0.2em] outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                  {loading && <Loader2 className="h-3 w-3 animate-spin text-primary/40 shrink-0 ml-2" />}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <Card key={i} className="bg-white dark:bg-slate-900/60 rounded-2xl p-6 border-none shadow-sm dark:shadow-none relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 cursor-default flex items-center gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                      <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-white/5 text-[8px] font-black tracking-tighter", stat.isPositive ? "text-green-500" : "text-red-500")}>
                        {stat.trend}
                      </div>
                    </div>
                    <h3 className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                      {stat.value}
                    </h3>
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
                    <TableHead className="w-[20%] font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">POS/Operator</TableHead>
                    <TableHead className="w-[15%] font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-right">Date & Time</TableHead>
                    <TableHead className="w-[15%] text-right pr-10 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                  {transactions.map((trx, idx) => (
                    <TableRow key={trx.transaction_id} className="group hover:bg-slate-100/80 dark:hover:bg-white/[0.08] transition-colors border-none even:bg-slate-50 dark:even:bg-white/[0.03]">
                      <TableCell className="py-6 px-10 align-middle">
                        <div className="flex flex-col gap-1">
                          <span className="font-black italic text-slate-900 dark:text-slate-100 text-[16px] uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{trx.customer_name}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest font-mono">
                               ID: {trx.transaction_id.length > 12 ? `${trx.transaction_id.slice(0, 6)}...${trx.transaction_id.slice(-6)}` : trx.transaction_id}
                             </span>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 navigator.clipboard.writeText(trx.transaction_id);
                                 toast.success("Transaction ID copied");
                               }}
                               className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all text-slate-400"
                             >
                               <Copy size={10} />
                             </button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex flex-col">
                           <span className="text-[18px] font-black italic text-slate-900 dark:text-slate-100 tracking-tighter">₱{Number(trx.amount || 0).toFixed(2)}</span>
                           <span className="text-[10px] font-bold text-slate-400">+{trx.days} Days</span>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">{trx.pos_sn}</span>
                            <span className="text-[9px] font-black text-slate-400 italic">@{trx.operator_username}</span>
                         </div>
                      </TableCell>
                      <TableCell className="align-middle px-8 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{trx.transaction_time?.replace('T', ' ').split(' ')[0]}</span>
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{trx.transaction_time?.replace('T', ' ').split(' ')[1]?.substring(0, 5)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10 align-middle">
                        <Badge className={cn("px-3 py-1.5 rounded-lg border-none text-[9px] font-black uppercase tracking-widest inline-flex items-center shadow-sm", getStatusStyle(trx.action_type))}>
                          {getStatusIcon(trx.action_type)}
                          {trx.action_type === 'RECHARGE' ? 'LOAD' : trx.action_type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && !loading && (
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

            {/* Pagination Controls */}
            {totalCount > 0 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2 py-8 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} records
                  </p>

                  {/* Page Size Selector */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/5">
                    {[20, 50, 100].map(size => (
                      <button
                        key={size}
                        onClick={() => setPageSize(size)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all",
                          pageSize === size
                            ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {totalCount > pageSize && (
                  <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); if(currentPage > 1) setCurrentPage(currentPage - 1); }}
                        className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }).map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === pageNum}
                            onClick={(e) => { e.preventDefault(); setCurrentPage(pageNum); }}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); if(currentPage < Math.ceil(totalCount / pageSize)) setCurrentPage(currentPage + 1); }}
                        className={cn(currentPage === Math.ceil(totalCount / pageSize) && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                )}
              </div>
            )}
          </div>

          {/* Back to Top Button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-10 right-10 z-50 w-12 h-12 rounded-2xl bg-primary/20 backdrop-blur-md text-primary border border-primary/20 shadow-xl flex items-center justify-center hover:bg-primary hover:text-slate-950 hover:scale-110 active:scale-95 transition-all animate-in fade-in zoom-in duration-300 group opacity-60 hover:opacity-100"
            >
              <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform" />
            </button>
          )}
        </main>
      </div>
    </div>
  );
}
