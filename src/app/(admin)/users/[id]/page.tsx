'use client';

import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  CheckCircle2, Loader2, ChevronRight,
  ShieldCheck, Mail, Phone, UserCircle2, ChevronDown, Save, X,
  Edit3, ArrowLeft, Building2, MapPin, TabletSmartphone, Calendar, Info
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Breadcrumbs from '@/components/Breadcrumbs';

interface RegionNode {
  id: number;
  name: string;
  level: number;
  children: RegionNode[];
}

const ROLE_MAP: Record<number, { label: string, badgeVariant: string, description: string }> = {
  1: { label: 'ADMIN', badgeVariant: "bg-slate-900 text-white dark:bg-white dark:text-slate-900", description: "Full system control and user management" },
  2: { label: 'OPERATOR', badgeVariant: "bg-primary text-slate-950", description: "Field operations and customer servicing" },
  3: { label: 'FINANCE', badgeVariant: "bg-emerald-500 text-white", description: "Financial audits and payment reconciliation" }
};

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.id;

  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fetchingRegions, setFetchingRegions] = useState(true);
  const [regions, setRegions] = useState<RegionNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const [formData, setFormData] = useState<any>({
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
    is_active: true,
    entity_name: '',
    pos_sn: '',
    created_at: ''
  });

  const fetchUserData = useCallback(async () => {
    setFetchingUser(true);
    try {
      const res = await apiClient.get(`/user/${userId}`);
      const user = res.data;
      setFormData({
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        password: '',
        role: user.role,
        mobile: user.mobile,
        email: user.email || '',
        province: user.province || 'Pangasinan',
        address: user.address || '',
        region_id: user.region_id || 0,
        region_name: user.town_name || user.city_name || 'System Assigned',
        is_active: user.is_active,
        entity_name: user.entity_name || 'Central Management',
        pos_sn: user.pos_sn || null,
        created_at: user.created_at
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim()) return toast.error("First name is required");
    if (!formData.last_name.trim()) return toast.error("Last name is required");

    setLoading(true);
    try {
      const payload: any = {
        user_id: parseInt(userId as string),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim() || null,
        role: formData.role,
        region_id: formData.region_id,
        address: formData.address,
        is_active: formData.is_active
      };

      await apiClient.patch(`/user/${userId}`, payload);
      toast.success("User profile updated successfully");
      setIsEditMode(false);
      fetchUserData(); // Refresh data
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
                   <ChevronDown size={24} className={cn("text-slate-400 transition-transform", !isExpanded && "-rotate-90")} />
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className={cn("text-[18px] font-bold tracking-tight text-slate-900", isSelected && "text-primary", !isSelectable && "text-slate-400")}>
                  {node.name}
                </span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mt-1">
                  {node.level === 1 ? "Barangay" : "Purok"} {!isSelectable && "(Restricted)"}
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

  const infoBlockStyles = "p-6 rounded-[24px] bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 space-y-2 group transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-md shadow-sm dark:shadow-none";
  const labelStyles = "text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 group-hover:text-primary transition-colors";
  const inputStyles = "w-full bg-transparent border-b border-slate-200 dark:border-white/10 py-1 text-lg font-bold outline-none focus:border-primary transition-all text-slate-900 dark:text-slate-100";

  if (fetchingUser) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <span className="font-black uppercase tracking-[0.3em] text-slate-400">Syncing Identity Data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-12 px-6 tracking-tighter transition-colors">
      <div className="max-w-[900px] mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <Breadcrumbs items={[{ label: 'team', href: '/users' }, { label: formData.first_name + ' ' + formData.last_name }]} />
          <button onClick={() => router.push('/users')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <ArrowLeft size={14} /> Back to Members
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900/60 rounded-[32px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800/50 transition-colors">
          {/* Header Section */}
          <div className="bg-slate-950 dark:bg-slate-900 p-10 md:p-14 text-white relative">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                   <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl shrink-0">
                      <UserCircle2 size={48} className="text-primary" />
                   </div>
                   <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-white">
                          {formData.first_name} {formData.last_name}
                        </h1>
                      </div>
                      <div className="flex flex-wrap gap-4 items-center">
                        <Badge className={cn("px-4 py-1 rounded-full font-black text-[10px] uppercase border-none", ROLE_MAP[formData.role]?.badgeVariant)}>
                          {ROLE_MAP[formData.role]?.label}
                        </Badge>
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <Building2 size={12} className="text-primary" /> {formData.entity_name}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <MapPin size={12} className="text-primary" /> {formData.region_name}
                        </span>
                      </div>
                   </div>
                </div>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={cn(
                    "h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-3 active:scale-95 shadow-xl shrink-0",
                    isEditMode ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-primary text-slate-950 hover:opacity-90"
                  )}
                >
                  {isEditMode ? <><X size={18} /> Cancel</> : <><Edit3 size={18} /> Edit Profile</>}
                </button>
             </div>
          </div>

          <div className="p-10 md:p-14">
            <form onSubmit={handleUpdate} className="space-y-12">

              {/* Regional Shift (Edit Mode Only - Operator only) */}
              {isEditMode && formData.role === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Relocate Member Jurisdiction</label>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <button type="button" className="w-full h-20 px-8 border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl flex items-center justify-between group hover:border-primary transition-all text-left">
                        <div className="flex items-center gap-5">
                          <MapPin className="text-primary" size={24} />
                          <span className="text-xl font-black italic uppercase text-slate-900 dark:text-slate-100">{formData.region_name}</span>
                        </div>
                        <ChevronDown size={28} className="text-slate-300" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[520px] w-[95vw] p-0 border-none rounded-3xl shadow-2xl bg-white dark:bg-slate-900 outline-none overflow-hidden">
                      <DialogHeader className="p-10 border-b border-slate-50 dark:border-slate-800 shrink-0">
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter dark:text-white">Regional Hierarchy</DialogTitle>
                        <DialogDescription className="sr-only">Assign new jurisdiction</DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="max-h-[70vh]">
                        <div className="px-6 py-8 bg-white dark:bg-slate-900">
                          {fetchingRegions ? <Loader2 className="animate-spin text-primary mx-auto" size={40} /> : <div className="space-y-1">{renderTreeRows(regions)}</div>}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ID Block */}
                <div className={cn(infoBlockStyles, "md:col-span-2")}>
                  <label className={labelStyles}><Info size={12} /> System Identity & Registration</label>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-slate-900 dark:text-white font-mono">@{formData.username}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Joined: {new Date(formData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    {formData.pos_sn && (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-primary">
                          <TabletSmartphone size={14} />
                          <span className="text-[10px] font-black uppercase tracking-tighter italic">Bound POS</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400">{formData.pos_sn}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity Info */}
                <div className={infoBlockStyles}>
                   <label className={labelStyles}><UserCircle2 size={12} /> First Name</label>
                   {isEditMode ? <input className={inputStyles} value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} /> : <span className="text-lg font-bold text-slate-900 dark:text-white">{formData.first_name}</span>}
                </div>
                <div className={infoBlockStyles}>
                   <label className={labelStyles}><UserCircle2 size={12} /> Last Name</label>
                   {isEditMode ? <input className={inputStyles} value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} /> : <span className="text-lg font-bold text-slate-900 dark:text-white">{formData.last_name}</span>}
                </div>

                {/* Contact Info */}
                <div className={infoBlockStyles}>
                   <label className={labelStyles}><Phone size={12} /> Mobile Number</label>
                   {isEditMode ? <input className={inputStyles} value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} /> : <span className="text-lg font-bold text-slate-900 dark:text-white">{formData.mobile}</span>}
                </div>
                <div className={infoBlockStyles}>
                   <label className={labelStyles}><Mail size={12} /> Official Email</label>
                   {isEditMode ? <input className={inputStyles} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /> : <span className="text-lg font-bold text-slate-900 dark:text-white">{formData.email || "Not Provided"}</span>}
                </div>

                {/* Role Description */}
                {!isEditMode && (
                   <div className="md:col-span-2 p-6 rounded-[24px] bg-slate-950 text-white space-y-2">
                      <div className="flex items-center gap-3">
                         <ShieldCheck size={18} className="text-primary" />
                         <span className="text-xs font-black uppercase tracking-widest text-primary">Authority Assignment</span>
                      </div>
                      <p className="text-sm font-medium text-slate-400 italic">
                         {ROLE_MAP[formData.role]?.description}
                      </p>
                   </div>
                )}
              </div>

              {/* Status Switcher (Edit Mode Only) */}
              {isEditMode && (
                <div className="flex items-center gap-6 p-8 rounded-[24px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
                   <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Account Status</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toggle to suspend or authorize system access</p>
                   </div>
                   <button
                     type="button"
                     onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                     className={cn(
                       "h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                       formData.is_active ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                     )}
                   >
                     {formData.is_active ? "Authorized" : "Suspended"}
                   </button>
                </div>
              )}

              {/* Action Button */}
              {isEditMode && (
                <div className="pt-6 animate-in zoom-in-95 duration-300">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-20 bg-primary text-slate-950 rounded-[24px] font-black uppercase text-lg shadow-2xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <><Save size={24} /> Commit Identity Updates</>}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
