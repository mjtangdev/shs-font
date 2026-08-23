'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Loader2, 
  FileSpreadsheet, Hash, Zap, Cpu, Radio, Flashlight, Lightbulb, Calendar, Layers,
  ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";
import Breadcrumbs from '@/components/Breadcrumbs';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- [INDUSTRIAL CALENDAR PICKER] ---
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function IndustrialCalendarPicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'calendar' | 'years'>('calendar');

  const now = useMemo(() => (value ? new Date(value) : new Date()), [value]);
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
    return Array.from({ length: 100 }, (_, i) => (current + 10) - i);
  }, []);

  const handleSelect = (date: Date) => {
    const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full h-[64px] pl-6 pr-4 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-primary focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-lg transition-all text-slate-900 group-hover:border-slate-200 uppercase flex items-center justify-between"
        >
          <span className={cn(value ? "text-slate-900 dark:text-slate-100" : "text-slate-300 dark:text-slate-600")}>
            {value ? `${MONTHS_EN[new Date(value).getMonth()]} ${new Date(value).getDate()}, ${new Date(value).getFullYear()}` : "SELECT DATE..."}
          </span>
          <Calendar size={18} className={cn("transition-colors", value ? "text-primary" : "text-slate-400")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 bg-white dark:bg-slate-950 border-none shadow-2xl rounded-[24px] overflow-hidden w-[340px] z-[100]" align="start">
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

        <div className="p-4 relative min-h-[300px] bg-white dark:bg-slate-950">
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
                     <button key={idx} type="button" onClick={() => handleSelect(d.date)} className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all", !d.current ? "text-slate-200 dark:text-slate-800 pointer-events-none opacity-20" : "text-slate-400 hover:bg-primary hover:text-slate-950", isSelected && "bg-primary text-slate-950 shadow-lg shadow-primary/20", isToday && !isSelected && "border border-primary/30 text-primary")}>
                       {d.day}
                     </button>
                   );
                 })}
               </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-white dark:bg-slate-950 z-20 p-2 animate-in slide-in-from-top duration-300">
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

export default function CreateSolarDevicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // 增加 production_date 字段初始状态
  const [formData, setFormData] = useState({
    shs_machine_id: '',
    production_date: '',
    status: 0, // 默认为 IN STOCK
  });

  // --- 批量上传逻辑 ---
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    setLoading(true);
    const toastId = toast.loading("System uploading SHS manifest...");

    try {
      await apiClient.post('/solar_device/import', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Batch import successful", { id: toastId });
      setTimeout(() => router.push('/devices/solar'), 1000);
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
    
    setLoading(true);
    try {
      // 按照用户需求，只上传主序列号、生产日期和状态
      const payload = {
        shs_machine_id: formData.shs_machine_id,
        production_date: formData.production_date,
        status: formData.status
      };
      await apiClient.post('/solar_device/create', payload);
      toast.success("Solar Unit registered successfully");
      setTimeout(() => router.push('/devices/solar'), 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-6 tracking-tighter">
      <div className="max-w-[900px] mx-auto space-y-6">
        
        <Breadcrumbs
          items={[
            { label: 'Solar Registry', href: '/devices/solar' },
            { label: 'Register New Unit' } 
          ]}
        />

        {/* --- 1. Excel 批量上传 --- */}
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
              "group cursor-pointer bg-white dark:bg-slate-900/60 border-2 border-dashed border-slate-200 rounded-[24px] p-10 transition-all hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-3",
              loading && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-slate-400 shadow-inner">
              {loading ? <Loader2 className="animate-spin text-primary" size={32} /> : <FileSpreadsheet size={32} />}
            </div>
            <div className="text-center">
              <h4 className="text-xl font-black italic uppercase text-slate-900 tracking-tight">SHS Batch Manifest Import</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mt-1">
                Drag and drop or click to upload asset spreadsheet
              </p>
            </div>
          </label>
        </div>

        {/* --- 2. 手动表单 --- */}
        <div className="bg-white dark:bg-slate-900/60 rounded-[32px] p-10 md:p-16 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          
          <div className="flex items-center gap-6 mb-16 border-b border-slate-50 pb-10">
            <div className="w-16 h-16 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-2xl shadow-slate-300 text-primary">
              <Cpu size={32} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">Hardware Provisioning</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Asset Registration Protocol v4.2</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* 主 ID 输入框 */}
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                  <Hash size={14} className="text-primary" /> Master Serial (S/N)
                </label>
                <input
                  required
                  placeholder="E.G. HT2026072000001"
                  className="w-full h-[64px] pl-6 pr-4 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-primary focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-lg transition-all text-slate-900 group-hover:border-slate-200 uppercase font-mono"
                  value={formData.shs_machine_id}
                  onChange={(e) => setFormData({...formData, shs_machine_id: e.target.value})}
                />
              </div>

              {/* 日期选择器 */}
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                  <Calendar size={14} className="text-primary" /> Production Date
                </label>
                <div className="relative group">
                  <IndustrialCalendarPicker
                    value={formData.production_date} 
                    onChange={(val) => setFormData({...formData, production_date: val})}
                  />
                </div>
              </div>
            </div>

            {/* 子 ID 展示区 - 独立一行 */}
            {formData.shs_machine_id && (
              <div className="p-8 bg-slate-50/80 dark:bg-slate-800/40 rounded-[24px] border border-slate-100 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Layers size={12} className="text-primary" /> Derived Component Identities
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Solar Equipment', suffix: '1', color: 'text-blue-500' },
                    { label: 'Radio Component', suffix: '2', color: 'text-purple-500' },
                    { label: 'Flashlight Unit', suffix: '3', color: 'text-orange-500' },
                    { label: 'LED Light Component', suffix: '4', color: 'text-emerald-500' }
                  ].map((item) => (
                    <div key={item.suffix} className="flex flex-col gap-2">
                      <span className={cn("text-[9px] font-black uppercase tracking-widest", item.color)}>{item.label}</span>
                      <div className="font-mono text-sm font-black text-slate-900 dark:text-slate-100 break-all bg-white dark:bg-slate-900 px-3 py-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-1 group/id relative overflow-hidden">
                        <span className="uppercase z-10">{formData.shs_machine_id}{item.suffix}</span>
                        <span className="text-[8px] text-slate-400 group-hover/id:text-primary transition-colors z-10">SUFFIX-{item.suffix}</span>
                        <div className={cn("absolute right-0 bottom-0 w-8 h-8 opacity-[0.03] group-hover/id:opacity-[0.1] transition-opacity flex items-center justify-center", item.color)}>
                          <Zap size={24} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-24 bg-primary text-slate-950 rounded-[20px] font-black uppercase text-xl shadow-2xl shadow-primary/20 active:scale-[0.97] hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-6 mt-12 disabled:opacity-50 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={32} />
              ) : (
                <>
                  Commit Device Registration 
                  <CheckCircle2 size={32} className="group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="px-4 py-8 text-center">
            <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.6em] leading-loose">
              Electrification Management System <br/>
              Hardware Identity Binding Security Layer Enabled
            </p>
        </div>

      </div>
    </div>
  );
}