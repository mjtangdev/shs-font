'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Upload, Loader2, ArrowLeft, Save } from 'lucide-react';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-300">
        <Loader2 className="animate-spin text-yellow-400" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Loading Identity Assets...</span>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 md:px-[60px] max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <Breadcrumbs 
        items={[
          { label: 'branches', href: '/settings/branches' },
          { label: 'edit organization' }
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">Organization Profile</h1>
          <p className="text-sm font-medium text-slate-400 italic">Manage your global business identity and branding</p>
        </div>
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl gap-2 font-bold uppercase text-[10px] tracking-widest italic">
          <ArrowLeft size={16} /> Back
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 md:p-12 space-y-12">
          {/* Logo Section */}
          <div className="flex flex-col md:flex-row items-center gap-10 border-b border-slate-50 pb-12">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Organization Logo</label>
              <div className="relative group w-32 h-32 rounded-[2.5rem] bg-slate-50 border border-slate-100 overflow-hidden shrink-0 shadow-inner">
                {compLogoPreview ? (
                  <img src={compLogoPreview} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-full h-full p-10 text-slate-200" />
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
              <p className="text-sm font-black text-slate-900 italic tracking-tight uppercase leading-none">Identity Assets</p>
              <p className="text-slate-400 text-xs mt-3 font-medium italic leading-relaxed max-w-md">
                Update your organization logo and visual branding. <br/>
                Recommended: Square PNG/JPG (1024x1024), max 2MB.
              </p>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Full Company Name</label>
              <Input value={compName} onChange={e => setCompName(e.target.value)} required className="h-16 w-full rounded-[1.5rem] bg-slate-50/50 border-slate-100 focus:ring-slate-950 font-bold text-lg px-6" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Tax ID (TIN)</label>
              <Input value={compTin} onChange={e => setCompTin(e.target.value)} required className="h-16 w-full rounded-[1.5rem] bg-slate-50/50 border-slate-100 px-6 font-bold" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Phone Number</label>
              <Input value={compPhone} onChange={e => setCompPhone(e.target.value)} className="h-16 w-full rounded-[1.5rem] bg-slate-50/50 border-slate-100 px-6 font-bold" />
            </div>
            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Official Email</label>
              <Input value={compEmail} type="email" onChange={e => setCompEmail(e.target.value)} className="h-16 w-full rounded-[1.5rem] bg-slate-50/50 border-slate-100 px-6 font-bold" />
            </div>
            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Office Address</label>
              <Input value={compAddress} onChange={e => setCompAddress(e.target.value)} className="h-16 w-full rounded-[1.5rem] bg-slate-50/50 border-slate-100 px-6 font-bold" />
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => router.back()} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900">
            Discard Changes
          </Button>
          <Button disabled={submitting} className="h-14 px-10 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 gap-2">
            {submitting ? <Loader2 className="animate-spin" /> : <><Save size={16}/> Save Organization Profile</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
