'use client';

import React, { useState, useEffect, ReactNode } from 'react'; // 引入 ReactNode
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Loader2, ChevronRight, 
  UserCircle2, MapPin, ChevronDown, Globe, FileSpreadsheet, Mail, Phone
} from 'lucide-react';
import Link from 'next/link';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";

import Breadcrumbs from "@/components/Breadcrumbs"

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

export default function CreateCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fetchingRegions, setFetchingRegions] = useState(true);
  const [regions, setRegions] = useState<RegionNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'male',
    mobile: '',
    email: '',
    birthday: '',
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
        if (data.length > 0) {
          setExpandedIds([data[0].id]);
          setIsDialogOpen(true); 
        }
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

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.region_id) {
      toast.error("Please select a regional node first!");
      e.target.value = ''; 
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', file);

    setLoading(true);
    const toastId = toast.loading("System uploading spreadsheet...");

    try {
      await apiClient.post('/customer/import', uploadData, {
        params: { region_id: formData.region_id },
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Batch import successful", { id: toastId });
      setTimeout(() => router.push('/customers'), 1000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Upload failed";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
      e.target.value = ''; 
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.region_id) return toast.error("Please fill in required fields (Region)");

    setLoading(true);
    try {
      await apiClient.post('/customer/create', formData);
      toast.success("Customer created successfully");
      setTimeout(() => router.push('/customers'), 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 修正后的渲染函数：
   * 显式声明返回类型为 ReactNode 解决 Docker Build 报错
   */
  const renderTreeRows = (nodes: RegionNode[], parentName: string | null = null): ReactNode => {
    return nodes.map(node => {
      const isExpanded = expandedIds.includes(node.id);
      const hasChildren = node.children && node.children.length > 0;
      
      // 递归处理逻辑
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
                  <button type="button" onClick={(e) => toggleExpand(node.id, e)} className="text-slate-400 p-2 hover:bg-slate-200 rounded-lg">
                    {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                  </button>
                )}
              </div>
              <span className={cn("text-[18px] font-bold", node.is_occupied ? 'text-slate-200' : 'text-slate-900', isSelected && "text-yellow-600")}>
                {node.name}
              </span>
            </div>
            {isSelected && <CheckCircle2 size={26} className="text-yellow-500" />}
          </div>
          {hasChildren && isExpanded && renderTreeRows(node.children, node.name)}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-6 tracking-tighter">
      <div className="max-w-[800px] mx-auto space-y-6">

        <Breadcrumbs
          items={[
            { label: 'customers', href: '/customers' },
            { label: 'Create Customer' } 
          ]}
        />
        
        {/* Assigned Region */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
          <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 mb-4 block">Deployment Region</label>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button type="button" className="w-full h-20 px-8 border-2 border-slate-100 bg-slate-50/50 rounded-xl flex items-center justify-between group hover:border-yellow-400 transition-all text-left shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 group-hover:border-yellow-200 transition-all">
                    <Globe className={cn(formData.region_id ? "text-yellow-500" : "text-slate-300")} size={24} />
                  </div>
                  <span className={cn("text-[20px] font-black italic uppercase", formData.region_id ? "text-slate-900" : "text-slate-300")}>
                    {formData.region_name || "Assign regional node..."}
                  </span>
                </div>
                <ChevronDown size={28} className="text-slate-300 group-hover:text-slate-900" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[520px] w-[95vw] p-0 border-none rounded-xl shadow-2xl overflow-hidden bg-white outline-none">
              <DialogHeader className="p-10 bg-white border-b border-slate-50">
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Regional Deployment</DialogTitle>
                <DialogDescription className="hidden">Select a node from the regional organization tree.</DialogDescription>
              </DialogHeader>
              <div className="h-[400px] overflow-y-auto px-4 py-6">
                {fetchingRegions ? <Loader2 className="animate-spin text-yellow-400 mx-auto mt-20" /> : <div className="space-y-1">{renderTreeRows(regions)}</div>}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Excel 批量上传 */}
        <div>
          <input 
            type="file" 
            id="excel-upload"
            className="hidden" 
            accept=".xlsx,.xls" 
            onChange={handleExcelUpload} 
            disabled={loading}
          />
          <label 
            htmlFor="excel-upload"
            className={cn(
              "group cursor-pointer bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 transition-all hover:border-yellow-400 hover:bg-yellow-50/30 flex flex-col items-center justify-center gap-3",
              loading && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-white transition-all text-slate-400">
              {loading ? <Loader2 className="animate-spin" size={28} /> : <FileSpreadsheet size={28} />}
            </div>
            <div className="text-center">
              <h4 className="text-lg font-black italic uppercase text-slate-900">Batch Import via Excel</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">
                {formData.region_id ? `Target: [${formData.region_name}]` : "Select region first, then upload"}
              </p>
            </div>
          </label>
        </div>

        {/* 手动表单 */}
        <div className="bg-white rounded-xl p-10 md:p-14 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-12 border-b border-slate-50 pb-8">
            <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-200 text-slate-900">
              <UserCircle2 size={24} />
            </div>
            <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Customer Profile</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">First Name</label>
                <input required className="w-full h-16 px-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white outline-none font-bold text-lg transition-all text-slate-900" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Last Name</label>
                <input required className="w-full h-16 px-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white outline-none font-bold text-lg transition-all text-slate-900" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Gender</label>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 h-16">
                  {['male', 'female'].map((g) => (
                    <button key={g} type="button" onClick={() => setFormData({...formData, gender: g})} className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all", formData.gender === g ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-500')}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Birthday</label>
                <input type="date" className="w-full h-16 px-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white outline-none font-bold text-lg transition-all text-slate-900" value={formData.birthday} onChange={(e) => setFormData({...formData, birthday: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input required className="w-full h-16 pl-14 pr-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white outline-none font-bold text-lg transition-all text-slate-900" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input type="email" className="w-full h-16 pl-14 pr-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white outline-none font-bold text-lg transition-all text-slate-900" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Address</label>
              <div className="relative">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input required className="w-full h-16 pl-14 pr-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white outline-none font-bold text-lg transition-all text-slate-900" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-20 bg-yellow-400 text-slate-900 rounded-xl font-black uppercase text-lg shadow-xl shadow-yellow-400/20 active:scale-[0.98] hover:bg-yellow-500 transition-all flex items-center justify-center gap-4 mt-6 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <>Create Record <CheckCircle2 size={24} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}