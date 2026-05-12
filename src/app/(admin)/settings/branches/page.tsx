'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // 引入 useRouter
import { 
  LayoutGrid, List, Plus, Search, 
  Building2, MapPin, Edit2, Home, 
  ChevronRight as BreadcrumbSeparator,
  Loader2, Info
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import Breadcrumbs from '@/components/Breadcrumbs'; // 根据你的实际路径修改
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Entity {
  id: number;
  name: string;
  address: string;
  region_name: string;
  entity_type: number;
  device_count?: number; 
}

export default function SubsidiariesPage() {
  const router = useRouter(); // 初始化 useRouter
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- 公司信息管理状态 ---
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
    <div className="py-8 px-6 md:px-[60px] max-w-[1920px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-1000 ease-out">
      
      {/* 1. Breadcrumbs */}
      <Breadcrumbs 
          items={[
            { label: 'branches' } 
          ]}

        />

      {/* --- 简洁的公司基础信息展示条 --- */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-10 py-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] animate-in fade-in slide-in-from-top-2 duration-700">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
            {compLogoPreview ? (
              <img src={compLogoPreview} alt="Organization Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-slate-200" />
            )}
          </div>
          <div className="space-y-1 text-left">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              {providerForm.name || "UNNAMED ORGANIZATION"}
            </h2>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Info size={10} className="text-slate-300" /> TIN: {providerForm.tin || "---"}</span>
              <span className="flex items-center gap-1.5"><MapPin size={10} className="text-slate-300" /> {providerForm.address || "No Address Set"}</span>
              <span className="flex items-center gap-1.5"><Edit2 size={10} className="text-slate-300" /> {providerForm.phone || "No Phone"}</span>
            </div>
          </div>
        </div>
        
        <Link href="/settings/branches/edit-company">
          <Button 
            variant="outline"
            className="px-8 h-14 border-slate-200 text-slate-900 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
          >
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* 2. Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative w-full md:w-[400px] group">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900" size={18} />
          <input 
            type="text"
            placeholder="SEARCH REGIONS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-200 focus:border-yellow-400 text-[11px] font-bold uppercase tracking-[0.2em] outline-none transition-all text-slate-900"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setViewMode('grid')} className={cn("p-2.5 rounded-lg transition-all", viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400')}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('table')} className={cn("p-2.5 rounded-lg transition-all", viewMode === 'table' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400')}>
              <List size={18} />
            </button>
          </div>

          <Link href="/settings/branches/create">
            <button className="flex items-center gap-3 px-8 h-[54px] bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-yellow-400 hover:text-slate-900 transition-all shadow-xl active:scale-95 cursor-pointer">
              <Plus size={18} /> Register New
            </button>
          </Link>
        </div>
      </div>

      {/* 3. Content */}
      {loading ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-slate-300">
          <Loader2 className="animate-spin text-yellow-400" size={40} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing Entity Registry...</span>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
          {filteredEntities.map((sub) => (
            <div 
              key={sub.id} 
              onClick={() => router.push(`/settings/branches/edit/${sub.id}`)} // 使用动态路由路径
              className="bg-white rounded-xl p-10 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative flex flex-col min-h-[380px] cursor-pointer"
            >
              <div className="absolute top-8 right-8">
                <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-full text-slate-400 border border-slate-100">
                  {sub.entity_type === 1 ? 'Subsidiary' : 'Agent'}
                </span>
              </div>
              <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mb-8 shadow-inner text-slate-900">
                <Building2 size={28} />
              </div>
              <div className="flex-grow">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">{sub.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide line-clamp-2">{sub.address}</p>
              </div>
              <div className="mt-10 pt-8 border-t border-slate-50 space-y-6">
                <div className="flex items-center gap-2 text-slate-900">
                  <MapPin size={12} className="text-yellow-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none italic">{sub.region_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Systems Active</span>
                    <span className="text-2xl font-black italic text-slate-900 tabular-nums">{sub.device_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Online</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 px-8">Entity Identifier</th>
                <th className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-8">Regional Path</th>
                <th className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-8">Category</th>
                <th className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-8">Status</th>
                <th className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-8">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEntities.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/30 transition-all">
                  <td className="py-8 px-8 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black italic text-lg shadow-lg">{sub.name.charAt(0)}</div>
                    <div className="flex flex-col">
                       <span className="font-black uppercase italic tracking-tighter text-slate-900 text-lg">{sub.name}</span>
                       <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter truncate max-w-[200px]">{sub.address}</span>
                    </div>
                  </td>
                  <td className="px-8 font-black text-slate-500 text-[11px] uppercase italic tracking-widest">{sub.region_name}</td>
                  <td className="px-8 font-black text-slate-400 text-[10px] uppercase">{sub.entity_type === 1 ? 'Subsidiary' : 'Agent'}</td>
                  <td className="px-8">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Active</span>
                    </div>
                  </td>
                  <td className="py-8 px-8 text-right">
                    {/* 点击编辑按钮触发弹窗 */}
                    <button
                      onClick={() => router.push(`/settings/branches/edit/${sub.id}`)} // 使用动态路由路径
                      className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}