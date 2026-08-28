'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Building2, MapPin, UserCircle2, 
  CheckCircle2, Loader2, ChevronRight, ChevronDown
} from 'lucide-react';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";
import Breadcrumbs from '@/components/Breadcrumbs';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface RegionNode {
  id: number;
  name: string;
  level: number;
  children: RegionNode[];
  is_occupied: boolean;
}

export default function EditEntityPage() {
  const router = useRouter();
  const params = useParams();
  const entityId = params.id;

  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  useEffect(() => {
    if (entityId) {
      const fetchEntityData = async () => {
        setLoading(true);
        try {
          const res = await apiClient.get(`/org/entities/${entityId}`);
          if (res.data) {
            setFormData({
              name: res.data.name || '',
              entity_type: res.data.entity_type || 1,
              address: res.data.address || '',
              region_id: res.data.region_id || 0,
              region_name: res.data.region_name || '',
            });
          }
        } catch (err) {
          toast.error("Failed to load entity parameters");
        } finally {
          setLoading(false);
        }
      };
      fetchEntityData();
    }
  }, [entityId]);

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Entity name is required");
    if (!formData.address.trim()) return toast.error("Installation address is required");

    setLoading(true);
    try {
      await apiClient.patch(`/org/entities/${entityId}`, {
        name: formData.name,
        entity_type: formData.entity_type,
        address: formData.address,
        region_id: formData.region_id || null
      });
      toast.success("Entity configuration updated");
      router.push('/settings/branches');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const renderTreeRows = (nodes: RegionNode[], parentName: string | null = null): ReactNode => {
    return nodes.map(node => {
      const isExpanded = expandedIds.includes(node.id);
      const hasChildren = node.children && node.children.length > 0;
      if (node.level === 0) return renderTreeRows(node.children, node.name);
      const isSelected = formData.region_id === node.id;

      return (
        <div key={node.id} className="select-none min-w-0 w-full">
          <div 
            onClick={() => {
              if (!node.is_occupied || node.id === formData.region_id) {
                setFormData({
                  ...formData, 
                  region_id: node.id, 
                  region_name: node.level === 1 ? node.name : `${parentName} > ${node.name}`
                });
                setIsDialogOpen(false);
              }
            }}
            className={cn(
              "flex items-start justify-between px-6 py-5 rounded-xl transition-all mb-1 border-2 border-transparent cursor-pointer min-w-0 w-full box-border",
              isSelected ? "bg-primary/10 border-primary" : "hover:bg-slate-50 border-slate-50"
            )}
            style={{ paddingLeft: `${(node.level - 1) * 24 + 24}px` }}
          >
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-6 flex justify-center shrink-0 mt-1">
                {node.level === 1 && hasChildren && (
                  <button 
                    type="button"
                    onClick={(e) => toggleExpand(node.id, e)} 
                    className="text-slate-400 p-1 hover:bg-slate-200 rounded-lg"
                  >
                    {isExpanded ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
                  </button>
                )}
              </div>
              <span className={cn(
                "text-[18px] font-bold tracking-tight break-all whitespace-normal min-w-0 flex-1 leading-snug",
                (node.is_occupied && node.id !== formData.region_id) ? 'text-slate-200' : 'text-slate-900',
                isSelected && "text-primary"
              )}>
                {node.name}
              </span>
            </div>
            {isSelected && <CheckCircle2 size={26} className="text-primary animate-in zoom-in shrink-0 ml-2 mt-0.5" />}
          </div>
          {hasChildren && isExpanded && renderTreeRows(node.children, node.name)}
        </div>
      );
    });
  };

  return (
    <div className="py-8 px-6 md:px-[60px] max-w-[800px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      <Breadcrumbs
        items={[
          { label: 'branches', href: '/settings/branches' },
          { label: `Edit` } 
        ]}
      />

      <div className="space-y-10">
        <header>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Update Entity</h1>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-4">Modifying configuration for node: {entityId}</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit h-fit">
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
        </header>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="grid grid-cols-1 gap-10">
            <div className="group space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-primary transition-colors">
                <Building2 size={14} /> Entity Name
              </label>
              <input 
                required
                className="w-full bg-transparent border-b-2 border-slate-100 py-4 text-xl font-black uppercase italic tracking-tight outline-none focus:border-primary transition-all text-slate-900 dark:text-slate-100"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="group space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} /> Assigned Region
              </label>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button type="button" className="w-full bg-transparent border-b-2 border-slate-100 py-4 flex items-center justify-between group hover:border-slate-400 focus:border-primary transition-all text-left">
                    <span className={cn("text-xl font-black uppercase italic tracking-tight", formData.region_id ? "text-slate-900" : "text-slate-300")}>
                      {formData.region_name || "Assign regional node..."}
                    </span>
                    <ChevronDown size={24} className="text-slate-300 group-hover:text-slate-900" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[750px] w-[92vw] p-0 border-none rounded-xl shadow-2xl overflow-hidden bg-white dark:bg-slate-900/60 outline-none">
                  <DialogHeader className="p-10 bg-white dark:bg-slate-900/60 border-b border-slate-50">
                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Select Region</DialogTitle>
                    <DialogDescription className="hidden">Selection of organizational nodes</DialogDescription>
                  </DialogHeader>
                  <div className="h-[400px] overflow-y-auto px-4 py-6 bg-white dark:bg-slate-900/60">
                    {fetchingRegions ? <Loader2 className="animate-spin text-primary mx-auto mt-20" /> : <div className="space-y-1">{renderTreeRows(regions)}</div>}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="group space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} /> Installation Address
              </label>
              <input 
                required
                className="w-full bg-transparent border-b-2 border-slate-100 py-3 text-sm font-bold uppercase tracking-widest outline-none focus:border-primary transition-all text-slate-900 dark:text-slate-100"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-8 flex items-center gap-6">
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center gap-3 px-12 h-[64px] bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-primary hover:text-slate-950 transition-all active:scale-95 shadow-2xl disabled:opacity-50"
            >
              {loading ? <Loader2 size={20} className="animate-spin text-primary" /> : <>Confirm Updates <CheckCircle2 size={18} /></>}
            </button>

            <button 
              type="button"
              onClick={() => router.back()}
              className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-red-500 transition-colors"
            >
              Cancel Operation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}