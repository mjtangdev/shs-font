'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Loader2, Home, ChevronRight, 
  UserPlus, ShieldCheck, Lock, Mail, Phone, UserCircle2, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

import Breadcrumbs from '@/components/Breadcrumbs'; // 根据你的实际路径修改

interface RegionNode {
  id: number;
  name: string;
  level: number;
  children: RegionNode[];
  is_occupied: boolean;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fetchingRegions, setFetchingRegions] = useState(true);
  const [regions, setRegions] = useState<RegionNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  
  // 保持要求的 JSON 数据结构
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 3, // 1: Admin, 2: Finance, 3: Operator
    mobile: '',
    email: '',
    position: 'Standard Member',
    province: 'Pangasinan',
    city_id: 0,
    town_id: 0,
    address: 'Default HQ',
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

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 仅保留最基础的非空校验
    if (!formData.username.trim()) return toast.error("Username is required");
    if (!formData.first_name.trim()) return toast.error("First name is required");
    if (!formData.last_name.trim()) return toast.error("Last name is required");
    if (!formData.password) return toast.error("Password is required"); // 移除长度限制，仅判断是否存在

    setLoading(true);

    try {
      // 对接接口: /user/
      await apiClient.post('/user/', formData);

      toast.success("User identity authorized and deployed successfully");
      
      setTimeout(() => {
        router.push('/users');
      }, 1200);

    } catch (err: any) {
      console.error("Submission failed:", err);
      const errorDetail = err.response?.data?.detail || "System registration failed";
      toast.error(errorDetail);
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
        <div key={node.id} className="select-none">
          <div 
            onClick={() => {
              setFormData({
                ...formData, 
                region_id: node.id, 
                region_name: node.level === 1 ? node.name : `${parentName} > ${node.name}`
              });
              setIsDialogOpen(false);
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
                "text-[18px] font-bold tracking-tight text-slate-900",
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

  const labelStyles = "text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1";
  const inputStyles = "w-full h-16 px-6 border-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl focus:border-yellow-400 focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-lg transition-all text-foreground placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-transparent py-12 px-6 tracking-tighter transition-colors">
      <div className="max-w-[750px] mx-auto space-y-6">
        
        {/* 面包屑导航 */}
        <Breadcrumbs
          items={[
            { label: 'team', href: '/tesm' },
            { label: 'Create teammate' } 
          ]}
        />

        {/* 主卡片容器 */}
        <div className="bg-white dark:bg-slate-900/60 rounded-xl p-10 md:p-14 shadow-sm border border-slate-100">
          
          {/* 头部标题与角色切换 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-50 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200 text-white">
                <UserCircle2 size={24} />
              </div>
              <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">New Member</h2>
            </div>

            {/* 精致型 Tab 切换器 */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
              {[
                { id: 1, label: 'Admin' },
                { id: 2, label: 'Finance' },
                { id: 3, label: 'Operator' }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setFormData({...formData, role: r.id})}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                    formData.role === r.id ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-500'
                  )}
                >
                  {formData.role === r.id && <ShieldCheck size={12} className="text-yellow-500" />}
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleUserSubmit} className="space-y-10">
            {/* 账号名称 */}
            <div className="space-y-3">
              <label className={labelStyles}>System ID / Username *</label>
              <input 
                required
                className={inputStyles}
                placeholder="Ex: alpha_operator_01"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            {/* 姓名网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className={labelStyles}>First Name *</label>
                <input 
                  required
                  className={inputStyles}
                  placeholder="Given Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className={labelStyles}>Last Name *</label>
                <input 
                  required
                  className={inputStyles}
                  placeholder="Surname"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>

            {/* 密码：已取消长度限制 */}
            <div className="space-y-3">
              <label className={labelStyles}>Security Password *</label>
              <div className="relative">
                <input 
                  required
                  type="password"
                  className={inputStyles}
                  placeholder="No limit password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <Lock size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" />
              </div>
            </div>

            {/* 地区选择 */}
            <div className="space-y-3">
              <label className={labelStyles}>Assigned Region *</label>
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

            {/* 联系信息（可选） */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50 dark:border-slate-800/50">
              <div className="space-y-3">
                <label className={labelStyles}>Mobile Number</label>
                <div className="relative">
                  <input 
                    className={inputStyles}
                    placeholder="+63 000 000 0000"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  />
                  <Phone size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" />
                </div>
              </div>
              <div className="space-y-3">
                <label className={labelStyles}>Official Email</label>
                <div className="relative">
                  <input 
                    type="email"
                    className={inputStyles}
                    placeholder="user@system.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                  <Mail size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" />
                </div>
              </div>
            </div>

            {/* 提交按钮：h-20 */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-20 bg-slate-900 text-white rounded-xl font-black uppercase text-lg shadow-xl shadow-slate-200 active:scale-[0.98] hover:bg-yellow-400 hover:text-slate-900 transition-all flex items-center justify-center gap-4 mt-6 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin" size={24} />
                  <span>Provisioning...</span>
                </div>
              ) : (
                <>Authorize Deployment <CheckCircle2 size={24} className="text-yellow-400" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}