"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Download, Wallet, TrendingUp, AlertCircle, 
  ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, XCircle,
  MapPin, Calendar, ChevronDown, ChevronRight, Loader2,
  Users, Home, Building2
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

// --- 模拟数据 (Mock Data) ---
const MOCK_STATS = [
  { label: "Total Revenue", value: "₱ 2,450,000.00", trend: "+12.5%", isPositive: true, icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Monthly Recurring", value: "₱ 840,000.00", trend: "+5.2%", isPositive: true, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Pending Collections", value: "₱ 124,500.00", trend: "-2.4%", isPositive: false, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" }
];

const MOCK_TRANSACTIONS = [
  { id: "TRX-9982-A", customer: "Juan Dela Cruz", amount: "₱ 1,500.00", date: "2026-05-12 10:30 AM", status: "completed", method: "NFC Card" },
  { id: "TRX-9983-B", customer: "Maria Santos", amount: "₱ 2,100.00", date: "2026-05-12 09:15 AM", status: "pending", method: "Bank Transfer" },
  { id: "TRX-9984-C", customer: "Pedro Penduko", amount: "₱ 850.00", date: "2026-05-11 15:45 PM", status: "failed", method: "POS Terminal" },
  { id: "TRX-9985-D", customer: "Ana Reyes", amount: "₱ 3,200.00", date: "2026-05-11 11:20 AM", status: "completed", method: "NFC Card" },
  { id: "TRX-9986-E", customer: "Lito Lapid", amount: "₱ 1,500.00", date: "2026-05-10 14:10 PM", status: "completed", method: "Cash" },
  { id: "TRX-9987-F", customer: "Jose Rizal", amount: "₱ 4,500.00", date: "2026-05-09 08:00 AM", status: "completed", method: "NFC Card" },
];

// --- 左侧树节点组件 (与 Customers 同款) ---
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
    if (isRoot) return <Building2 className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-blue-600")} />;
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
  // --- 筛选状态 ---
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- 地区树状态 ---
  const [fetchingRegions, setFetchingRegions] = useState(true);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  // 获取地区树
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
    switch(status) {
      case 'completed': return <CheckCircle2 size={12} className="mr-1" />;
      case 'pending': return <Clock size={12} className="mr-1" />;
      case 'failed': return <XCircle size={12} className="mr-1" />;
      default: return null;
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'completed': return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case 'pending': return "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case 'failed': return "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400";
      default: return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    }
  };

  const filteredTransactions = MOCK_TRANSACTIONS.filter(trx => {
    const matchesSearch = trx.customer.toLowerCase().includes(searchQuery.toLowerCase()) || trx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || trx.status.toUpperCase() === statusFilter;
    
    let matchesDate = true;
    const trxDateStr = trx.date.split(' ')[0]; // extract yyyy-mm-dd
    if (startDate && trxDateStr < startDate) matchesDate = false;
    if (endDate && trxDateStr > endDate) matchesDate = false;
    
    // Region Filtering will be applied on actual backend fetching later
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="relative flex h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500">
      
      {/* 背景图层：暗黑模式下自带深色半透明背景，如果有图片也会被透出 */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#f8fafc] dark:bg-slate-950 dark:bg-[url('/images/dark-bg.jpg')] dark:bg-cover dark:bg-center dark:bg-no-repeat transition-colors duration-500" />
      
      {/* --- 左侧边栏 (地区筛选树) --- */}
      <aside className="relative z-10 w-80 border-r border-slate-200 dark:border-slate-800/50 bg-white/90 dark:bg-slate-950/50 backdrop-blur-xl p-5 flex flex-col gap-4 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-colors">
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-3">
            <button
              onClick={() => setSelectedRegionId(null)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-6 text-sm font-bold border",
                selectedRegionId === null 
                  ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200 dark:bg-white dark:text-slate-900 dark:border-white dark:shadow-none scale-[1.02]" 
                  : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50"
              )}
            >
              <Users className="h-4 w-4" />
              <span>All Regions</span>
            </button>
            {fetchingRegions ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Loading Tree</span>
              </div>
            ) : (
              regions.map(node => (
                <RegionNode key={node.id} node={node} selectedId={selectedRegionId} onSelect={setSelectedRegionId} />
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* --- 右侧主内容区 --- */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-10 transition-colors">
          <div className="flex items-center gap-4">
            <Breadcrumbs items={[{ label: 'finance' }]} />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 hover:bg-slate-50 dark:text-slate-200 uppercase text-[10px] tracking-widest shadow-sm transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </header>

        <div className="p-10 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-transparent transition-colors">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
          
            {/* Stats Grid - 缩小并保持水平分布 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {MOCK_STATS.map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-xl rounded-3xl p-5 border border-slate-100 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300 cursor-default flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500", stat.bg, stat.color)}>
                    <stat.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] truncate pr-2">{stat.label}</p>
                      <div className={cn("flex items-center gap-0.5 text-[10px] font-black tracking-tighter", stat.isPositive ? "text-green-500" : "text-red-500")}>
                        {stat.isPositive ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                        {stat.trend}
                      </div>
                    </div>
                    <h3 className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-slate-100 truncate">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Controls & Filters (Single Row) */}
            <div className="flex flex-col xl:flex-row items-center gap-2 bg-white dark:bg-slate-900/60 dark:backdrop-blur-xl p-2 rounded-[2rem] xl:rounded-full border border-slate-100 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none w-full transition-colors">
              
              {/* Search */}
              <div className="relative flex-1 w-full flex items-center h-14 px-5 bg-slate-50 dark:bg-slate-800/50 rounded-full group transition-all focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-yellow-400/50">
                <Search className="text-slate-400 group-focus-within:text-yellow-500 transition-colors mr-3 shrink-0" size={18} />
                <input 
                  type="text"
                  placeholder="SEARCH TRANSACTIONS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none text-slate-950 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Status */}
              <div className="relative w-full xl:w-auto flex items-center h-14 bg-slate-50 dark:bg-slate-800/50 rounded-full px-5 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-full pr-8 bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none cursor-pointer appearance-none"
                >
                  <option value="ALL">ALL STATUS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                </select>
                <ChevronDown size={14} className="absolute right-5 text-slate-400 pointer-events-none" />
              </div>

              {/* Time Range Filter */}
              <div className="flex w-full xl:w-auto items-center h-14 bg-slate-50 dark:bg-slate-800/50 rounded-full px-5 shrink-0 group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Calendar size={18} className="text-slate-400 mr-3 shrink-0 group-focus-within:text-yellow-500 transition-colors" />
                <div className="flex items-center flex-1 justify-center">
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch (err) {} }}
                    className="h-full w-[110px] bg-transparent border-none text-[10px] font-black text-slate-600 dark:text-slate-300 outline-none uppercase tracking-widest cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" 
                  />
                  <span className="text-slate-300 dark:text-slate-600 font-bold px-2">-</span>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch (err) {} }}
                    className="h-full w-[110px] bg-transparent border-none text-[10px] font-black text-slate-600 dark:text-slate-300 outline-none uppercase tracking-widest cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" 
                  />
                </div>
              </div>
            </div>

            {/* Transaction Table in Card */}
            <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] dark:shadow-none rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900/60 dark:backdrop-blur-xl transition-colors">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="py-6 px-10 font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Transaction Detail</TableHead>
                    <TableHead className="font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Amount</TableHead>
                    <TableHead className="font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Method</TableHead>
                    <TableHead className="font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Date & Time</TableHead>
                    <TableHead className="text-right pr-10 font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredTransactions.map((trx, idx) => (
                    <TableRow key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all border-none">
                      <TableCell className="py-7 px-10">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-black italic text-slate-900 dark:text-slate-100 text-lg uppercase tracking-tight leading-none">{trx.customer}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{trx.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xl font-black italic text-slate-900 dark:text-slate-100 tracking-tighter">{trx.amount}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">{trx.method}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{trx.date.split(' ')[0]}</span>
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{trx.date.split(' ').slice(1).join(' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <Badge className={cn("px-3 py-1.5 rounded-lg border-none text-[9px] font-black uppercase tracking-widest inline-flex items-center", getStatusStyle(trx.status))}>
                          {getStatusIcon(trx.status)}
                          {trx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredTransactions.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                  <AlertCircle className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">No Transactions Found</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}