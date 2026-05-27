'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Upload, Loader2, ArrowRight, CheckCircle2, Globe } from 'lucide-react';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RegionManagement } from '@/components/RegionManagement';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: 组织/公司信息状态
  const [compName, setCompName] = useState("");
  const [compTin, setCompTin] = useState("");
  const [compPhone, setCompPhone] = useState("");
  const [compEmail, setCompEmail] = useState("");
  const [compAddress, setCompAddress] = useState("");
  const [compLogo, setCompLogo] = useState<File | null>(null);
  const [compLogoPreview, setCompLogoPreview] = useState<string | null>(null);

  // 第一步提交逻辑
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", compName);
      formData.append("tin", compTin);
      if (compPhone) formData.append("phone", compPhone);
      if (compEmail) formData.append("email", compEmail);
      if (compAddress) formData.append("address", compAddress);
      if (compLogo) formData.append("logo", compLogo);

      await apiClient.patch('/provider/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success("Organization profile updated");
      setStep(2); // 成功后进入第二步
    } catch (err: any) {
      toast.error("Failed to update organization");
    } finally {
      setSubmitting(false);
    }
  };

  // 第二步完成逻辑
  const handleFinishSetup = () => {
    // 1. 明确获取并更新核心状态对象 shs_setup_status
    let currentStatus = { password_updated: true, region_set: true, provider_config_set: true };
    try {
      const storedStatus = localStorage.getItem('shs_setup_status');
      if (storedStatus) {
        currentStatus = { ...JSON.parse(storedStatus), region_set: true, provider_config_set: true };
      }
    } catch (e) {}

    const statusStr = JSON.stringify(currentStatus);
    localStorage.setItem('shs_setup_status', statusStr);
    const isAllSet = currentStatus.password_updated && currentStatus.region_set && currentStatus.provider_config_set;
    document.cookie = `shs_setup_status=${isAllSet ? 'completed' : encodeURIComponent(statusStr)}; path=/; max-age=31536000`;

    // 2. 清理掉之前步骤残留测试用的独立冗余标识，保持缓存干净
    ['is_initialized', 'region_set', 'provider_config_set'].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
      document.cookie = `${k}=; path=/; max-age=0`;
    });

    // 3. 同步修改可能存在于 user_info 等对象内的 setup_status 嵌套字段
    const fixJSON = (valStr: string) => {
      try {
        const parsed = JSON.parse(valStr);
        let changed = false;
        if (parsed.setup_status) {
          if (parsed.setup_status.region_set === false) { parsed.setup_status.region_set = true; changed = true; }
          if (parsed.setup_status.provider_config_set === false) { parsed.setup_status.provider_config_set = true; changed = true; }
        }
        return changed ? JSON.stringify(parsed) : valStr;
      } catch { return valStr; }
    };

    Object.keys(localStorage).forEach(key => {
      if (key !== 'shs_setup_status') {
        const val = localStorage.getItem(key);
        if (val && val.includes('region_set')) localStorage.setItem(key, fixJSON(val));
      }
    });
    document.cookie.split(';').forEach(c => {
      const [name, ...rest] = c.trim().split('=');
      if (name && name !== 'shs_setup_status' && rest.length) {
        const val = decodeURIComponent(rest.join('='));
        if (val.includes('region_set')) {
          const newVal = fixJSON(val);
          if (newVal !== val) document.cookie = `${name}=${encodeURIComponent(newVal)}; path=/; max-age=31536000`;
        }
      }
    });

    toast.success("System initialization complete!");
    // 使用原生 href 强制完整重载，确保 Middleware 读取到最新 cookie
    window.location.href = '/dashboard';
  };

    return (
      <div className="flex flex-col items-center justify-center gap-4 text-slate-300 h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Initializing Setup...</span>
      </div>
    );

  return (
    <div className="flex flex-col pt-[84px] md:pt-[116px] pb-6 px-4 overflow-x-hidden">
      <div className="max-w-[900px] w-full mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* 标题和步骤进度器 */}
        <div className="text-center space-y-2 mb-6 mt-[30px]">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100">
            System Initialization
          </h1>
          <p className="text-xs font-medium text-slate-400 italic">
            Complete the setup process to launch your platform
          </p>

          <div className="flex items-center justify-center gap-4 mt-6">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 transition-all ${step === 1 ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <span className="text-[12px] font-black">1</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Org</span>
            </div>
            <div className="w-8 h-[2px] bg-slate-200 dark:bg-slate-700" />
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 transition-all ${step === 2 ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <span className="text-[12px] font-black">2</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Regions</span>
            </div>
          </div>
        </div>

        {/* 第一步：公司信息 */}
        {step === 1 && (
          <form onSubmit={handleCompanySubmit} className="max-w-[650px] mx-auto w-full bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col animate-in slide-in-from-right-8 duration-500">
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6 border-b border-slate-50 pb-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Organization Logo</label>
                  <div className="relative group w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 shadow-inner">
                    {compLogoPreview ? (
                      <img src={compLogoPreview} className="w-full h-full object-cover" alt="logo preview" />
                    ) : (
                      <Building2 className="w-full h-full p-5 text-slate-200" />
                    )}
                    <label htmlFor="p-logo" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload size={20} className="text-white" />
                    </label>
                    <input id="p-logo" type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { setCompLogo(file); const reader = new FileReader(); reader.onloadend = () => setCompLogoPreview(reader.result as string); reader.readAsDataURL(file); }
                      }} 
                    />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-black text-slate-900 italic tracking-tight uppercase leading-none">Identity Assets</p>
                  <p className="text-slate-400 text-[10px] mt-2 font-medium italic leading-relaxed max-w-md">
                    Update your organization logo and visual branding. <br/>
                    Recommended: Square PNG/JPG (1024x1024), max 2MB.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Company Name</label><Input value={compName} onChange={e => setCompName(e.target.value)} required className="h-12 w-full rounded-xl bg-slate-50/50 border-slate-100 focus:ring-slate-950 font-bold text-sm px-4" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tax ID (TIN)</label><Input value={compTin} onChange={e => setCompTin(e.target.value)} required className="h-12 w-full rounded-xl bg-slate-50/50 border-slate-100 px-4 font-bold text-sm" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Phone Number</label><Input value={compPhone} onChange={e => setCompPhone(e.target.value)} className="h-12 w-full rounded-xl bg-slate-50/50 border-slate-100 px-4 font-bold text-sm" /></div>
                <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Official Email</label><Input value={compEmail} type="email" onChange={e => setCompEmail(e.target.value)} className="h-12 w-full rounded-xl bg-slate-50/50 border-slate-100 px-4 font-bold text-sm" /></div>
                <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Office Address</label><Input value={compAddress} onChange={e => setCompAddress(e.target.value)} className="h-12 w-full rounded-xl bg-slate-50/50 border-slate-100 px-4 font-bold text-sm" /></div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-end gap-4">
              <Button disabled={submitting} className="h-10 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black dark:hover:bg-primary dark:hover:text-slate-950 transition-all active:scale-95 gap-2">
                {submitting ? <Loader2 className="animate-spin" /> : <>Next Step: Setup Regions <ArrowRight size={14}/></>}
              </Button>
            </div>
          </form>
        )}

        {/* 第二步：设置地区 */}
        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-8 duration-500">
            <RegionManagement isCompact />
            <div className="flex items-center justify-between mt-4">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} className="h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900">
                Back to Organization
              </Button>
              <Button onClick={handleFinishSetup} className="h-10 px-8 bg-primary text-slate-950 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary/90 transition-all active:scale-95 gap-2">
                Complete Setup <CheckCircle2 size={14}/>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}