'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutGrid, List, UserPlus, Search, 
  UserCircle2, Building2, Edit2,
  Loader2, Construction, Wallet, Shield,
  Mail, Phone, Users, ChevronDown, ChevronRight, MapPin, Home,
  RefreshCcw, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import Breadcrumbs from "@/components/Breadcrumbs";

const ROLE_MAP: Record<number, { label: string, color: string, activeColor: string, icon: React.ReactNode, badgeVariant: string }> = {
  1: { 
    label: 'ADMIN', 
    color: 'text-slate-400',
    activeColor: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900',
    icon: <UserCircle2 size={14} />,
    badgeVariant: "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
  },
  2: { 
    label: 'OPERATOR',
    color: 'text-slate-400',
    activeColor: 'bg-primary text-slate-950',
    icon: <Shield size={14} />,
    badgeVariant: "bg-primary/10 text-primary border-primary/20"
  },
  3: {
    label: 'FINANCE',
    color: 'text-slate-400',
    activeColor: 'bg-emerald-500 text-white',
    icon: <Wallet size={14} />,
    badgeVariant: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  }
};

interface UserRecord {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  role: number;
  position?: string;
  is_active: boolean;
  entity_name?: string;
  region_id?: number;
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
    if (isRoot) return <Building2 className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-primary")} />;
    if (node.level === 1) return <MapPin className={cn("h-3 w-3", isSelected ? "text-white" : "text-slate-400")} />;
    return <Home className={cn("h-3 w-3", isSelected ? "text-white" : "text-slate-400")} />;
  };

  return (
    <div className="w-full select-none">
      <div
        onClick={() => onSelect(isSelected ? null : node.id)}
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group mb-1",
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
            "w-4 h-4 flex items-center justify-center rounded transition-colors",
            !isRoot && "hover:bg-black/5 dark:hover:bg-white/10"
          )}
        >
          {hasChildren && !isRoot && (isOpen ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />)}
          {isRoot && <div className="w-1 h-3.5 bg-primary/20 rounded-full mr-1" />}
        </div>
        {getIcon()}
        <span className={cn("text-sm truncate flex-1 tracking-tight", isRoot ? "text-base font-black uppercase" : "font-semibold", isSelected ? "text-white" : "text-slate-700 dark:text-slate-300")}>
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

