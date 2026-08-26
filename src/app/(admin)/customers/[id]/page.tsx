'use client';

import React, { useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  CheckCircle2, Loader2, ChevronLeft, ChevronRight, UserCircle2,
  MapPin, ChevronDown, Globe, Mail, Phone,
  Users, UserCheck, Heart, Edit3, ArrowLeft, Eye,
  Cpu, Zap, Radio, Flashlight, Lightbulb, CreditCard, History,
  ExternalLink, Calendar as CalendarIcon, Clock, ShieldAlert, ShieldCheck, TrendingUp, Copy
} from 'lucide-react';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";
import Breadcrumbs from "@/components/Breadcrumbs";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RegionNode {
  id: number;
  name: string;
  level: number;
  children: RegionNode[];
  is_occupied: boolean;
}

// --- [INDUSTRIAL CALENDAR PICKER] ---
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function IndustrialCalendarPicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'calendar' | 'years'>('calendar');

  const now = useMemo(() => (value ? new Date(value) : new Date(2000, 0, 1)), [value]);
  const [currentViewDate, setCurrentViewDate] = useState(now);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const arr = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      arr.push({ day: prevMonthDays - i, current: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - arr.length;
    for (let i = 1; i <= remaining; i++) {
      arr.push({ day: i, current: false, date: new Date(year, month + 1, i) });
    }
    return arr;
  }, [year, month]);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: current - 1940 + 1 }, (_, i) => current - i);
  }, []);

  const handleSelect = (date: Date) => {
    const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="w-full h-14 bg-transparent border-b-2 border-slate-100 dark:border-white/60 py-2 text-lg font-bold flex items-center justify-between group hover:border-primary transition-all text-left outline-none">
          <span className={cn(value ? "text-slate-900 dark:text-slate-100" : "text-slate-300 dark:text-slate-600")}>
            {value ? `${MONTHS_EN[new Date(value).getMonth()]} ${new Date(value).getDate()}, ${new Date(value).getFullYear()}` : "Select Birth Date..."}
          </span>
          <CalendarIcon size={18} className={cn("transition-colors", value ? "text-primary" : "text-slate-400", "group-hover:text-primary")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 bg-white dark:bg-slate-950 border-none shadow-2xl rounded-[24px] overflow-hidden w-[340px]" align="start">
        <div className="bg-slate-900 p-4 border-b border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setView(view === 'years' ? 'calendar' : 'years')} className="text-[14px] font-black uppercase tracking-widest text-white hover:text-primary flex items-center gap-1 transition-colors">
              {year} <ChevronDown size={14} className={cn("transition-transform", view === 'years' && "rotate-180")} />
            </button>
            <div className="flex items-center gap-1">
               <button type="button" onClick={() => setCurrentViewDate(new Date(year, month - 1))} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"><ChevronLeft size={18} /></button>
               <button type="button" onClick={() => setCurrentViewDate(new Date(year, month + 1))} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"><ChevronRight size={18} /></button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
             {MONTHS_EN.map((m, idx) => (
               <button key={m} type="button" onClick={() => { setCurrentViewDate(new Date(year, idx)); setView('calendar'); }} className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0", month === idx ? "bg-primary text-slate-950" : "bg-white/5 text-slate-500 hover:text-white")}>
                 {m.substring(0, 3)}
               </button>
             ))}
          </div>
        </div>
        <div className="p-4 relative min-h-[300px]">
          {view === 'calendar' ? (
            <div className="animate-in fade-in zoom-in-95 duration-200">
               <div className="grid grid-cols-7 mb-2">
                 {DAYS_EN.map(d => <div key={d} className="text-center text-[9px] font-black text-slate-500 uppercase py-2">{d}</div>)}
               </div>
               <div className="grid grid-cols-7 gap-1">
                 {calendarDays.map((d, idx) => {
                   const isSelected = value && new Date(value).toDateString() === d.date.toDateString();
                   const isToday = new Date().toDateString() === d.date.toDateString();
                   return (
                     <button key={idx} type="button" onClick={() => handleSelect(d.date)} className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all", !d.current ? "text-slate-800 pointer-events-none opacity-20" : "text-slate-400 hover:bg-primary hover:text-slate-950", isSelected && "bg-primary text-slate-950 shadow-lg", isToday && !isSelected && "border border-primary/30 text-primary")}>
                       {d.day}
                     </button>
                   );
                 })}
               </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-slate-950 z-20 p-2 animate-in slide-in-from-top duration-300">
              <ScrollArea className="h-[280px]">
                <div className="grid grid-cols-3 gap-1 p-1">
                  {years.map(y => (
                    <button key={y} type="button" onClick={() => { setCurrentViewDate(new Date(y, month)); setView('calendar'); }} className={cn("py-3 rounded-xl text-xs font-black transition-all", year === y ? "bg-primary text-slate-950" : "text-slate-500 hover:bg-white/5 hover:text-white")}>{y}</button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const customerId = params.id;

  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fetchingRegions, setFetchingRegions] = useState(true);
  const [regions, setRegions] = useState<RegionNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const [formData, setFormData] = useState<any>({
    first_name: '',
    last_name: '',
    gender: 'male',
    mobile: '',
    email: '',
    birthday: '',
    address: '',
    region_id: 0,
    region_name: '',
    beneficiary_count: 0,
    representative_name: '',
    rep_relationship: '-',
    cards: [],
    solar_units: [],
    recent_transactions: [],
    expiry_time: null,
    total_recharged_days: 0,
    total_recharged_amount: 0,
    uuid: ''
  });

  // Load Regions
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

  // Load Profile
  useEffect(() => {
    if (customerId) {
      const fetchCustomerData = async () => {
        setFetchingData(true);
        try {
          const res = await apiClient.get(`/customer/${customerId}`);
          if (res.data) {
            setFormData({
              first_name: res.data.first_name || '',
              last_name: res.data.last_name || '',
              gender: res.data.gender || 'male',
              mobile: res.data.mobile || '',
              email: res.data.email || '',
              birthday: res.data.birthday || '',
              address: res.data.address || '',
              region_id: res.data.region_id || 0,
              region_name: res.data.region_name || '',
              beneficiary_count: res.data.beneficiary_count || 0,
              representative_name: res.data.representative_name || '',
              rep_relationship: res.data.rep_relationship || '-',
              cards: res.data.cards || [],
              solar_units: res.data.solar_units || [],
              recent_transactions: res.data.recent_transactions || [],
              expiry_time: res.data.expiry_time,
              total_recharged_days: res.data.total_recharged_days || 0,
              total_recharged_amount: res.data.total_recharged_amount || 0,
              uuid: res.data.uuid || ''
            });
          }
        } catch (err) {
          toast.error("Failed to load profile");
          router.push('/customers');
        } finally {
          setFetchingData(false);
        }
      };
      fetchCustomerData();
    }
  }, [customerId, router]);

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await apiClient.put(`/customer/${customerId}`, formData);
      toast.success("Profile updated");
      setIsEditMode(false);
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
      return (
        <div key={node.id} className="select-none">
          <div onClick={(e) => {
              if (!node.is_occupied || node.id === formData.region_id) {
                if (hasChildren) {
                  toggleExpand(node.id, e);
                  return;
                }
                setFormData({ ...formData, region_id: node.id, region_name: node.level === 1 ? node.name : `${parentName} > ${node.name}` });
                setIsDialogOpen(false);
              }
            }}
            className={cn(
              "flex items-center justify-between px-6 py-5 rounded-xl transition-all mb-1 border-2 border-transparent cursor-pointer group/row",
              isSelected
                ? "bg-primary border-primary shadow-lg shadow-primary/20 scale-[1.02] z-10"
                : "hover:bg-primary hover:shadow-md"
            )}
            style={{ marginLeft: `${(node.level - 1) * 20}px` }}
          >
            <div className="flex items-center gap-5 flex-1">
              <div className="w-8 flex justify-center">
                {node.level === 1 && hasChildren && (
                  <div className={cn("text-slate-400 p-2 group-hover/row:text-slate-900 transition-colors")}>
                    {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "text-[18px] font-bold transition-colors",
                  (node.is_occupied && node.id !== formData.region_id) ? 'text-slate-200' : isSelected ? 'text-slate-950' : 'text-slate-900 dark:text-slate-100 group-hover/row:text-slate-950'
                )}>
                  {node.name}
                </span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest leading-none mt-1 transition-colors",
                  isSelected ? "text-slate-900/60" : "text-slate-400 group-hover/row:text-slate-900/60"
                )}>
                  {node.level === 1 ? "Barangay" : "Purok"} {hasChildren && "(Folder)"}
                </span>
              </div>
            </div>
            {isSelected && <CheckCircle2 size={26} className="text-slate-950" />}
            {hasChildren && !isSelected && <ChevronRight size={20} className="text-slate-300 group-hover/row:text-slate-950 opacity-50" />}
          </div>
          {hasChildren && isExpanded && renderTreeRows(node.children, node.name)}
        </div>
      );
    });
  };

  // Calculate Remaining Days
  const remainingDays = useMemo(() => {
    if (!formData.expiry_time) return null;
    const expiry = new Date(formData.expiry_time.replace(' ', 'T'));
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [formData.expiry_time]);

  if (fetchingData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <span className="font-black uppercase tracking-[0.3em] text-slate-400">Loading profile data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-12 px-6 tracking-tighter transition-colors">
      <div className="max-w-[900px] mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <Breadcrumbs items={[{ label: 'customers', href: '/customers' }, { label: formData.first_name + ' ' + formData.last_name }]} />
        </div>

        <div className="bg-white dark:bg-slate-900/60 rounded-[32px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800/50 transition-colors">
          {/* Header Stripe */}
          <div className="bg-slate-950 dark:bg-slate-900 p-10 md:p-14 text-white relative">
             <div className="space-y-10">
                {/* Layer 1: Identity & Action */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                   <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl shrink-0">
                         <UserCircle2 size={48} className="text-primary" />
                      </div>
                      <div className="space-y-2">
                         <div className="flex items-center gap-3">
                           <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-white">
                             {formData.first_name} {formData.last_name}
                           </h1>
                         </div>
                         <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                           <span className="flex items-center gap-1.5"><Globe size={12} className="text-primary" /> {formData.region_name}</span>
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
                     {isEditMode ? <>Cancel Edit</> : <><Edit3 size={18} /> Modify Profile</>}
                   </button>
                </div>

                {/* Layer 2: Service Status */}
                {remainingDays !== null && (
                  <div className="flex items-center justify-between pt-8 border-t border-white/5">
                     <div className="flex items-center gap-4">
                        <div className="relative flex h-3 w-3">
                           <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", remainingDays > 0 ? "bg-green-400" : "bg-primary/40")}></span>
                           <span className={cn("relative inline-flex rounded-full h-3 w-3", remainingDays > 0 ? "bg-green-500" : "bg-primary")}></span>
                        </div>
                        <div className="flex items-baseline gap-2">
                           <span className={cn(
                             "text-lg font-black italic tracking-tighter uppercase",
                             remainingDays > 0 ? "text-green-400" : "text-primary"
                           )}>
                             {remainingDays > 0 ? `${remainingDays} Days Remaining` : "Service Access Expired"}
                           </span>
                        </div>
                     </div>

                     <div className="flex items-baseline gap-2 text-right">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Expiration Date:</span>
                        <span className="text-lg font-black text-white italic tracking-tighter">
                           {new Date(formData.expiry_time.replace(' ', 'T')).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                     </div>
                  </div>
                )}
             </div>
          </div>

          <div className="p-10 md:p-14">
            <form onSubmit={handleUpdate} className="space-y-12">

              {/* Region Selector (Only in Edit) */}
              {isEditMode && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Update Deployment Location</label>
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
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter dark:text-white">Select New Node</DialogTitle>
                        <DialogDescription className="sr-only">
                          Select a new regional node to update the deployment location.
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="max-h-[70vh]">
                        <div className="px-6 py-8 bg-white dark:bg-slate-900">
                          {fetchingRegions ? (
                            <div className="flex flex-col items-center justify-center py-20">
                              <Loader2 className="animate-spin text-primary" size={40} />
                            </div>
                          ) : (
                            <div className="space-y-1">{renderTreeRows(regions)}</div>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {/* Customer UUID Block (Replaces First/Last Name) - Occupies Full Row */}
                <div className="md:col-span-2 p-6 rounded-[24px] bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 space-y-2 group transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-none shadow-sm dark:shadow-none">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 group-hover:text-primary transition-colors">
                    <UserCircle2 size={12} /> Customer Identity (UUID)
                  </label>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight font-mono tracking-tight">
                      {formData.uuid || "---"}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.uuid) {
                          navigator.clipboard.writeText(formData.uuid);
                          toast.success("UUID copied to clipboard");
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:border-primary transition-all active:scale-95 shadow-sm"
                    >
                      <Copy size={14} /> Copy UID
                    </button>
                  </div>
                </div>

                {/* Information Blocks */}
                {[
                  { label: 'First Name', value: formData.first_name, key: 'first_name', icon: UserCircle2, editable: true },
                  { label: 'Last Name', value: formData.last_name, key: 'last_name', icon: UserCircle2, editable: true },
                  { label: 'Mobile Number', value: formData.mobile, key: 'mobile', icon: Phone, editable: true },
                  { label: 'Email Address', value: formData.email || 'Not Provided', key: 'email', icon: Mail, editable: true },
                  { label: 'Beneficiary Count', value: formData.beneficiary_count, key: 'beneficiary_count', icon: Users, editable: true, type: 'number' },
                  { label: 'Representative', value: formData.representative_name, key: 'representative_name', icon: UserCheck, editable: true },
                ].map((field) => (
                  <div key={field.key} className="p-6 rounded-[24px] bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 space-y-2 group transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-none shadow-sm dark:shadow-none">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 group-hover:text-primary transition-colors">
                      <field.icon size={12} /> {field.label}
                    </label>
                    {isEditMode ? (
                      <input
                        type={field.type || 'text'}
                        className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 py-1 text-lg font-bold outline-none focus:border-primary transition-all text-slate-900 dark:text-slate-100"
                        value={formData[field.key]}
                        onChange={(e) => setFormData({...formData, [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value})}
                      />
                    ) : (
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{field.value}</div>
                    )}
                  </div>
                ))}

                {/* Birthday Block */}
                <div className="p-6 rounded-[24px] bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 space-y-2 group transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-none shadow-sm dark:shadow-none">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 group-hover:text-primary transition-colors">
                    <CalendarIcon size={12} /> Birthday
                  </label>
                  {isEditMode ? (
                    <IndustrialCalendarPicker
                      value={formData.birthday}
                      onChange={(val) => setFormData({...formData, birthday: val})}
                    />
                  ) : (
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {formData.birthday
                        ? (function(val) {
                            const d = new Date(val);
                            return `${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
                          })(formData.birthday)
                        : "Not Provided"}
                    </div>
                  )}
                </div>

                {/* Relationship (Special Select) */}
                <div className="p-6 rounded-[24px] bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 space-y-2 group transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-none shadow-sm dark:shadow-none">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Heart size={12} /> Relationship
                  </label>
                  {isEditMode ? (
                    <select
                      className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 py-1 text-lg font-bold outline-none focus:border-primary transition-all text-slate-900 dark:text-slate-100 appearance-none"
                      value={formData.rep_relationship}
                      onChange={(e) => setFormData({...formData, rep_relationship: e.target.value})}
                    >
                      {['-', 'Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Relative', 'Other'].map(opt => <option key={opt} value={opt} className="dark:bg-slate-900">{opt}</option>)}
                    </select>
                  ) : (
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{formData.rep_relationship}</div>
                  )}
                </div>
              </div>

              {/* Full Address Block */}
              <div className="space-y-3 pt-6 border-t border-slate-50 dark:border-slate-800">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2"><MapPin size={12} /> Full Installation Address</label>
                {isEditMode ? (
                  <textarea
                    className="w-full bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 dark:text-slate-100 min-h-[120px] placeholder:text-slate-200 dark:placeholder:text-slate-800"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                ) : (
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">{formData.address}</div>
                )}
              </div>

              {/* Tabs for Hardware and Transactions */}
              {!isEditMode && (
                <div className="pt-10 border-t border-slate-50 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <Tabs defaultValue="hardware" className="w-full">
                    <TabsList className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl h-14 w-full md:w-fit mb-8">
                      <TabsTrigger value="hardware" className="px-8 h-full rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-primary font-black uppercase text-[10px] tracking-widest gap-2">
                        <Cpu size={14} /> Hardware Ledger
                      </TabsTrigger>
                      <TabsTrigger value="finance" className="px-8 h-full rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-primary font-black uppercase text-[10px] tracking-widest gap-2">
                        <History size={14} /> Financial Records
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="hardware" className="space-y-6">
                      <div className="flex flex-col gap-6">
                        {/* Service Summary Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                    <Clock size={20} />
                                 </div>
                                 <div className="flex flex-col items-start">
                                    <h3 className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Service Expiry</h3>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                       {formData.expiry_time ? new Date(formData.expiry_time.replace(' ', 'T')).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "No Expiry Recorded"}
                                    </span>
                                 </div>
                              </div>
                              {remainingDays !== null && (
                                <Badge className={cn("border-none", remainingDays > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                                  {remainingDays > 0 ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                </Badge>
                              )}
                           </div>
                           <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                 <TrendingUp size={20} />
                              </div>
                              <div className="flex flex-col">
                                 <h3 className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Lifetime Usage</h3>
                                 <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                    {formData.total_recharged_days} Recharged Days
                                 </span>
                              </div>
                           </div>
                        </div>

                        {/* Compact IC Card Info */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                              <CreditCard size={20} />
                            </div>
                            <div className="flex flex-col">
                              <h3 className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Access Card</h3>
                              {formData.cards.length > 0 ? (
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">#{formData.cards[0].card_number}</span>
                                  <span className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">{formData.cards[0].card_uuid}</span>
                                </div>
                              ) : (
                                <span className="text-sm font-bold text-slate-300 dark:text-slate-700 italic">No Card Bound</span>
                              )}
                            </div>
                          </div>
                          {formData.cards.length > 0 && (
                            <Badge className="bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-none px-3 py-1 rounded-full font-black text-[8px] uppercase">Active</Badge>
                          )}
                        </div>

                        {/* SHS Device Info (Full Grid) */}
                        <Card className="p-8 border-none bg-slate-50 dark:bg-slate-800/30 rounded-[24px] transition-colors">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                              <Zap size={20} />
                            </div>
                            <h3 className="font-black uppercase italic tracking-tight text-slate-900 dark:text-slate-100">Solar Home System Manifest</h3>
                          </div>
                          {formData.solar_units.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                              {[
                                { label: 'Machine ID', value: formData.solar_units[0].shs_machine_id, icon: Cpu },
                                { label: 'Solar Panel', value: formData.solar_units[0].solar_equipment_id, icon: Zap },
                                { label: 'Radio Unit', value: formData.solar_units[0].radio_id, icon: Radio },
                                { label: 'Flashlight', value: formData.solar_units[0].flashlight_id, icon: Flashlight },
                                { label: 'LED Unit', value: formData.solar_units[0].led_light_id, icon: Lightbulb },
                              ].map((item) => (
                                <div key={item.label} className="flex flex-col gap-1.5 border-l-2 border-slate-200 dark:border-slate-700 pl-4 transition-colors">
                                  <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><item.icon size={10} /> {item.label}</span>
                                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                              <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest italic">No Equipment Bound</span>
                            </div>
                          )}
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="finance">
                      <div className="space-y-6">
                         {/* Finance Summary Stats */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                               <h4 className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Paid</h4>
                               <span className="text-xl font-black text-slate-900 dark:text-white italic">₱{Number(formData.total_recharged_amount || 0).toLocaleString()}</span>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                               <h4 className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Active Days</h4>
                               <span className="text-xl font-black text-slate-900 dark:text-white italic">{formData.total_recharged_days} Days</span>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                               <h4 className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Avg per Recharge</h4>
                               <span className="text-xl font-black text-slate-900 dark:text-white italic">
                                  ₱{formData.recent_transactions.length > 0 ? (formData.total_recharged_amount / formData.recent_transactions.length).toFixed(2) : "0.00"}
                               </span>
                            </div>
                         </div>

                        <Card className="border-none bg-slate-50 dark:bg-slate-800/30 rounded-[24px] overflow-hidden transition-colors">
                          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                  <History size={20} />
                                </div>
                                <h3 className="font-black uppercase italic tracking-tight text-slate-900 dark:text-slate-100">Recent Transactions</h3>
                             </div>
                             <button
                               type="button"
                               onClick={() => router.push(`/customers/${customerId}/history`)}
                               className="flex items-center gap-2 text-[10px] font-black uppercase text-primary hover:underline transition-all"
                             >
                                Full History <ExternalLink size={12} />
                             </button>
                          </div>
                          <Table>
                            <TableHeader className="bg-slate-100/50 dark:bg-slate-800/50">
                              <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="px-8 font-black text-[8px] uppercase tracking-widest text-slate-400 text-right">Date/Time</TableHead>
                                <TableHead className="font-black text-[8px] uppercase tracking-widest text-slate-400">Action</TableHead>
                                <TableHead className="font-black text-[8px] uppercase tracking-widest text-slate-400">Amount</TableHead>
                                <TableHead className="font-black text-[8px] uppercase tracking-widest text-slate-400 text-right pr-8">Days</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formData.recent_transactions.length > 0 ? (
                                formData.recent_transactions.map((tx: any) => (
                                  <TableRow key={tx.transaction_id} className="border-none hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                                    <TableCell className="px-8 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400 text-right">
                                      <div className="flex flex-col items-end gap-0.5">
                                        <span>{tx.transaction_time?.replace('T', ' ').split(' ')[0]}</span>
                                        <span className="text-[9px] opacity-60">{tx.transaction_time?.replace('T', ' ').split(' ')[1]?.substring(0, 5)}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={cn(
                                        "border-none px-2 py-0.5 rounded-full font-black text-[8px] uppercase shadow-sm",
                                        tx.action_type === 'RECHARGE' ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400" : "bg-primary/10 text-primary"
                                      )}>
                                        {tx.action_type === 'RECHARGE' ? 'LOAD' : tx.action_type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-black text-slate-900 dark:text-slate-100 italic">₱{Number(tx.amount || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-right pr-8 font-bold text-slate-500 dark:text-slate-400">{tx.days}D</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="h-32 text-center italic text-slate-300 dark:text-slate-700 uppercase font-black text-[10px] tracking-widest">No transaction records found</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {isEditMode && (
                <div className="pt-10 animate-in zoom-in-95 duration-300">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-20 bg-primary text-slate-950 rounded-[24px] font-black uppercase text-lg shadow-2xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <>Commit Data Changes <CheckCircle2 /></>}
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
