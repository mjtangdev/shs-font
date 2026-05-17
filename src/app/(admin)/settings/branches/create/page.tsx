'use client';

import React, { useState, useEffect, ReactNode } from 'react'; // 1. 引入 ReactNode
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Loader2, ChevronRight, 
  Building2, UserCircle2, ChevronDown, Globe
} from 'lucide-react';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, // 2. 补全 Description
} from "@/components/ui/dialog";

import Breadcrumbs from '@/components/Breadcrumbs';

interface RegionNode {
  id: number;
  name: string;
  level: number;
  children: RegionNode[];
  is_occupied: boolean;
}

export default function CreateEntityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [fetchingRegions, setFetchingRegions] = useState(true);
  const [regions, setRegions] = useState<RegionNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    entity_type: 1, 
    address: '',
    region_id: 0,
    region_name: '', 
  });

  useEffect(() => {
    const fetchRegionData = async () => {
      try {
        const res = await apiClient.get('/org/regions/tree');
        const data = res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
        setRegions(data);
        if (data.length > 0) setExpandedIds([data[0].id]);
      } catch (err) {
        toast.error("Failed to sync regional data");
      } finally {
        setFetchingRegions(false);
      }
    };
    fetchRegionData();
  }, []);

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      entity_type: 1, 
      address: '',
      region_id: 0,
      region_name: '', 
    });
  };

  const handleEntitySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) return toast.error("Entity name is required");
    if (!formData.address.trim()) return toast.error("Installation address is required");

    setLoading(true);
    try {
      await apiClient.post('/org/entities/', {
        name: formData.name,
        entity_type: formData.entity_type,
        address: formData.address,
        region_id: formData.region_id || null // 如果为 0，则发送 null 以支持可选地区
      });
      setIsSuccessDialogOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 修复点：显式声明返回类型为 ReactNode
   * 解决 Docker Buildx 模拟环境下的类型推断死循环问题
   */
  const renderTreeRows = (nodes: RegionNode[], parentName: string | null = null): ReactNode => {
    return nodes.map(node => {
      const isExpanded = expandedIds.includes(node.id);
      const hasChildren = node.children && node.children.length > 0;
      if (node.level === 0) return renderTreeRows(node.children, node.name);
      const isSelected = formData.region_id === node.id;

      return (
        <div key={node.id} className="select-none">
          <div 
            onClick={() => {
              if (!node.is_occupied) {
                setFormData({
                  ...formData, 
                  region_id: node.id, 
                  region_name: node.level === 1 ? node.name : `${parentName} > ${node.name}`
                });
                setIsDialogOpen(false);
              }
            }}
            className={cn(
              "flex items-center justify-between px-6 py-5 rounded-xl transition-all mb-1 border-2 border-transparent cursor-pointer",
              isSelected ? "bg-yellow-50 border-yellow-400" : "hover:bg-slate-50 border-slate-50"
            )}
            style={{ marginLeft: `${(node.level - 1) * 20}px` }}
          >
            <div className="flex items-center gap-5 flex-1">
              <div className="w-8 flex justify-center">
                {node.level === 1 && hasChildren && (
                  <button 
                    type="button"
                    onClick={(e) => toggleExpand(node.id, e)} 
                    className="text-slate-400 p-2 hover:bg-slate-200 rounded-lg"
                  >
                    {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                  </button>
                )}
              </div>
              <span className={cn(
                "text-[18px] font-bold tracking-tight",
                node.is_occupied ? 'text-slate-200' : 'text-slate-900',
                isSelected && "text-yellow-600"
              )}>
                {node.name}
              </span>
            </div>
            {isSelected && <CheckCircle2 size={26} className="text-yellow-500 animate-in zoom-in" />}
          </div>
          {hasChildren && isExpanded && renderTreeRows(node.children, node.name)}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-6 tracking-tighter">
      <div className="max-w-[750px] mx-auto space-y-6">
        
        <Breadcrumbs
          items={[
            { label: 'branches', href: '/settings/branches' },
            { label: 'Create branches' } 
          ]}
        />

        <div className="bg-white dark:bg-slate-900/60 rounded-xl p-10 md:p-14 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-50 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-200 text-slate-900">
                <Building2 size={24} />
              </div>
              <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Entity Registration</h2>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
              {[
                { id: 1, label: 'Subsidiary', icon: Building2 },
                { id: 2, label: 'Agent', icon: UserCircle2 }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({...formData, entity_type: t.id})}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                    formData.entity_type === t.id ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-500'
                  )}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleEntitySubmit} className="space-y-10">
            <div className="space-y-3">
              <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Entity Name</label>
              <input required className="w-full h-16 px-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-lg transition-all text-foreground" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Assigned Region</label>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button type="button" className="w-full h-16 px-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl flex items-center justify-between group hover:border-slate-400 focus:border-yellow-400 transition-all text-left">
                    <span className={cn("text-lg font-bold", formData.region_id ? "text-slate-900" : "text-slate-300 italic")}>
                      {formData.region_name || "Assign regional node..."}
                    </span>
                    <ChevronDown size={24} className="text-slate-300 group-hover:text-slate-900" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[520px] w-[95vw] p-0 border-none rounded-xl shadow-2xl overflow-hidden bg-white dark:bg-slate-900/60 outline-none">
                  <DialogHeader className="p-10 bg-white dark:bg-slate-900/60 border-b border-slate-50">
                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Select Region</DialogTitle>
                    <DialogDescription className="hidden">Selection of organizational nodes</DialogDescription>
                  </DialogHeader>
                  <div className="h-[400px] overflow-y-auto px-4 py-6 bg-white dark:bg-slate-900/60">
                    {fetchingRegions ? <Loader2 className="animate-spin text-yellow-400 mx-auto mt-20" /> : <div className="space-y-1">{renderTreeRows(regions)}</div>}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Physical Address</label>
              <input required className="w-full h-16 px-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-lg transition-all text-foreground" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>

            <button type="submit" disabled={loading} className="w-full h-20 bg-yellow-400 text-slate-900 rounded-xl font-black uppercase text-lg shadow-xl shadow-yellow-400/20 active:scale-[0.98] hover:bg-yellow-500 transition-all flex items-center justify-center gap-4 mt-6 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={24} /> : <>Authorize Registration <CheckCircle2 size={24} /></>}
            </button>
          </form>
        </div>
      </div>

      {/* --- 注册成功提示弹窗 --- */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="max-w-[420px] rounded-xl border-none bg-white dark:bg-slate-900/60 p-0 shadow-2xl overflow-hidden">
          <div className="h-2 bg-green-500" />
          <div className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <CheckCircle2 size={40} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Registration Success</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] leading-relaxed">
                The {formData.entity_type === 1 ? 'subsidiary' : 'agent'} has been successfully authorized. <br/>
                Would you like to register another entity?
              </p>
            </div>

            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={() => {
                  setIsSuccessDialogOpen(false);
                  resetForm();
                }}
                className="w-full h-14 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-yellow-400 hover:text-slate-900 transition-all active:scale-95"
              >
                Register Another
              </button>
              <button 
                onClick={() => router.push('/settings/branches')}
                className="w-full h-14 bg-slate-50 text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
              >
                Back to Ledger
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}