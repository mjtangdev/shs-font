'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutGrid, List, Plus, Search, 
  Building2, MapPin, Edit2,
  Loader2, Info, RefreshCcw
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Entity {
  id: number;
  name: string;
  address: string;
  region_name: string;
  entity_type: number;
  device_count?: number; 
}

export default function SubsidiariesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [providerForm, setProviderForm] = useState({
    name: "",
    tin: "",
    phone: "",
    email: "",
    address: "",
  });
  const [compLogoPreview, setCompLogoPreview] = useState<string | null>(null);

  const fetchProvider = useCallback(async () => {
    try {
      const res = await apiClient.get('/provider/');
      if (res.data) {
        setProviderForm({
          name: res.data.name || "",
          tin: res.data.tin || "",
          phone: res.data.phone || "",
          email: res.data.email || "",
          address: res.data.address || "",
        });
        if (res.data.logo_url) {
          const baseUrl = (apiClient.defaults.baseURL || window.location.origin).split('/api')[0]?.replace(/\/$/, '') || '';
          const path = res.data.logo_url.startsWith('/') ? res.data.logo_url : `/${res.data.logo_url}`;
          setCompLogoPreview(`${baseUrl}${path}`);
        }
      }
    } catch (err) {
      console.error("Load Provider Error:", err);
    }
  }, []);

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/org/entities/');
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setEntities(data);
    } catch (err) {
      toast.error("Failed to sync entity ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();
    fetchProvider();
  }, []);

  const filteredEntities = entities.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.region_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors gap-8">
        <div className="flex items-center gap-8 flex-1">
          <Breadcrumbs items={[{ label: 'branches & agents' }]} />
          <div className="relative max-w-md w-full flex items-center h-11 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="text-slate-400 group-focus-within:text-primary transition-colors mr-2 shrink-0" size={14} />
            <input
              type="text" placeholder="SEARCH BRANCHES OR REGIONS..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none text-slate-950 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchEntities} disabled={loading} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none transition-all active:scale-95">
            <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh
          </Button>
          <Link href="/settings/branches/create" passHref>
            <Button asChild className="rounded-xl h-10 px-6 font-bold shadow-sm dark:shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest">
              <span><Plus className="h-4 w-4 mr-2" /> Register New</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="relative z-10 w-80 border-r border-slate-200 dark:border-slate-800/50 bg-white/90 dark:bg-slate-950/50 backdrop-blur-xl p-5 flex flex-col gap-6 shrink-0 shadow-sm transition-colors">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">View Preference</h3>
              <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-white/5 h-12">
                <button onClick={() => setViewMode('grid')} className={cn("flex-1 rounded-lg transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest", viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600')}>
                  <LayoutGrid size={16} /> Grid
                </button>
                <button onClick={() => setViewMode('table')} className={cn("flex-1 rounded-lg transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest", viewMode === 'table' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600')}>
                  <List size={16} /> Table
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-4 italic">Quick Overview</h3>
                <Card className="bg-primary/5 border-none p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Total Entities</span>
                        <span className="text-xl font-black italic text-primary">{entities.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Coverage</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Multi-Region</span>
                    </div>
                </Card>
            </div>
          </div>
        </aside>

        <main className="relative z-10 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10">
          <div className="max-w-[1920px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Provider Info Stripe */}
            <Card className="flex flex-col md:flex-row items-center justify-between gap-6 px-8 py-6 bg-white dark:bg-slate-900/60 border-none rounded-2xl shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                    {compLogoPreview ? (
                      <img src={compLogoPreview} alt="Organization Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    )}
                  </div>
                  <div className="space-y-1 text-left">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100 leading-none">
                      {providerForm.name || "UNNAMED ORGANIZATION"}
                    </h2>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                      <span className="flex items-center gap-1.5"><Info size={12} className="text-primary" /> TIN: {providerForm.tin || "---"}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-primary" /> {providerForm.address || "No Address Set"}</span>
                    </div>
                  </div>
                </div>

                <Link href="/settings/branches/edit-company" passHref>
                  <Button variant="outline" className="px-6 h-11 border-slate-200 dark:border-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none active:scale-95">
                    <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                </Link>
            </Card>

            {loading ? (
              <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-slate-300">
                <Loader2 className="animate-spin text-primary" size={40} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing Entity Ledger...</span>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredEntities.map((sub) => (
                  <Card
                    key={sub.id}
                    onClick={() => router.push(`/settings/branches/edit/${sub.id}`)}
                    className="bg-white dark:bg-slate-900/60 rounded-2xl p-8 border-none shadow-sm dark:shadow-none hover:-translate-y-1 transition-all duration-500 relative flex flex-col min-h-[300px] cursor-pointer group"
                  >
                    <div className="absolute top-6 right-6">
                      <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-full text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-white/5">
                        {sub.entity_type === 1 ? 'Subsidiary' : 'Agent'}
                      </span>
                    </div>
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center mb-6 shadow-inner text-slate-400 dark:text-slate-600 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <Building2 size={28} />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">{sub.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wide line-clamp-2">{sub.address}</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 space-y-4">
                      <div className="flex items-center gap-3 text-slate-900 dark:text-slate-300">
                        <MapPin size={12} className="text-primary" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none italic">{sub.region_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">Asset Count</span>
                          <span className="text-2xl font-black italic text-slate-900 dark:text-white tabular-nums tracking-tighter">{sub.device_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Online</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm border-none overflow-hidden">
                <Table>
                  <TableHeader className="bg-transparent border-b border-slate-100 dark:border-white/5">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="px-8 py-4 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 leading-none align-middle">Entity Identifier</TableHead>
                      <TableHead className="px-8 py-4 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 leading-none align-middle text-center">Regional Path</TableHead>
                      <TableHead className="px-8 py-4 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 leading-none align-middle text-center">Category</TableHead>
                      <TableHead className="px-8 py-4 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 leading-none align-middle text-center">Status</TableHead>
                      <TableHead className="text-right pr-12 py-4 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 leading-none align-middle">Ops</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredEntities.map((sub) => (
                      <TableRow key={sub.id} className="group hover:bg-slate-100/80 dark:hover:bg-white/[0.08] transition-colors border-none even:bg-slate-50 dark:even:bg-white/[0.03]">
                        <TableCell className="py-5 px-8 flex items-center gap-5 align-middle">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white font-black italic text-lg shadow-lg shrink-0 group-hover:bg-primary transition-colors">{sub.name.charAt(0)}</div>
                          <div className="flex flex-col">
                             <span className="font-black uppercase italic tracking-tighter text-slate-900 dark:text-white text-[15px] leading-tight group-hover:text-primary transition-colors">{sub.name}</span>
                             <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[200px]">{sub.address}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 font-black text-slate-500 dark:text-slate-400 text-[11px] uppercase italic tracking-widest align-middle text-center opacity-80">{sub.region_name}</TableCell>
                        <TableCell className="px-8 align-middle text-center">
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 border-slate-100 dark:border-white/5">
                            {sub.entity_type === 1 ? 'Subsidiary' : 'Agent'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-center">
                          <div className="flex items-center gap-2 justify-center">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">Active</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-8 pr-12 text-right align-middle">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/settings/branches/edit/${sub.id}`)}
                            className="w-9 h-9 rounded-lg text-slate-300 dark:text-slate-600 hover:text-primary hover:bg-primary/10 transition-all"
                          >
                            <Edit2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
