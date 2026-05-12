'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Loader2, ChevronRight, 
  FileSpreadsheet, Hash, Zap, MapPin, TabletSmartphone
} from 'lucide-react';
import Link from 'next/link';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";

import Breadcrumbs from '@/components/Breadcrumbs'; 

export default function CreatePOSPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    pos_sn: '',        // 对应后端字段 pos_sn
    region_id: null,   // 地区暂时为 null，因为功能在开发中
  });

  // 中文提示函数
  const handleDevAlert = () => {
    toast.info("功能正在开发中", {
      description: "地区选择模块正在调试校准中，请等待后续版本更新。",
      className: "font-bold text-[12px] tracking-tight",
    });
  };

  // --- 批量上传逻辑：适配 POS 接口 ---
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    setLoading(true);
    const toastId = toast.loading("系统正在上传 POS 资产清单...");

    try {
      await apiClient.post('/pos/import', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("批量导入成功", { id: toastId });
      setTimeout(() => router.push('/devices/pos'), 1000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "上传失败";
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
      // 提交到 /pos/
      await apiClient.post('/pos/create', formData);
      toast.success("POS 终端注册成功");
      setTimeout(() => router.push('/devices/pos'), 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "注册失败，请检查序列号是否重复");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-6 tracking-tighter">
      <div className="max-w-[800px] mx-auto space-y-6">
        
        {/* Breadcrumbs - 指向 POS 路径 */}
        <Breadcrumbs
          items={[
            { label: 'pos', href: '/devices/pos' },
            { label: 'Create POS' } 
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
              "group cursor-pointer bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 transition-all hover:border-yellow-400 hover:bg-yellow-50/30 flex flex-col items-center justify-center gap-3",
              loading && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-white transition-all text-slate-400">
              {loading ? <Loader2 className="animate-spin" size={28} /> : <FileSpreadsheet size={28} />}
            </div>
            <div className="text-center">
              <h4 className="text-lg font-black italic uppercase text-slate-900">Batch Import POS via Excel</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">
                Upload your terminal manifest spreadsheet
              </p>
            </div>
          </label>
        </div>

        {/* --- 2. 手动表单 --- */}
        <div className="bg-white rounded-xl p-10 md:p-14 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-12 border-b border-slate-50 pb-8">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg text-yellow-400">
              <TabletSmartphone size={24} />
            </div>
            <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">POS Specifications</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* POS SN 输入框 */}
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Terminal Serial Number (SN)</label>
                <div className="relative">
                  <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    required 
                    placeholder="ENTER POS SN..."
                    className="w-full h-16 pl-14 pr-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl focus:border-yellow-400 focus:bg-white outline-none font-bold text-lg transition-all text-slate-900" 
                    value={formData.pos_sn} 
                    onChange={(e) => setFormData({...formData, pos_sn: e.target.value})} 
                  />
                </div>
              </div>

              {/* Region 选择框 - 点击触发开发中提示 */}
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Deployment Region</label>
                <div className="relative cursor-pointer" onClick={handleDevAlert}>
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <div className="w-full h-16 pl-14 pr-6 border-2 border-slate-100 bg-slate-50/50 rounded-xl flex items-center font-bold text-lg text-slate-300 select-none">
                    SELECT REGION...
                  </div>
                </div>
              </div>

            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-20 bg-yellow-400 text-slate-900 rounded-xl font-black uppercase text-lg shadow-xl shadow-yellow-400/20 active:scale-[0.98] hover:bg-yellow-500 transition-all flex items-center justify-center gap-4 mt-6 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <>Register POS Asset <CheckCircle2 size={24} /></>}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 text-center">
            <p className="text-[9px] font-black uppercase text-slate-200 tracking-[0.5em]">Terminal Asset Management Protocol v3.0</p>
        </div>

      </div>
    </div>
  );
}