export default function UsersPage() {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showDevModal, setShowDevModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/user/');
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setUsers(data);
    } catch (err) {
      toast.error("DATA SYNC ERROR: Registry access denied.");
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
    fetchUsers();
    fetchRegions();
  }, [fetchRegions]);

  const filteredUsers = users.filter(u => {
    const searchStr = searchQuery.toLowerCase();
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const matchesSearch = (u.username || '').toLowerCase().includes(searchStr) || fullName.includes(searchStr);

    let matchesRole = true;
    if (roleFilter === 'management') {
      matchesRole = u.role === 1;
    } else if (roleFilter !== 'all') {
      matchesRole = u.role.toString() === roleFilter;
    }

    // Region filtering is usually handled on backend, but if we have region_id on user:
    // const matchesRegion = !selectedRegionId || u.region_id === selectedRegionId;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors gap-8">
        <div className="flex items-center gap-8 flex-1 min-w-0">
          <Breadcrumbs items={[{ label: "team members" }]} />

          <div className="flex items-center gap-4 flex-1 max-w-2xl">
              {/* Search Box */}
              <div className="relative flex-1 flex items-center h-11 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl group focus-within:ring-2 focus-within:ring-primary/20 transition-all min-w-[200px]">
                <Search className="text-slate-400 group-focus-within:text-primary transition-colors mr-2 shrink-0" size={14} />
                <input
                  type="text" placeholder="SEARCH TEAM..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none text-slate-950 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>

              {/* Role Filters in Header */}
              <div className="flex items-center h-11 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shrink-0">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={cn(
                    "px-4 h-full rounded-lg transition-all text-[9px] font-black uppercase tracking-widest",
                    roleFilter === 'all' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >ALL</button>
                <button
                  onClick={() => setRoleFilter('management')}
                  className={cn(
                    "flex items-center gap-2 px-4 h-full rounded-lg transition-all text-[9px] font-black uppercase tracking-widest",
                    roleFilter === 'management' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Briefcase size={12} /> MGMT
                </button>
                {[2, 3].map(rId => (
                   <button
                    key={rId}
                    onClick={() => setRoleFilter(rId.toString())}
                    className={cn(
                      "px-4 h-full rounded-lg transition-all text-[9px] font-black uppercase tracking-widest",
                      roleFilter === rId.toString() ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >{ROLE_MAP[rId].label.slice(0, 4)}</button>
                ))}
              </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center h-10 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <button onClick={() => setViewMode('table')} className={cn("w-10 h-full rounded-lg transition-all flex items-center justify-center", viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400')}>
              <List size={16} />
            </button>
            <button onClick={() => setViewMode('grid')} className={cn("w-10 h-full rounded-lg transition-all flex items-center justify-center", viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400')}>
              <LayoutGrid size={16} />
            </button>
          </div>
          <Button variant="outline" onClick={fetchUsers} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm dark:shadow-none"><RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync</Button>
          <Link href="/users/create" passHref>
            <Button asChild className="rounded-xl h-10 px-6 font-bold shadow-sm dark:shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest">
              <span><UserPlus className="h-4 w-4 mr-2" /> New Member</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Main Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar: Region Filter */}
        <aside className="relative z-10 w-80 border-r border-slate-200 dark:border-slate-800/50 bg-white/90 dark:bg-slate-950/50 backdrop-blur-xl p-5 flex flex-col gap-4 shrink-0 shadow-sm transition-colors">
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-3">
              <h3 className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-2">Regional Assignment</h3>
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

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10">
          <div className="max-w-[1920px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {loading ? (
              <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-slate-300">
                <Loader2 className="animate-spin text-primary" size={40} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synching Directory...</span>
              </div>
            ) : viewMode === 'table' ? (
              <Card className="border-none shadow-sm dark:shadow-none rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 transition-colors">
                <Table className="table-fixed">
                  <TableHeader className="bg-transparent border-b border-slate-100 dark:border-white/5 transition-colors">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="w-[25%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">User Identity</TableHead>
                      <TableHead className="w-[25%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Contact</TableHead>
                      <TableHead className="w-[25%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Assignment & Role</TableHead>
                      <TableHead className="w-[15%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Auth Status</TableHead>
                      <TableHead className="w-[10%] text-right pr-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-colors border-none even:bg-slate-50 dark:even:bg-white/[0.03]">
                        <TableCell className="py-5 px-8 align-middle">
                          <div className="flex flex-col gap-0.5">
                             <span className="font-black uppercase italic tracking-tighter text-slate-900 dark:text-white text-[15px] leading-tight group-hover:text-primary transition-colors">
                               {(user.first_name || '')} {(user.last_name || '')}
                             </span>
                             <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                               @{user.username}
                             </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-center">
                          <div className="flex flex-col gap-1 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-tight items-center">
                            <div className="flex items-center gap-1.5 opacity-80"><Mail size={10} /> {user.email || 'N/A'}</div>
                            <div className="flex items-center gap-1.5 opacity-80"><Phone size={10} /> {user.mobile}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-center">
                          <div className="flex flex-col gap-2 items-center">
                             <Badge className={cn("w-fit px-3 py-1 rounded-full font-black text-[8px] uppercase border-none", ROLE_MAP[user.role]?.badgeVariant)}>
                              {ROLE_MAP[user.role]?.label || 'OPERATOR'}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-900 dark:text-slate-300 uppercase italic tracking-tighter">
                              <Building2 size={11} className="text-primary" />
                              {user.entity_name || 'CENTRAL SYSTEM'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 align-middle text-center">
                          <Badge variant="outline" className={cn("px-4 py-1 rounded-full font-black text-[9px] uppercase border-2 mx-auto", user.is_active ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" : "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20")}>
                             {user.is_active ? 'Authorized' : 'Suspended'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8 align-middle">
                          <Button variant="ghost" size="icon" onClick={() => setShowDevModal(true)} className="text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all">
                            <Edit2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                {filteredUsers.map((user) => (
                  <Card key={user.id} onClick={() => setShowDevModal(true)} className="group bg-white dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:border-slate-700 hover:-translate-y-1 transition-all duration-500 relative flex flex-col min-h-[280px] cursor-pointer">
                    <div className="absolute top-6 right-6">
                       <Badge className={cn("px-3 py-1 rounded-full font-black text-[8px] uppercase border-none", ROLE_MAP[user.role]?.badgeVariant)}>
                        {ROLE_MAP[user.role]?.label}
                      </Badge>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-6 shadow-inner text-slate-900 dark:text-white group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <UserCircle2 size={24} />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors">
                        {(user.first_name || '')} {(user.last_name || '')}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">@{user.username}</p>
                    </div>
                    <div className="mt-6 pt-5 border-t border-slate-50 dark:border-slate-800/50 space-y-3">
                      <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                        <Building2 size={12} className="text-primary" />
                        <span className="text-[8px] font-black uppercase tracking-widest italic">{user.entity_name || 'CENTRAL'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className={cn("text-[8px] font-black uppercase tracking-widest", user.is_active ? "text-green-600" : "text-red-400")}>
                          {user.is_active ? 'Active' : 'Restricted'}
                        </div>
                        <Edit2 size={12} className="text-slate-100 dark:text-slate-800 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <Dialog open={showDevModal} onOpenChange={setShowDevModal}>
        <DialogContent className="max-w-[400px] rounded-2xl border-none bg-white dark:bg-slate-900/60 p-0 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="h-2 bg-primary" />
          <div className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white ring-8 ring-slate-50/50 dark:ring-slate-800/50">
              <Construction size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100 leading-none">Protocol Restricted</h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">
                Modification logic is currently locked <br/> for secure deployment phase.
              </p>
            </div>
            <button onClick={() => setShowDevModal(false)} className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary dark:hover:bg-primary hover:text-slate-950 transition-all active:scale-95 shadow-xl dark:shadow-none">
              Confirm Awareness
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
