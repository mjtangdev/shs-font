'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  CheckCircle2, Loader2, Hash, CreditCard, Trash2, AlertCircle, ArrowLeft, UserCircle2, MapPin, Activity
} from 'lucide-react';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";

import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<number, string> = {
  0: 'IN STOCK',
  1: 'ACTIVATED',
  2: 'LOST',
  3: 'DAMAGED'
};

export default function EditCardPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.id;

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    card_number: '',
    card_uuid: '',
    status: 0,
    status_label: '',
    customer_name: '',
    customer_uuid: '',
    region_name: ''
  });

  useEffect(() => {
    setUserRole(localStorage.getItem("user_role"));
  }, []);

  useEffect(() => {
    if (!cardId) return;
    const fetchCardData = async () => {
      setFetchingData(true);
      try {
        const res = await apiClient.get('/card/', { params: { limit: 10000 } });
        const cards = res.data.items || [];
        const card = cards.find((c: any) => c.id === parseInt(cardId as string));

        if (card) {
          setFormData({
            card_number: card.card_number || '',
            card_uuid: card.card_uuid,
            status: card.status,
            status_label: STATUS_LABELS[card.status] || 'UNKNOWN',
            customer_name: card.customer_name,
            customer_uuid: card.customer_uuid,
            region_name: card.city_name ? `${card.city_name} / ${card.town_name}` : 'UNASSIGNED'
          });
        } else {
          toast.error("Card not found");
          router.push('/devices/card');
        }
      } catch {
        toast.error("Failed to load card details");
      } finally {
        setFetchingData(false);
      }
    };
    fetchCardData();
  }, [cardId, router]);

  const isActivated = formData.status === 1;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isActivated) {
      toast.error("Activated cards cannot be edited on web frontend");
      return;
    }
    setLoading(true);
    try {
      await apiClient.put(`/card/${cardId}`, {
        card_number: formData.card_number || null,
        status: Number(formData.status)
      });
      toast.success("Card identity and status updated");
      setTimeout(() => router.push('/devices/card'), 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this IC Card from registry?")) return;
    setLoading(true);
    try {
      await apiClient.delete(`/card/${cardId}`);
      toast.success("Card removed from assets");
      router.push('/devices/card');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Deletion failed. Note: Active cards cannot be deleted.");
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-slate-300">
        <Loader2 className="animate-spin text-primary" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Validating RFID Identity...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-transparent py-12 px-6 tracking-tighter">
      <div className="max-w-[700px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs items={[{ label: 'ic cards', href: '/devices/card' }, { label: 'Modify Identity' }]} />
          <button onClick={() => router.push('/devices/card')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft size={14} /> Back to Assets
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 dark:border-white/5">
          {/* Header */}
          <div className="p-10 md:p-14 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20"><CreditCard size={32} /></div>
              <div>
                <h2 className="text-3xl font-black italic uppercase text-slate-900 dark:text-white tracking-tighter">Modify Card</h2>
                <div className="flex items-center gap-3 mt-1">
                   <Badge variant="outline" className={cn(
                     "font-black text-[9px] uppercase px-2.5 py-0.5",
                     isActivated ? "bg-primary/10 text-primary border-primary/20" :
                     formData.status === 2 ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400" :
                     formData.status === 3 ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400" :
                     "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                   )}>
                     {STATUS_LABELS[formData.status] || formData.status_label}
                   </Badge>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">UID: {formData.card_uuid}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
               {(userRole === "1" || userRole === "3") && !isActivated && (
                 <Button variant="ghost" onClick={handleDelete} className="w-12 h-12 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"><Trash2 size={24} /></Button>
               )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 md:p-14 space-y-10">
            {/* Warning Banner for Activated Card */}
            {isActivated && (
              <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center gap-4 text-amber-600 dark:text-amber-400">
                <AlertCircle size={28} className="shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-black uppercase tracking-wider">Web Modification Disabled / 网页端不可修改</p>
                  <p className="text-[11px] font-bold opacity-90 leading-relaxed">
                    Cards in <span className="underline font-black">ACTIVATED</span> status (已激活) cannot be edited on web frontend.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-8">
              {/* Card Number Input */}
              <div className="space-y-3 group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-primary transition-colors ml-1">Physical Card Number (Surface Print)</label>
                <div className="relative">
                  <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={24} />
                  <input
                    required
                    disabled={isActivated}
                    placeholder="ENTER CARD NO..."
                    className={cn(
                      "w-full h-20 pl-16 pr-8 border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl font-black text-2xl transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-200 outline-none",
                      isActivated ? "opacity-50 cursor-not-allowed" : "focus:border-primary focus:bg-white dark:focus:bg-slate-900"
                    )}
                    value={formData.card_number}
                    onChange={(e) => setFormData({...formData, card_number: e.target.value})}
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic ml-2">Note: Hardware UUID remains locked for system integrity.</p>
              </div>

              {/* Status Select Field */}
              <div className="space-y-3 group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-primary transition-colors ml-1">Card Status / 卡片状态</label>
                <div className="relative">
                  <Activity className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none" size={24} />
                  <select
                    disabled={isActivated || loading}
                    className={cn(
                      "w-full h-20 pl-16 pr-8 border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl font-black text-lg transition-all text-slate-900 dark:text-slate-100 outline-none appearance-none cursor-pointer",
                      isActivated ? "opacity-50 cursor-not-allowed" : "focus:border-primary focus:bg-white dark:focus:bg-slate-900"
                    )}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                  >
                    {isActivated ? (
                      <option value={1}>1 - ACTIVATED (已激活)</option>
                    ) : (
                      <>
                        <option value={0}>0 - IN STOCK (库存)</option>
                        <option value={2}>2 - LOST (挂失)</option>
                        <option value={3}>3 - DAMAGED (损坏)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Ownership Info - Read Only */}
              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-[2rem] p-8 border border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2"><UserCircle2 size={12} /> Current Owner</label>
                    <p className="text-lg font-black italic uppercase text-slate-900 dark:text-slate-100 truncate">{formData.customer_name || 'UNASSIGNED'}</p>
                    {formData.customer_uuid && <p className="text-[10px] font-mono text-slate-400">ID: {formData.customer_uuid}</p>}
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2"><MapPin size={12} /> Deployment</label>
                    <p className="text-lg font-black italic uppercase text-slate-900 dark:text-slate-100 truncate">{formData.region_name}</p>
                 </div>
              </div>
            </div>

            <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || isActivated}
                  className="flex-1 h-20 bg-primary text-slate-950 rounded-[1.5rem] font-black uppercase text-lg shadow-2xl shadow-primary/20 active:scale-[0.98] hover:opacity-90 transition-all flex items-center justify-center gap-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                   {loading ? <Loader2 className="animate-spin" size={24} /> : <>Commit Identity & Status Change <CheckCircle2 size={24} /></>}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
