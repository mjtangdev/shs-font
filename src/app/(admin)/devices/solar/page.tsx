'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Loader2,
  Package, CheckCircle2, 
  AlertTriangle, MapPin, FileDown,
  Zap, Lock, Unlock, Building2, Layers,
  RefreshCcw, ChevronDown, ChevronRight, ChevronLeft, Home, Users
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

interface SolarDeviceRecord {
  id: number;
  shs_machine_id: string;
  solar_equipment_id: string;
  radio_id: string;
  flashlight_id: string;
  led_light_id: string;
  status: number;
  customer_id?: number;
  customer_name: string;
  customer_uuid?: string;
  city_name: string;
  town_name: string;
  production_date: string;
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
    if (isMunicipality) return <Building2 className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-primary")} />;
    if (node.level === 1) return <MapPin className={cn("h-3 w-3", isSelected ? "text-white" : "text-slate-400")} />;
    return <Home className={cn("h-3 w-3", isSelected ? "text-white" : "text-slate-400")} />;
  };

  return (
    <div className="w-full select-none">
      <div
        onClick={() => onSelect(isSelected ? null : node.id)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer group mb-1",
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
            "w-4 h-4 flex items-center justify-center rounded transition-colors",
            !isMunicipality && "hover:bg-black/5 dark:hover:bg-white/10"
          )}
        >
          {hasChildren && !isMunicipality && (isOpen ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />)}
          {isMunicipality && <div className="w-1 h-3.5 bg-primary/20 rounded-full mr-1" />}
        </div>
        {getIcon()}
        <span
          className={cn(
            "text-[11px] truncate flex-1 tracking-tight",
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

export default function SolarUnitPage() {
  const [loading, setLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [units, setUnits] = useState<SolarDeviceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const fetchRegions = useCallback(async () => {
    try {
      const res = await apiClient.get("/org/regions/tree");
      const data = res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      setRegions(data);
    } catch {
      toast.error("Failed to load regions");
    }
  }, []);

  const fetchUnits = useCallback(async () => {
    setIsListLoading(true);
    try {
      const res = await apiClient.get('/solar_device/', {
        params: {
          region_id: selectedRegionId || undefined,
          search: searchQuery || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter
        }
      });
      const data = res.data.items || (Array.isArray(res.data) ? res.data : []);
      setUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("SYSTEM SYNC ERROR: Solar registry inaccessible.");
    } finally {
      setIsListLoading(false);
      setLoading(false);
    }
  }, [selectedRegionId, statusFilter, searchQuery]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('query', searchQuery);
      if (selectedRegionId) params.append('region_id', selectedRegionId.toString());

      const response = await apiClient.get(`/solar_device/export?${params.toString()}`, {
        responseType: 'blob', 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `shs-solar-unit_${date}.csv`);
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
  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  // Handle Dev Alert
  const handleDevAlert = () => {
    toast.info("Feature in development", {
      description: "Module undergoing calibration. Please wait for the next update.",
      className: "font-bold text-[12px] tracking-tight",
    });
  };

  const filteredUnits = units || [];

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-slate-50 dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors gap-8">
        <div className="flex items-center gap-8 flex-1">
          <Breadcrumbs items={[{ label: "solar assets" }]} />
          <div className="relative max-w-md w-full flex items-center h-11 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-slate-400 group-focus-within:text-primary transition-colors mr-2 shrink-0" size={14} />
            <input 
              type="text" placeholder="SEARCH BY MACHINE ID OR CUSTOMER..." value={searchQuery}
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
          <Button variant="outline" onClick={fetchUnits} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none dark:border-slate-800 dark:text-slate-300">
            <RefreshCcw className={cn("h-4 w-4 mr-2", isListLoading && "animate-spin")} /> Refresh
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
            <ScrollArea className="flex-1 p-5">
              <div className="space-y-6">
                {/* Status Filter Section */}
                <div className="space-y-2">
                  <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Status Protocol</h3>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold border",
                      statusFilter === 'all' ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xl scale-[1.02]" : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <Layers className="h-4 w-4" /><span>Full Registry</span>
                  </button>
                  {[0, 1, 3].map((sId) => (
                    <button
                      key={sId}
                      onClick={() => setStatusFilter(sId.toString())}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold border",
                        statusFilter === sId.toString() ? "bg-primary text-white border-transparent shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50"
                      )}
                    >
                      {STATUS_MAP[sId].icon}
                      <span>{STATUS_MAP[sId].label}</span>
                    </button>
                  ))}
                </div>

                {statusFilter === '1' && (
                  <>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />

                    {/* Regional Filter Section - Focused on Deployment */}
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
              <Layers className={cn("cursor-pointer hover:text-primary transition-colors", statusFilter === 'all' ? "text-primary" : "text-slate-400")} onClick={() => {setStatusFilter('all'); setIsSidebarCollapsed(false);}} size={20} />
              <CheckCircle2 className={cn("cursor-pointer hover:text-primary transition-colors", statusFilter === '1' ? "text-primary" : "text-slate-400")} onClick={() => {setStatusFilter('1'); setIsSidebarCollapsed(false);}} size={20} />
              <Package className={cn("cursor-pointer hover:text-primary transition-colors", statusFilter === '0' ? "text-primary" : "text-slate-400")} onClick={() => {setStatusFilter('0'); setIsSidebarCollapsed(false);}} size={20} />
              {statusFilter === '1' && (
                <MapPin className={cn("cursor-pointer hover:text-primary transition-colors animate-in zoom-in duration-300", selectedRegionId !== null ? "text-primary" : "text-slate-400")} onClick={() => setIsSidebarCollapsed(false)} size={20} />
              )}
            </div>
          )}
        </aside>

        <main className="relative z-10 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10">
          <div className="max-w-[1920px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-none shadow-sm dark:shadow-none rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 transition-colors">
                <Table className="table-fixed">
                  <TableHeader className="bg-transparent border-b border-slate-100 dark:border-slate-800 transition-colors">
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
                    ) : filteredUnits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-[400px] text-center opacity-30">
                              <div className="flex flex-col items-center justify-center gap-4">
                                <Layers size={48} strokeWidth={1} className="dark:text-slate-400" />
                                <span className="text-[11px] font-black uppercase tracking-[0.4em] dark:text-slate-400">No Assets Found</span>
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
                            {unit.customer_id ? (
                                <Link
                                  href={`/customers/${unit.customer_id}`}
                                  className="group/cust flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
                                >
                                    <div className="flex items-center gap-2 text-[11px] font-black uppercase italic text-slate-900 dark:text-white group-hover/cust:text-primary transition-colors">
                                       <Building2 size={13} className="text-primary" />
                                       {unit.customer_name}
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover/cust:text-primary/70 transition-colors">
                                        ID: {unit.customer_uuid}
                                    </span>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-2 text-[11px] font-black uppercase italic text-slate-300 dark:text-slate-700">
                                   <Building2 size={13} />
                                   Unassigned
                                </div>
                            )}
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
                          {unit.production_date?.split(' ')[0]}
                        </TableCell>
                        <TableCell className="py-8 px-8 pr-8 text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="text-slate-300 dark:text-slate-600 hover:text-primary rounded-lg h-9 w-9"><MapPin size={16} /></Button>
                              <Button variant="ghost" size="icon" className="text-slate-300 dark:text-slate-600 hover:text-red-500 rounded-lg h-9 w-9"><Lock size={16} /></Button>
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
