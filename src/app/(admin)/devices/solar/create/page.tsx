'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Loader2, 
  FileSpreadsheet, Hash, Zap, Cpu, Radio, Flashlight, Lightbulb, Calendar
} from 'lucide-react';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";
import Breadcrumbs from '@/components/Breadcrumbs';

export default function CreateSolarDevicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // 增加 production_date 字段初始状态
  const [formData, setFormData] = useState({
    shs_machine_id: '',
    solar_equipment_id: '',
    radio_id: '',
    flashlight_id: '',
    led_light_id: '',
    production_date: '', // 新增字段
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
      await apiClient.post('/solar_device/create', formData);
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
              "group cursor-pointer bg-white border-2 border-dashed border-slate-200 rounded-[24px] p-10 transition-all hover:border-yellow-400 hover:bg-yellow-50/30 flex flex-col items-center justify-center gap-3",
              loading && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-white transition-all text-slate-400 shadow-inner">
              {loading ? <Loader2 className="animate-spin" size={32} /> : <FileSpreadsheet size={32} />}
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
        <div className="bg-white rounded-[32px] p-10 md:p-16 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          
          <div className="flex items-center gap-6 mb-16 border-b border-slate-50 pb-10">
            <div className="w-16 h-16 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-2xl shadow-slate-300 text-yellow-400">
              <Cpu size={32} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">Hardware Provisioning</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Asset Registration Protocol v4.2</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            
            <div className="space-y-4">
              <label className="text-[13px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1 flex items-center gap-2">
                <Hash size={14} className="text-yellow-500" /> Master Machine ID (SHS-SN)
              </label>
              <input 
                required 
                placeholder="22222"
                className="w-full h-20 pl-8 pr-6 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-slate-900 focus:bg-white outline-none font-black text-2xl transition-all text-slate-900 font-mono shadow-inner" 
                value={formData.shs_machine_id} 
                onChange={(e) => setFormData({...formData, shs_machine_id: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                  <Zap size={14} /> Solar Equipment ID
                </label>
                <div className="relative group">
                  <input 
                    required 
                    placeholder="22223"
                    className="w-full h-16 pl-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white outline-none font-bold text-lg transition-all text-slate-900 font-mono group-hover:border-slate-200" 
                    value={formData.solar_equipment_id} 
                    onChange={(e) => setFormData({...formData, solar_equipment_id: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                  <Radio size={14} /> Radio Component ID
                </label>
                <div className="relative group">
                  <input 
                    required 
                    placeholder="22224"
                    className="w-full h-16 pl-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white outline-none font-bold text-lg transition-all text-slate-900 font-mono group-hover:border-slate-200" 
                    value={formData.radio_id} 
                    onChange={(e) => setFormData({...formData, radio_id: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                  <Flashlight size={14} /> Flashlight Unit ID
                </label>
                <div className="relative group">
                  <input 
                    required 
                    placeholder="22225"
                    className="w-full h-16 pl-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white outline-none font-bold text-lg transition-all text-slate-900 font-mono group-hover:border-slate-200" 
                    value={formData.flashlight_id} 
                    onChange={(e) => setFormData({...formData, flashlight_id: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                  <Lightbulb size={14} /> LED Light Component ID
                </label>
                <div className="relative group">
                  <input 
                    required 
                    placeholder="22226"
                    className="w-full h-16 pl-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white outline-none font-bold text-lg transition-all text-slate-900 font-mono group-hover:border-slate-200" 
                    value={formData.led_light_id} 
                    onChange={(e) => setFormData({...formData, led_light_id: e.target.value})} 
                  />
                </div>
              </div>

              {/* 新增字段：Production Date - 使用 1/2 网格并保持样式一致 */}
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                  <Calendar size={14} /> Production Date
                </label>
                <div className="relative group">
                  <input 
                    required 
                    type="date"
                    className="w-full h-16 pl-6 pr-4 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white outline-none font-bold text-lg transition-all text-slate-900 group-hover:border-slate-200 uppercase" 
                    value={formData.production_date} 
                    onChange={(e) => setFormData({...formData, production_date: e.target.value})} 
                  />
                </div>
              </div>

            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-24 bg-yellow-400 text-slate-900 rounded-[20px] font-black uppercase text-xl shadow-2xl shadow-yellow-400/30 active:scale-[0.97] hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-6 mt-12 disabled:opacity-50 group"
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