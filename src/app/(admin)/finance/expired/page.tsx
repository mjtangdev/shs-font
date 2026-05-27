"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Download, Info, Clock, MapPin, ChevronDown, ChevronRight, Loader2,
  Users, Home, Building2, RefreshCcw, UserX, Phone, Mail,
  ExternalLink, Calendar, ZapOff
} from "lucide-react";
import { useRouter } from "next/navigation";
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

  return (
    <div className="w-full select-none">
      <div onClick={() => onSelect(isSelected ? null : node.id)} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer group mb-1", isSelected ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : isRoot ? "bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-100 dark:hover:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400")} style={{ paddingLeft: `${depth * 16 + 12}px` }}>
        <div onClick={(e) => { if (isRoot) return; e.stopPropagation(); setIsOpen(!isOpen); }} className={cn("w-4 h-4 flex items-center justify-center rounded transition-colors", !isRoot && "hover:bg-black/5 dark:hover:bg-white/10")}>
          {hasChildren && !isRoot && (isOpen ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />)}
          {isRoot && <div className="w-1 h-3.5 bg-amber-500/20 rounded-full mr-1" /> }
        </div>
        {node.level === 0 ? <Building2 className="h-3.5 w-3.5" /> : node.level === 1 ? <MapPin className="h-3 w-3" /> : <Home className="h-3 w-3" />}
        <span className={cn("text-sm truncate flex-1 tracking-tight", isRoot ? "text-base font-black uppercase" : "font-semibold")}>{node.name}</span>
      </div>
      {hasChildren && (isRoot || isOpen) && (
        <div className="relative my-0.5">
          {node.children.map((child: RegionData) => <RegionNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

export default function ExpiredCustomersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingRegions, setFetchingRegions] = useState(true);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalCount, setTotal] = useState(0);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('expired_only', 'true');
      if (selectedRegionId) params.append('region_id', selectedRegionId.toString());

      const response = await apiClient.get(`/customer/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Inactive_Customers_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export successful");
    } catch (err) {
      toast.error("Export failed");
    }
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

  const fetchExpiredCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/customer/', {
        params: {
          expired_only: true,
          region_id: selectedRegionId || undefined,
          search: searchQuery || undefined,
          limit: 100
        }
      });
      setCustomers(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error("Failed to fetch account status");
    } finally {
      setLoading(false);
    }
  }, [selectedRegionId, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchExpiredCustomers, 300);
    return () => clearTimeout(timer);
  }, [fetchExpiredCustomers]);

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">

      {/* Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 gap-8">
        <div className="flex items-center gap-8 flex-1">
          <Breadcrumbs items={[{ label: 'finance', href: '/finance' }, { label: 'inactive accounts' }]} />
          <div className="relative max-w-md w-full flex items-center h-11 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl group transition-all ring-offset-white focus-within:ring-2 focus-within:ring-amber-500/20">
            <Search className="text-slate-400 group-focus-within:text-amber-500 transition-colors mr-2 shrink-0" size={14} />
            <input
              type="text" placeholder="SEARCH INACTIVE ACCOUNTS..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleExport} variant="outline" className="rounded-xl h-10 px-5 font-black uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none dark:border-slate-800 dark:text-slate-300 transition-all active:scale-95">
            <Download className="h-4 w-4 mr-2" /> Export Inactive List
          </Button>
          <Badge className="bg-amber-500 text-slate-950 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/10">
            <ZapOff size={14} className="mr-2" /> {totalCount} Inactive Accounts
          </Badge>
          <Button onClick={fetchExpiredCustomers} variant="outline" className="rounded-xl h-10 px-5 font-black uppercase text-[10px] tracking-widest dark:border-slate-800">
             <RefreshCcw className="h-4 w-4 mr-2" /> Sync
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className="relative z-10 w-80 border-r border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl p-5 flex flex-col gap-6 shrink-0 shadow-sm transition-colors">
          <div className="space-y-4">
            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Status by Region</h3>
            <ScrollArea className="h-[calc(100vh-280px)] pr-2">
              {fetchingRegions ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-20"><Loader2 className="animate-spin" /></div>
              ) : (
                regions.map(node => (
                  <RegionNode key={node.id} node={node} selectedId={selectedRegionId} onSelect={setSelectedRegionId} />
                ))
              )}
            </ScrollArea>
          </div>
        </aside>

        {/* Main Table */}
        <main className="flex-1 overflow-y-auto p-10 bg-slate-50/50 dark:bg-transparent transition-colors">
           <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

             {/* Info Alert */}
             <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 shrink-0 shadow-lg shadow-amber-500/20">
                   <Info size={24} />
                </div>
                <div className="space-y-1">
                   <h4 className="font-black uppercase italic tracking-tight text-amber-600 dark:text-amber-400">System Status Overview</h4>
                   <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tighter">
                     The following accounts have depleted their prepaid balance. Services are currently suspended and will automatically resume upon the next successful recharge. This list is for informational purposes to track deployment activity.
                   </p>
                </div>
             </div>

             <Card className="border-none shadow-sm dark:shadow-none rounded-[32px] overflow-hidden bg-white dark:bg-slate-900/60 transition-colors">
                <Table>
                  <TableHeader className="bg-transparent border-b border-slate-100 dark:border-white/5 transition-colors">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="py-6 px-10 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Customer / Location</TableHead>
                      <TableHead className="font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Contact</TableHead>
                      <TableHead className="font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Service Status</TableHead>
                      <TableHead className="font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Lifetime Activity</TableHead>
                      <TableHead className="text-right pr-10 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">View Profile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                    {customers.map((cust) => {
                      const expDate = cust.expiry_time ? new Date(cust.expiry_time.replace(' ', 'T')) : null;
                      const now = new Date();

                      // 精确计算过期的毫秒差
                      const diffMs = now.getTime() - (expDate?.getTime() || 0);
                      const daysAgo = Math.floor(diffMs / (1000 * 3600 * 24));

                      return (
                        <TableRow key={cust.id} className="group hover:bg-slate-100/50 dark:hover:bg-white/[0.05] transition-colors border-none even:bg-slate-50/50 dark:even:bg-white/[0.02]">
                          <TableCell className="py-6 px-10 align-middle">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-inner">
                                  <UserX size={18} />
                               </div>
                               <div className="flex flex-col gap-0.5">
                                 <span className="font-black italic text-slate-900 dark:text-slate-100 text-[16px] uppercase tracking-tight leading-tight group-hover:text-amber-500 transition-colors">{cust.first_name} {cust.last_name}</span>
                                 <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><MapPin size={10} /> {cust.region_name}</span>
                               </div>
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest"><Phone size={10} className="text-slate-400" /> {cust.mobile}</div>
                                {cust.email && <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest italic"><Mail size={10} /> {cust.email}</div>}
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col">
                                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none font-black text-[9px] uppercase w-fit mb-1">
                                   {daysAgo <= 0 ? "Expired Today" : `${daysAgo} Days Since Expiry`}
                                </Badge>
                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Clock size={10} /> {cust.expiry_time}</span>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col">
                                <span className="text-[14px] font-black italic text-slate-900 dark:text-slate-100 tracking-tighter">₱{Number(cust.total_recharged_amount || 0).toLocaleString()}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{cust.total_recharged_days} Days Served</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right pr-10">
                             <Button
                               onClick={() => router.push(`/customers/${cust.id}`)}
                               variant="ghost"
                               className="h-10 w-10 p-0 rounded-full hover:bg-amber-500 hover:text-slate-950 transition-all shadow-sm group-hover:scale-110 active:scale-90"
                             >
                                <ExternalLink size={18} />
                             </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {customers.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-32 text-center opacity-20 flex flex-col items-center gap-4">
                           <RefreshCcw size={48} />
                           <span className="text-[11px] font-black uppercase tracking-[0.4em]">All Accounts are Active</span>
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
