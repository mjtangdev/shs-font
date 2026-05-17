'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Upload, Loader2, ArrowLeft, Save } from 'lucide-react';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function EditCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 表单状态
  const [compName, setCompName] = useState("");
  const [compTin, setCompTin] = useState("");
  const [compPhone, setCompPhone] = useState("");
  const [compEmail, setCompEmail] = useState("");
  const [compAddress, setCompAddress] = useState("");
  const [compLogo, setCompLogo] = useState<File | null>(null);
  const [compLogoPreview, setCompLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get('/provider/');
        if (res.data) {
          setCompName(res.data.name || "");
          setCompTin(res.data.tin || "");
          setCompPhone(res.data.phone || "");
          setCompEmail(res.data.email || "");
          setCompAddress(res.data.address || "");
          if (res.data.logo_url) {
            const baseUrl = (apiClient.defaults.baseURL || window.location.origin).split('/api')[0]?.replace(/\/$/, '') || '';
            const path = res.data.logo_url.startsWith('/') ? res.data.logo_url : `/${res.data.logo_url}`;
            setCompLogoPreview(`${baseUrl}${path}`);
          }
        }
      } catch (err) {
        toast.error("Failed to load organization data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
      toast.success("Organization profile updated successfully");
      router.push('/settings/branches');
    } catch (err: any) {
      toast.error("Failed to update organization");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center gap-4 text-slate-300 bg-[#f8fafc] dark:bg-slate-950">
        <Loader2 className="animate-spin text-primary" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Loading Identity Assets...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">

      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors">
        <Breadcrumbs
          items={[
            { label: 'branches', href: '/settings/branches' },
            { label: 'edit organization' }
          ]}
        />
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest italic">
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 overflow-y-auto p-10 bg-slate-50/50 dark:bg-transparent transition-colors">
        <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100 leading-none">Organization Profile</h1>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Manage your global business identity and branding</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border-none shadow-sm overflow-hidden flex flex-col">
              <div className="p-10 space-y-12">
                {/* Logo Section */}
                <div className="flex flex-col md:flex-row items-center gap-10 border-b border-slate-50 dark:border-white/5 pb-12">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-4">Organization Logo</label>
                    <div className="relative group w-32 h-32 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 overflow-hidden shrink-0 shadow-inner">
                      {compLogoPreview ? (
                        <img src={compLogoPreview} className="w-full h-full object-cover" alt="Logo preview" />
                      ) : (
                        <Building2 className="w-full h-full p-10 text-slate-200 dark:text-slate-700" />
                      )}
                      <label htmlFor="p-logo" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload size={24} className="text-white" />
                      </label>
                      <input
                        id="p-logo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCompLogo(file);
                            const reader = new FileReader();
                            reader.onloadend = () => setCompLogoPreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[12px] font-black text-slate-900 dark:text-white italic tracking-tight uppercase leading-none">Identity Assets</p>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-3 font-bold uppercase tracking-widest leading-relaxed max-w-md italic">
                      Update your organization logo and visual branding. <br/>
                      Recommended: Square PNG/JPG (1024x1024), max 2MB.
                    </p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-4">Full Company Name</label>
                    <Input value={compName} onChange={e => setCompName(e.target.value)} required className="h-14 w-full rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5 focus:ring-primary/20 font-black text-lg px-6 italic" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-4">Tax ID (TIN)</label>
                    <Input value={compTin} onChange={e => setCompTin(e.target.value)} required className="h-14 w-full rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5 px-6 font-bold" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-4">Phone Number</label>
                    <Input value={compPhone} onChange={e => setCompPhone(e.target.value)} className="h-14 w-full rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5 px-6 font-bold" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-4">Official Email</label>
                    <Input value={compEmail} type="email" onChange={e => setCompEmail(e.target.value)} className="h-14 w-full rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5 px-6 font-bold" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-4">Office Address</label>
                    <Input value={compAddress} onChange={e => setCompAddress(e.target.value)} className="h-14 w-full rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5 px-6 font-bold" />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-4">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900 transition-all">
                  Discard Changes
                </Button>
                <Button disabled={submitting} className="h-12 px-10 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 gap-2">
                  {submitting ? <Loader2 className="animate-spin" /> : <><Save size={16}/> Save Organization Profile</>}
                </Button>
              </div>
            </Card>
          </form>
        </div>
      </main>
    </div>
  );
}
