'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Loader2, ArrowUp,
  Package, CheckCircle2,
  AlertTriangle, MapPin, FileDown,
  RefreshCcw, CreditCard,
  ChevronDown, ChevronRight, ChevronLeft, Home, Users, Pencil, Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { ScrollArea } from "@/components/ui/scroll-area";

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
  customer_id?: number;
  customer_name?: string;
  customer_uuid?: string;
  city_name?: string;
  town_name?: string;
  created_at: string;
  bound_at?: string;
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
  const isMunicipality = node.level === 0;
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  const getIcon = () => {
    if (isMunicipality) return <Building2 size={14} className={cn("shrink-0 mt-0.5", isSelected ? "text-white" : "text-primary")} />;
    if (node.level === 1) return <MapPin size={12} className={cn("shrink-0 mt-0.5", isSelected ? "text-white" : "text-slate-400")} />;
    return <Home size={12} className={cn("shrink-0 mt-0.5", isSelected ? "text-white" : "text-slate-400")} />;
  };

  return (
    <div className="w-full min-w-0 select-none">
      <div
        onClick={() => onSelect(isSelected ? null : node.id)}
        className={cn(
          "flex items-start gap-2 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer group mb-1 w-full min-w-0 box-border",
          isSelected
            ? "bg-primary text-white shadow-md shadow-primary/20"
            : isMunicipality
              ? "bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <div
          onClick={(e) => {
            if (isMunicipality) return;
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={cn(
            "w-4 h-4 flex items-center justify-center rounded transition-colors shrink-0 mt-0.5",
            !isMunicipality && "hover:bg-black/5 dark:hover:bg-white/10"
          )}
        >
          {hasChildren && !isMunicipality && (isOpen ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />)}
          {isMunicipality && <div className="w-1 h-3.5 bg-primary/20 rounded-full mr-1 shrink-0" />}
        </div>
        {getIcon()}
        <span
          className={cn(
            "text-[11px] break-all whitespace-normal min-w-0 flex-1 tracking-tight leading-snug",
            isMunicipality ? "font-black uppercase" : "font-semibold",
            isSelected ? "text-white" : "text-slate-700 dark:text-slate-300"
          )}
        >
          {node.name}
        </span>
      </div>
      {hasChildren && (isMunicipality || isOpen) && (
        <div className="relative my-0.5">
          {node.children.map((child) => (
            <RegionNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// Fixed recursive onSelect call
const setSelectedId = (id: number | null) => {}; // This was missing in the template, but handled via closure in Solar page

import { Building2 } from 'lucide-react';

export default function CardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(localStorage.getItem("user_role"));
  }, []);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Back to Top logic
  const mainRef = React.useRef<HTMLDivElement>(null);
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
  const [pageSize, setPageSize] = useState(20);

  const fetchRegions = useCallback(async () => {
    try {
      const res = await apiClient.get("/org/regions/tree");
      const data = res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      setRegions(data);
    } catch {
      toast.error("Failed to load regions");
    }
  }, []);

  const fetchCards = useCallback(async () => {
    setIsListLoading(true);
    try {
      const res = await apiClient.get('/card/', {
        params: {
          region_id: selectedRegionId || undefined,
          search: searchQuery || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          skip: (currentPage - 1) * pageSize,
          limit: pageSize,
        }
      });
      setCards(res.data.items || []);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error(err);
      toast.error("ASSET SYNC ERROR: Card registry inaccessible.");
    } finally {
      setIsListLoading(false);
      setLoading(false);
    }
  }, [selectedRegionId, statusFilter, searchQuery, currentPage, pageSize]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('query', searchQuery);
      if (selectedRegionId) params.append('region_id', selectedRegionId.toString());

      const response = await apiClient.get(`/card/export?${params.toString()}`, {
        responseType: 'blob', 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `shs-iccard_${date}.xlsx`);
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

  useEffect(() => { fetchRegions(); }, [fetchRegions]);
  useEffect(() => { fetchCards(); }, [fetchCards]);

  // Handle SSE data refresh
  useEffect(() => {
    const handleRefresh = (e: any) => {
      if (e.detail?.event === 'CARD_REGISTERED') {
        fetchCards();
      }
    };
    window.addEventListener('shs-data-refresh', handleRefresh as EventListener);
    return () => window.removeEventListener('shs-data-refresh', handleRefresh as EventListener);
  }, [fetchCards]);

  // Reset to page 1 when filter, search, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRegionId, statusFilter, searchQuery, pageSize]);

  const handleDelete = async (cardId: number, cardNo: string) => {
    if (!confirm(`Are you sure you want to remove card #${cardNo}?`)) return;
    try {
      await apiClient.delete(`/card/${cardId}`);
      toast.success("Card removed from registry");
      fetchCards();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Delete failed. Active cards cannot be removed.");
    }
  };

  const filteredCards = cards || [];

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-slate-50 dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors gap-8">
        <div className="flex items-center gap-8 flex-1">
          <div className="flex items-center gap-4">
            <Breadcrumbs items={[{ label: "ic card assets" }]} />
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest animate-in fade-in zoom-in duration-500">
              {totalCount} Total
            </Badge>
          </div>
          <div className="relative max-w-md w-full flex items-center h-11 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-slate-400 group-focus-within:text-primary transition-colors mr-2 shrink-0" size={14} />
            <input 
              type="text" placeholder="SEARCH BY CARD NO. OR UUID..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            {isListLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400 shrink-0" />}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} disabled={isExporting} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none dark:border-slate-800 dark:text-slate-300">
            {isExporting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <FileDown className="h-4 w-4 mr-2" />} Export
          </Button>
          <Button variant="outline" onClick={fetchCards} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none dark:border-slate-800 dark:text-slate-300">
            <RefreshCcw className={cn("h-4 w-4 mr-2", isListLoading && "animate-spin")} /> Refresh
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
        <aside className={cn(
          "relative z-10 border-r border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col shrink-0 shadow-sm transition-all duration-300",
          isSidebarCollapsed ? "w-16" : "w-80"
        )}>
          {/* Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center z-30 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={12} className="dark:text-slate-400" /> : <ChevronLeft size={12} className="dark:text-slate-400" />}
          </button>

          {!isSidebarCollapsed ? (
            <ScrollArea className="h-full w-full">
              <div className="p-5 space-y-6">
                {/* Status Filter Section */}
                <div className="space-y-2">
                  <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Status Filter</h3>
                  <button onClick={() => setStatusFilter('all')} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-4 text-sm font-bold border", statusFilter === 'all' ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xl scale-[1.02]" : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50")}><CreditCard className="h-4 w-4" /><span>Full Registry</span></button>
                  {[0, 1, 3].map((sId) => (
                    <button key={sId} onClick={() => setStatusFilter(sId.toString())} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold border mb-1", statusFilter === sId.toString() ? "bg-primary text-white border-transparent" : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50")}>
                      {STATUS_MAP[sId].label}
                    </button>
                  ))}
                </div>

                {statusFilter === '1' && (
                  <>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Regional Filter</h3>
                      <button
                        onClick={() => setSelectedRegionId(null)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold border mb-2",
                          selectedRegionId === null ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700" : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400"
                        )}
                      >
                        <Users className="h-4 w-4" /><span>Global View</span>
                      </button>

                      {regions.map((node) => (
                        <RegionNode key={node.id} node={node} selectedId={selectedRegionId} onSelect={setSelectedRegionId} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center pt-10 gap-6">
              <CreditCard className={cn("cursor-pointer hover:text-primary transition-colors", statusFilter === 'all' ? "text-primary" : "text-slate-400")} onClick={() => {setStatusFilter('all'); setIsSidebarCollapsed(false);}} size={20} />
              <CheckCircle2 className={cn("cursor-pointer hover:text-primary transition-colors", statusFilter === '1' ? "text-primary" : "text-slate-400")} onClick={() => {setStatusFilter('1'); setIsSidebarCollapsed(false);}} size={20} />
              <Package className={cn("cursor-pointer hover:text-primary transition-colors", statusFilter === '0' ? "text-primary" : "text-slate-400")} onClick={() => {setStatusFilter('0'); setIsSidebarCollapsed(false);}} size={20} />
              {statusFilter === '1' && (
                <MapPin className={cn("cursor-pointer hover:text-primary transition-colors animate-in zoom-in duration-300", selectedRegionId !== null ? "text-primary" : "text-slate-400")} onClick={() => setIsSidebarCollapsed(false)} size={20} />
              )}
            </div>
          )}
        </aside>

        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="relative z-10 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10"
        >
          <div className="max-w-[1920px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-none shadow-sm dark:shadow-none rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 transition-colors">
                <Table>
                  <TableHeader className="bg-transparent border-b border-slate-100 dark:border-slate-800 transition-colors">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="w-[5%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">#</TableHead>
                      <TableHead className="w-[30%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Physical Identity</TableHead>
                      <TableHead className="w-[27%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Ownership / Customer</TableHead>
                      <TableHead className="w-[20%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Protocol Dates</TableHead>
                      <TableHead className="w-[10%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Type</TableHead>
                      <TableHead className="w-[8%] text-right pr-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-[400px] text-center">
                            <div className="flex flex-col items-center justify-center gap-4 text-slate-300 italic">
                              <Loader2 className="animate-spin text-primary" size={40} />
                              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Scanning RFID Registry...</span>
                            </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-[400px] text-center opacity-30">
                            <div className="flex flex-col items-center justify-center gap-4">
                              <CreditCard size={48} strokeWidth={1} className="dark:text-slate-400" />
                              <span className="text-[11px] font-black uppercase tracking-[0.4em] dark:text-slate-400">No Cards Found</span>
                            </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredCards.map((card, idx) => (
                      <TableRow key={card.id} className="group hover:bg-slate-100/80 dark:hover:bg-white/[0.08] transition-colors border-none even:bg-slate-50 dark:even:bg-white/[0.03]">
                        <TableCell className="py-7 px-8 text-center align-middle font-black italic text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell className="px-8 align-middle">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-black uppercase italic tracking-tighter text-[15px] leading-tight text-primary dark:text-primary group-hover:brightness-110 transition-colors">UUID: {card.card_uuid}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">Card No: {card.card_number}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle">
                          {card.customer_id ? (
                            <Link
                                href={`/customers/${card.customer_id}`}
                                className="group/cust flex flex-col gap-0.5 hover:opacity-80 transition-opacity"
                            >
                              <div className="text-[15px] font-black uppercase italic tracking-tighter text-slate-900 dark:text-white group-hover/cust:text-primary transition-colors leading-tight">
                                 {card.customer_name}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[8px] font-bold text-slate-400/60 uppercase">Cust ID: {card.customer_uuid}</span>
                              <div className="flex flex-col items-start gap-0.5 mt-1">
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase italic leading-none">
                                   <MapPin size={10} /> {card.city_name}
                                </div>
                                <div className="text-[8px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-widest pl-4 leading-none">
                                   {card.town_name}
                                </div>
                              </div>
                              </div>
                            </Link>
                          ) : (
                            <Badge variant="outline" className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest italic border-slate-100 dark:border-slate-800 px-3 py-1">Available in Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-8 text-center align-middle">
                          <div className="inline-flex flex-col gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 italic leading-none">
                            <div className="flex items-center justify-center gap-2">IN: {card.created_at?.replace('T', ' ').slice(0, 13)}:00</div>
                            {card.bound_at && <div className="flex items-center justify-center gap-2 text-primary font-bold underline underline-offset-2">OUT: {card.bound_at.replace('T', ' ').slice(0, 13)}:00</div>}
                          </div>
                        </TableCell>
                        <TableCell className="py-7 px-8 text-center align-middle">
                          <div className={cn("inline-flex p-3 rounded-xl border transition-all",
                             card.status === 1 ? "bg-primary/5 border-primary/20 text-primary" : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400")}>
                            {STATUS_MAP[card.status]?.icon || <CreditCard size={18} />}
                          </div>
                        </TableCell>
                        <TableCell className="py-7 px-8 pr-8 text-right align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/devices/card/edit/${card.id}`)}
                              className="text-slate-300 dark:text-slate-600 hover:text-primary rounded-lg h-9 w-9"
                              title="Edit Card"
                            >
                              <Pencil size={16} />
                            </Button>
                            {(userRole === "1" || userRole === "3") && card.status !== 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(card.id, card.card_number)}
                                className="text-slate-300 dark:text-slate-600 hover:text-red-500 rounded-lg h-9 w-9"
                                title="Delete Card"
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
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

                      {Math.ceil(totalCount / pageSize) > 5 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

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
