'use client';

import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  CheckCircle2, Loader2, ChevronRight,
  ShieldCheck, Lock, Mail, Phone, UserCircle2, ChevronDown, Eye, EyeOff, Save, X
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
  DialogDescription,
} from "@/components/ui/dialog";

import Breadcrumbs from '@/components/Breadcrumbs';

interface RegionNode {
  id: number;
  name: string;
  level: number;
  children: RegionNode[];
  is_occupied: boolean;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fetchingRegions, setFetchingRegions] = useState(true);
  const [regions, setRegions] = useState<RegionNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 2,
    mobile: '',
    email: '',
    province: 'Pangasinan',
    address: '',
    region_id: 0,
    region_name: '',
    is_active: true
  });

  const fetchUserData = useCallback(async () => {
    try {
      const res = await apiClient.get(`/user/${userId}`);
      const user = res.data;
      setFormData({
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        password: '', // 保持为空，除非要修改
        role: user.role,
        mobile: user.mobile,
        email: user.email || '',
        province: user.province || 'Pangasinan',
        address: user.address || '',
        region_id: user.region_id || 0,
        region_name: user.town_name || user.city_name || '',
        is_active: user.is_active
      });
    } catch (err) {
      toast.error("Failed to fetch user data");
      router.push('/users');
    } finally {
      setFetchingUser(false);
    }
  }, [userId, router]);

  const fetchRegionData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchRegionData();
  }, [fetchUserData, fetchRegionData]);

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name.trim()) return toast.error("First name is required");
    if (!formData.last_name.trim()) return toast.error("Last name is required");
    if (!formData.mobile.trim()) return toast.error("Mobile number is required");
    if (formData.password && formData.password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);

    try {
      // 核心修复：构建干净的更新负载，过滤掉无效字段和格式
      const payload: any = {
        user_id: parseInt(userId as string),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        mobile: formData.mobile.trim(),
        role: formData.role,
        region_id: formData.region_id,
        address: formData.address,
        is_active: formData.is_active
      };

      // 只有在输入了新密码时才传递密码
      if (formData.password) {
        payload.password = formData.password;
      }

      // 处理邮箱：如果为空则传 null，否则传去除空格后的值
      payload.email = formData.email?.trim() || null;

      await apiClient.patch(`/user/${userId}`, payload);
      toast.success("User profile updated successfully");

      setTimeout(() => {
        router.push('/users');
      }, 1000);

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
      const isMunicipality = node.level === 0;

      if (isMunicipality) return renderTreeRows(node.children, node.name);

      const isSelected = formData.region_id === node.id;
      const isSelectable = formData.role !== 2 || node.level === 2;

      const getLevelLabel = (level: number) => {
        if (level === 0) return "Municipality";
        if (level === 1) return "Barangay";
        return "Purok";
      };

      return (
        <div key={node.id} className="select-none">
          <div
            onClick={() => {
              if (formData.role === 2 && node.level === 1) {
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
            className={cn(
              "flex items-center justify-between px-6 py-5 rounded-xl transition-all mb-1 border-2 border-transparent",
              !isSelectable && node.level !== 1 ? "opacity-30 cursor-not-allowed grayscale" : "cursor-pointer",
              isSelected ? "bg-primary/10 border-primary" : (isSelectable || node.level === 1) ? "hover:bg-slate-50 border-slate-50" : ""
            )}
            style={{ marginLeft: `${(node.level - 1) * 20}px` }}
          >
            <div className="flex items-center gap-5 flex-1">
              <div className="w-8 flex justify-center">
                {node.level === 1 && hasChildren && (
                  <button type="button" className="text-slate-400 p-2 hover:bg-slate-200 rounded-lg">
                    {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                  </button>
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className={cn("text-[18px] font-bold tracking-tight text-slate-900", isSelected && "text-primary", !isSelectable && "text-slate-400")}>
                  {node.name}
                </span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mt-1">
                  {getLevelLabel(node.level)} {!isSelectable && "(Restricted)"}
                </span>
              </div>
            </div>
            {isSelected && <CheckCircle2 size={26} className="text-primary animate-in zoom-in" />}
          </div>
          {hasChildren && isExpanded && renderTreeRows(node.children, node.name)}
        </div>
      );
    });
  };

  const labelStyles = "text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1";
  const inputStyles = "w-full h-16 px-6 border-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl focus:border-primary focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-lg transition-all text-foreground placeholder:text-muted-foreground";

  if (fetchingUser) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-transparent py-12 px-6 tracking-tighter transition-colors">
      <div className="max-w-[750px] mx-auto space-y-6">

        <Breadcrumbs
          items={[
            { label: 'team', href: '/users' },
            { label: `Edit: @${formData.username}` }
          ]}
        />

        <div className="bg-white dark:bg-slate-900/60 rounded-xl p-10 md:p-14 shadow-sm border border-slate-100">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-50 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 text-slate-950">
                <UserCircle2 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white tracking-tighter">Edit Member</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">@{formData.username}</p>
              </div>
            </div>

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
            {/* Username - Read Only */}
            <div className="space-y-3 opacity-60 grayscale-[0.5]">
              <label className={labelStyles}>System ID / Username (Read Only)</label>
              <div className={cn(inputStyles, "flex items-center bg-slate-100/50 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/50 cursor-not-allowed text-slate-500 font-mono")}>
                {formData.username}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className={labelStyles}>First Name *</label>
                <input required className={inputStyles} value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div className="space-y-3">
                <label className={labelStyles}>Last Name *</label>
                <input required className={inputStyles} value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className={labelStyles}>New Password (Optional)</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={inputStyles}
                    placeholder="Leave blank to keep current"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <label className={labelStyles}>Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={inputStyles}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Lock size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className={labelStyles}>Assigned Region *</label>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button type="button" className="w-full h-16 px-6 border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 rounded-xl flex items-center justify-between group hover:border-primary transition-all text-left">
                    <span className={cn("text-lg font-bold", formData.region_id ? "text-slate-900 dark:text-white" : "text-slate-300 italic")}>
                      {formData.region_name || "Assign regional node..."}
                    </span>
                    <ChevronDown size={24} className="text-slate-300 group-hover:text-slate-900" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[520px] w-[95vw] p-0 border-none rounded-xl shadow-2xl overflow-hidden bg-white dark:bg-slate-900/60">
                  <DialogHeader className="p-10 border-b border-slate-50">
                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Select Region</DialogTitle>
                    <DialogDescription className="hidden">Selection of organizational nodes</DialogDescription>
                  </DialogHeader>
                  <div className="h-[400px] overflow-y-auto px-4 py-6">
                    {fetchingRegions ? <Loader2 className="animate-spin text-primary mx-auto mt-20" /> : <div className="space-y-1">{renderTreeRows(regions)}</div>}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50 dark:border-slate-800/50">
              <div className="space-y-3">
                <label className={labelStyles}>Mobile Number *</label>
                <div className="relative">
                  <input required className={inputStyles} value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
                  <Phone size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" />
                </div>
              </div>
              <div className="space-y-3">
                <label className={labelStyles}>Official Email</label>
                <div className="relative">
                  <input type="email" className={inputStyles} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  <Mail size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-20 bg-slate-900 dark:bg-primary text-white dark:text-slate-950 rounded-xl font-black uppercase text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24} /> Save Changes</>}
              </button>
              <button
                type="button"
                onClick={() => router.push('/users')}
                className="px-10 h-20 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-black uppercase text-lg transition-all flex items-center justify-center gap-4"
              >
                <X size={24} /> Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
