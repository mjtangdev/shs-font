'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Loader2, Home, ChevronRight, 
  UserPlus, ShieldCheck, Lock, Mail, Phone, UserCircle2, ChevronDown, Eye, EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // 保持要求的 JSON 数据结构
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 2, // 1: Admin, 2: Operator, 3: Finance
    mobile: '',
    email: '',
    position: 'Standard Member',
    province: 'Pangasinan',
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

    // 基础非空校验
    if (!formData.username.trim()) return toast.error("Username is required");
    if (!formData.first_name.trim()) return toast.error("First name is required");
    if (!formData.last_name.trim()) return toast.error("Last name is required");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password !== confirmPassword) return toast.error("Passwords do not match");
    if (!formData.mobile.trim()) return toast.error("Mobile number is required");
    if (!formData.email.trim()) return toast.error("Email address is required");

    // 业务逻辑：业务员必须选择地区，管理员/财务可选（后端默认为1）
    if (formData.role === 2 && !formData.region_id) {
        return toast.error("Please assign a regional node for Operator");
    }

    setLoading(true);

    try {
      // 提交原始数据，后端现在强制校验格式
      const payload = { ...formData };
      if (formData.role !== 2 && !formData.region_id) {
          payload.region_id = 1; // 默认分配到总部
      }

      await apiClient.post('/user/', payload);

      toast.success("User identity authorized and deployed successfully");
      
      setTimeout(() => {
        router.push('/users');
      }, 1200);

    } catch (err: any) {
      console.error("Submission failed:", err);
      // 优化错误处理，避免直接渲染对象导致崩溃
      const errorData = err.response?.data?.detail;
      let errorMsg = "System registration failed";

      if (Array.isArray(errorData)) {
        errorMsg = errorData[0]?.msg || errorMsg;
      } else if (typeof errorData === 'string') {
        errorMsg = errorData;
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderTreeRows = (nodes: RegionNode[], parentName: string | null = null): ReactNode => {
    return nodes.map(node => {
      const isExpanded = expandedIds.includes(node.id);
      const hasChildren = node.children && node.children.length > 0;
      const isMunicipality = node.level === 0;

      if (isMunicipality) return renderTreeRows(node.children, node.name);

      const isSelected = formData.region_id === node.id;

      // 业务逻辑：如果当前正在创建业务员 (Role 2)，则仅允许选择 Level 2 (Purok)
      // 禁止选择 Level 1 (Barangay)
      const isSelectable = formData.role !== 2 || node.level === 2;

      const getLevelLabel = (level: number) => {
        if (level === 0) return "Municipality";
        if (level === 1) return "Barangay";
        return "Purok";
      };

      return (
        <div key={node.id} className="select-none min-w-0 w-full">
          <div
            onClick={() => {
              if (formData.role === 2 && node.level === 1) {
                  // 如果是业务员且点击了第二层级（Barangay），自动执行展开/折叠动作而不是选中
                  setExpandedIds(prev => prev.includes(node.id) ? prev.filter(i => i !== node.id) : [...prev, node.id]);
                  return;
              }
              if (!isSelectable) return;
              setFormData({
                ...formData,
                region_id: node.id,
                region_name: node.level === 1 ? node.name : `${parentName} > ${node.name}`
              });
              setIsDialogOpen(false);
            }}
            title={getLevelLabel(node.level)}
            className={cn(
              "flex items-start justify-between px-6 py-5 rounded-xl transition-all mb-1 border-2 border-transparent min-w-0 w-full box-border",
              !isSelectable && node.level !== 1 ? "opacity-30 cursor-not-allowed grayscale" : "cursor-pointer",
              isSelected ? "bg-primary/10 border-primary" : (isSelectable || node.level === 1) ? "hover:bg-slate-50 border-slate-50" : ""
            )}
            style={{ paddingLeft: `${(node.level - 1) * 24 + 24}px` }}
          >
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-6 flex justify-center shrink-0 mt-1">
                {node.level === 1 && hasChildren && (
                  <button 
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(node.id, e);
                    }}
                    className="text-slate-400 p-1 hover:bg-slate-200 rounded-lg"
                  >
                    {isExpanded ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
                  </button>
                )}
              </div>
              <div className="flex flex-col text-left min-w-0 flex-1">
                <span className={cn(
                  "text-[18px] font-bold tracking-tight text-slate-900 break-all whitespace-normal leading-snug",
                  isSelected && "text-primary",
                  !isSelectable && "text-slate-400"
                )}>
                  {node.name}
                </span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mt-1">
                  {getLevelLabel(node.level)} {!isSelectable && "(Restricted for Operators)"}
                </span>
              </div>
            </div>
            {isSelected && <CheckCircle2 size={26} className="text-primary animate-in zoom-in shrink-0 ml-2 mt-0.5" />}
          </div>
          {hasChildren && isExpanded && renderTreeRows(node.children, node.name)}
        </div>
      );
    });
  };

  const labelStyles = "text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1";
  const inputStyles = "w-full h-16 px-6 border-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl focus:border-primary focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-lg transition-all text-foreground placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-transparent py-12 px-6 tracking-tighter transition-colors">
      <div className="max-w-[750px] mx-auto space-y-6">
        
        {/* 面包屑导航 */}
        <Breadcrumbs
          items={[
            { label: 'team', href: '/users' },
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
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
              {[
                { id: 1, label: 'Admin' },
                { id: 2, label: 'Operator' },
                { id: 3, label: 'Finance' }
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
                  {formData.role === r.id && <ShieldCheck size={12} className="text-primary" />}
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

            {/* 密码网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className={labelStyles}>Security Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    className={inputStyles}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <label className={labelStyles}>Confirm Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    className={inputStyles}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Lock size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" />
                </div>
              </div>
            </div>

            {/* 地区选择 - 仅针对业务员显示或必填 */}
            {formData.role === 2 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                <label className={labelStyles}>Assigned Region *</label>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="w-full h-16 px-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl flex items-center justify-between group hover:border-slate-400 focus:border-primary transition-all text-left">
                      <span className={cn("text-lg font-bold", formData.region_id ? "text-slate-900" : "text-slate-300 italic")}>
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
            )}

            {/* 联系信息（必填） */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50 dark:border-slate-800/50">
              <div className="space-y-3">
                <label className={labelStyles}>Mobile Number *</label>
                <div className="relative">
                  <input 
                    required
                    className={inputStyles}
                    placeholder="+63 000 000 0000"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  />
                  <Phone size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" />
                </div>
              </div>
              <div className="space-y-3">
                <label className={labelStyles}>Official Email *</label>
                <div className="relative">
                  <input 
                    required
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
              className="w-full h-20 bg-slate-900 text-white rounded-xl font-black uppercase text-lg shadow-xl shadow-slate-200 active:scale-[0.98] hover:bg-primary hover:text-slate-950 transition-all flex items-center justify-center gap-4 mt-6 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span>Provisioning...</span>
                </div>
              ) : (
                <>Authorize Deployment <CheckCircle2 size={24} className="text-primary" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
