'use client';

import React, { useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Loader2, ChevronLeft, ChevronRight,
  UserCircle2, MapPin, ChevronDown, Globe, FileSpreadsheet, Mail, Phone,
  Users, UserCheck, Heart, ArrowLeft, Calendar as CalendarIcon
} from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [view, setView] = useState<'calendar' | 'years' | 'months'>('calendar');

  const now = useMemo(() => (value ? new Date(value) : new Date(2000, 0, 1)), [value]);
  const [currentViewDate, setCurrentViewDate] = useState(now);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const arr = [];
    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      arr.push({ day: prevMonthDays - i, current: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    // Next month padding
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
        {/* Header */}
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
                     <button key={idx} type="button" onClick={() => handleSelect(d.date)} className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all", !d.current ? "text-slate-800 pointer-events-none opacity-20" : "text-slate-400 hover:bg-primary hover:text-slate-950", isSelected && "bg-primary text-slate-950 shadow-lg shadow-primary/20", isToday && !isSelected && "border border-primary/30 text-primary")}>
                       {d.day}
                     </button>
                   );
                 })}
               </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-slate-950 z-20 p-2 animate-in slide-in-from-top duration-300">
              <div className="text-[9px] font-black uppercase text-slate-500 p-2 mb-2">Jump to Year</div>
              <ScrollArea className="h-[240px]">
                <div className="grid grid-cols-3 gap-1 p-1">
                  {years.map(y => (
                    <button key={y} type="button" onClick={() => { setCurrentViewDate(new Date(y, month)); setView('calendar'); }} className={cn("py-3 rounded-xl text-xs font-black transition-all", year === y ? "bg-primary text-slate-950" : "bg-white/5 text-slate-500 hover:text-white")}>{y}</button>
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

export default function CreateCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fetchingRegions, setFetchingRegions] = useState(true);
  const [regions, setRegions] = useState<RegionNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  
  const [userRole, setUserRole] = useState<number | null>(null);

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
    beneficiary_count: 0,
    representative_name: '',
    rep_relationship: '-',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('user_role');
      const rId = localStorage.getItem('region_id');
      const rName = localStorage.getItem('region_name');

      const parsedRole = role ? parseInt(role, 10) : null;
      setUserRole(parsedRole);

      if (parsedRole === 2 && rId) {
        // 如果是业务员，自动填充其所属区域
        setFormData(prev => ({
          ...prev,
          region_id: parseInt(rId, 10),
          region_name: rName || 'Assigned Region'
        }));
      }
    }
  }, []);

  const fetchRegionData = useCallback(async () => {
    if (userRole === 2) {
      setFetchingRegions(false);
      return; // 业务员不需要拉取地区树
    }
    setFetchingRegions(true);
    try {
      const res = await apiClient.get('/org/regions/tree');
      const data = res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      setRegions(data);
      if (data.length > 0) {
        setExpandedIds([data[0].id]);
        if (!formData.region_id) setIsDialogOpen(true);
      }
    } catch (err) {
      toast.error("Failed to sync regional data");
    } finally {
      setFetchingRegions(false);
    }
  }, [formData.region_id]);

  useEffect(() => {
    fetchRegionData();
  }, [fetchRegionData]);

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
    if (!formData.birthday) return toast.error("Birthday is required");

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

  const renderTreeRows = (nodes: RegionNode[], parentName: string | null = null): ReactNode => {
    return nodes.map(node => {
      const isExpanded = expandedIds.includes(node.id);
      const hasChildren = node.children && node.children.length > 0;
      if (node.level === 0) return renderTreeRows(node.children, node.name);
      const isSelected = formData.region_id === node.id;

      return (
        <div key={node.id} className="select-none">
          <div 
            onClick={(e) => {
              if (hasChildren) {
                toggleExpand(node.id, e);
                return;
              }
              setFormData({
                ...formData,
                region_id: node.id,
                region_name: node.level === 1 ? node.name : `${parentName} > ${node.name}`
              });
              setIsDialogOpen(false);
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
                  isSelected ? "text-slate-950" : "text-slate-900 dark:text-slate-100 group-hover/row:text-slate-950"
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

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-12 px-6 tracking-tighter transition-colors">
      <div className="max-w-[800px] mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: 'customers', href: '/customers' },
              { label: 'Create Record' }
            ]}
          />
          <button onClick={() => router.push('/customers')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <ArrowLeft size={14} /> Back to List
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900/60 rounded-[32px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800/50 transition-colors">
          {/* Header Stripe - Matches Profile Style */}
          <div className="bg-slate-950 dark:bg-slate-900 p-10 md:p-14 text-white relative">
             <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl">
                   <UserCircle2 size={40} className="text-primary" />
                </div>
                <div className="space-y-2">
                   <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none text-white">
                     Register New Customer
                   </h1>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                     Establish a new service node in the SHS network
                   </p>
                </div>
             </div>
          </div>

          <div className="p-10 md:p-14 space-y-12">

            {/* Region Selection - Only visible to Admins */}
            {userRole !== 2 && (
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deployment Location</label>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="w-full h-20 px-8 border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl flex items-center justify-between group hover:border-primary transition-all text-left">
                      <div className="flex items-center gap-5">
                        <MapPin className="text-primary" size={24} />
                        <span className={cn("text-xl font-black italic uppercase", formData.region_id ? "text-slate-900 dark:text-slate-100" : "text-slate-300 dark:text-slate-600")}>
                          {formData.region_name || "Select target region..."}
                        </span>
                      </div>
                      <ChevronDown size={28} className="text-slate-300" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[520px] w-[95vw] p-0 border-none rounded-3xl shadow-2xl bg-white dark:bg-slate-900 outline-none overflow-hidden">
                    <DialogHeader className="p-10 border-b border-slate-50 dark:border-slate-800 shrink-0">
                      <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter dark:text-white">Regional Hierarchy</DialogTitle>
                      <DialogDescription className="sr-only">Select target region for deployment</DialogDescription>
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

            {/* Excel Upload Section */}
            <div className="pt-2">
              <input type="file" id="excel-upload" className="hidden" accept=".xlsx,.xls" onChange={handleExcelUpload} disabled={loading} />
              <label htmlFor="excel-upload" className="group cursor-pointer bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl p-8 transition-all hover:border-primary flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-slate-950 transition-all shadow-sm">
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <FileSpreadsheet size={24} />}
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">Bulk Import via Spreadsheet</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {userRole === 2 ? `Target: ${formData.region_name}` : "Select region above first"}
                  </p>
                </div>
              </label>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {[
                  { label: 'First Name', key: 'first_name', icon: UserCircle2, required: true, type: 'text' },
                  { label: 'Last Name', key: 'last_name', icon: UserCircle2, required: true, type: 'text' },
                ].map((field) => (
                  <div key={field.key} className="space-y-3 group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                      <field.icon size={12} /> {field.label} {field.required && "*"}
                    </label>
                    <input
                      required={field.required}
                      type={field.type || 'text'}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      className="w-full h-14 bg-transparent border-b-2 border-slate-100 dark:border-white/60 py-2 text-lg font-bold outline-none focus:border-primary dark:focus:border-primary transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-200 dark:placeholder:text-slate-500"
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({...formData, [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value})}
                    />
                  </div>
                ))}

                {/* Gender Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <Users size={12} /> Gender *
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 w-full h-14">
                    {[
                      { id: 'male', label: 'MALE' },
                      { id: 'female', label: 'FEMALE' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setFormData({...formData, gender: g.id})}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-3 rounded-xl text-[10px] font-black tracking-widest transition-all",
                          formData.gender === g.id
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                            : 'text-slate-400 hover:text-slate-500'
                        )}
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          formData.gender === g.id ? "bg-primary animate-pulse" : "bg-slate-300"
                        )} />
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Birthday Selection - MOVED HERE */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2"><CalendarIcon size={12} /> Birthday *</label>
                  <IndustrialCalendarPicker
                    value={formData.birthday}
                    onChange={(val) => setFormData({...formData, birthday: val})}
                  />
                </div>

                {[
                  { label: 'Mobile Number', key: 'mobile', icon: Phone, required: true, type: 'text' },
                  { label: 'Email Address', key: 'email', icon: Mail, required: false, type: 'email' },
                  { label: 'Beneficiary Count', key: 'beneficiary_count', icon: Users, required: false, type: 'number' },
                  { label: 'Representative Name', key: 'representative_name', icon: UserCheck, required: false, type: 'text' },
                ].map((field) => (
                  <div key={field.key} className="space-y-3 group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2 group-focus-within:text-primary transition-colors">
                      <field.icon size={12} /> {field.label} {field.required && "*"}
                    </label>
                    <input
                      required={field.required}
                      type={field.type || 'text'}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      className="w-full h-14 bg-transparent border-b-2 border-slate-100 dark:border-white/60 py-2 text-lg font-bold outline-none focus:border-primary dark:focus:border-primary transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-200 dark:placeholder:text-slate-500"
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({...formData, [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value})}
                    />
                  </div>
                ))}

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2"><Heart size={12} /> Relationship</label>
                  <select
                    className="w-full h-14 bg-transparent border-b-2 border-slate-100 dark:border-white/60 py-2 text-lg font-bold outline-none focus:border-primary dark:focus:border-primary transition-all text-slate-900 dark:text-slate-100 appearance-none"
                    value={formData.rep_relationship}
                    onChange={(e) => setFormData({...formData, rep_relationship: e.target.value})}
                  >
                    {['-', 'Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Relative', 'Other'].map(opt => <option key={opt} value={opt} className="dark:bg-slate-900">{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-50 dark:border-slate-800">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2"><MapPin size={12} /> Full Installation Address</label>
                  <textarea
                  required
                  placeholder="Enter detailed street address and landmarks..."
                  className="w-full bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 dark:text-slate-100 min-h-[120px] placeholder:text-slate-200 dark:placeholder:text-slate-800"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="pt-10 animate-in zoom-in-95 duration-300">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-20 bg-primary text-slate-950 rounded-[24px] font-black uppercase text-lg shadow-2xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Register Customer <CheckCircle2 /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
