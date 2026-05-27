'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Loader2, ChevronRight, 
  UserCircle2, FileSpreadsheet, Hash, Zap
} from 'lucide-react';
import Link from 'next/link';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";

import Breadcrumbs from '@/components/Breadcrumbs'; // 根据你的实际路径修改

export default function CreateCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    card_number: '',
    card_uuid: '',
    // 如果后端仍需要 region_id，可以设置一个默认值或通过其他方式获取
    region_id: 1, 
  });

  // --- 批量上传逻辑：保持原始布局与交互 ---
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    setLoading(true);
    const toastId = toast.loading("System uploading spreadsheet...");

    try {
      await apiClient.post('/card/import', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Batch import successful", { id: toastId });
      setTimeout(() => router.push('/devices/card'), 1000);
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
      await apiClient.post('/card/create', formData);
      toast.success("Card created successfully");
      setTimeout(() => router.push('/devices/card'), 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-6 tracking-tighter">
      <div className="max-w-[800px] mx-auto space-y-6">
        
        {/* Breadcrumbs - 1:1 还原 */}
        <Breadcrumbs
        items={[
          { label: 'IC Card', href: '/devices/card' },
          { label: 'Create IC Card' } 
        ]}
      />

        {/* --- 1. Excel 批量上传 - 1:1 还原样式，仅移除 region 判断 --- */}
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
              "group cursor-pointer bg-white dark:bg-slate-900/60 border-2 border-dashed border-slate-200 rounded-xl p-8 transition-all hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-3",
              loading && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-slate-400">
              {loading ? <Loader2 className="animate-spin text-primary" size={28} /> : <FileSpreadsheet size={28} />}
            </div>
            <div className="text-center">
              <h4 className="text-lg font-black italic uppercase text-slate-900">Batch Import via Excel</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">
                Upload your asset manifest spreadsheet
              </p>
            </div>
          </label>
        </div>

        {/* --- 2. 手动表单 - 1:1 还原内容区域 --- */}
        <div className="bg-white dark:bg-slate-900/60 rounded-xl p-10 md:p-14 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-12 border-b border-slate-50 pb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 text-slate-900">
              <Zap size={24} />
            </div>
            <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Card Specifications</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 使用同样的 grid 布局 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Card Serial Number</label>
                <div className="relative">
                  <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    required 
                    className="w-full h-16 pl-14 pr-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-primary focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-lg transition-all text-slate-900 dark:text-slate-100"
                    value={formData.card_number} 
                    onChange={(e) => setFormData({...formData, card_number: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Internal UUID</label>
                <div className="relative">
                  <Zap className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    required 
                    className="w-full h-16 pl-14 pr-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-primary focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-lg transition-all text-slate-900 font-mono"
                    value={formData.card_uuid} 
                    onChange={(e) => setFormData({...formData, card_uuid: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* Submit Button - 1:1 还原样式 */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-20 bg-primary text-slate-950 rounded-xl font-black uppercase text-lg shadow-xl shadow-primary/20 active:scale-[0.98] hover:opacity-90 transition-all flex items-center justify-center gap-4 mt-6 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <>Register Asset <CheckCircle2 size={24} /></>}
            </button>
          </form>
        </div>

        {/* 安全提示区域，填补移除地区后的视觉空白 */}
        <div className="px-4 py-2 text-center">
            <p className="text-[9px] font-black uppercase text-slate-200 tracking-[0.5em]">Inventory Management System Protocol v3.0</p>
        </div>

      </div>
    </div>
  );
}