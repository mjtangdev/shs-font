'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Cpu, Zap, Radio, Flashlight, Lightbulb, Calendar,
  MapPin, Building2, UserCircle2, Loader2, RotateCcw, Trash2, Sun,
  Search, CheckCircle2, Lock, Unlock
} from 'lucide-react';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";
import Link from 'next/link';

import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUS_MAP: Record<number, { label: string, badgeVariant: string }> = {
  0: { label: 'IN STOCK', badgeVariant: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  1: { label: 'ACTIVATED', badgeVariant: "bg-primary/10 text-primary border-primary/20" },
  3: { label: 'DAMAGED', badgeVariant: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" }
};

interface SolarDeviceDetail {
  id: number;
  shs_machine_id: string;
  solar_equipment_id: string;
  radio_id: string;
  flashlight_id: string;
  led_light_id: string;
  status: number;
  customer_id?: number;
  customer_uuid?: string;
  customer_name?: string;
  city_name?: string;
  town_name?: string;
  region_id?: number;
  production_date?: string;
  created_at?: string;
  bound_at?: string;
  operator_username?: string;
}

export default function SolarDeviceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const unitId = params.id;

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<SolarDeviceDetail | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(localStorage.getItem("user_role"));
  }, []);

  const fetchDeviceDetail = useCallback(async () => {
    if (!unitId) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/solar_device/', { params: { limit: 10000 } });
      const items = res.data.items || res.data || [];
      const found = items.find((d: any) => d.id === parseInt(unitId as string));

      if (found) {
        setDevice(found);
      } else {
        toast.error("System Box not found");
        router.push('/devices/system-box');
      }
    } catch {
      toast.error("Failed to load device details");
    } finally {
      setLoading(false);
    }
  }, [unitId, router]);

  const handleReset = async () => {
    if (!device) return;
    if (!confirm(`Are you sure you want to reset device #${device.shs_machine_id}? This will unbind customer association and restore status to IN STOCK (0).`)) return;
    try {
      await apiClient.post(`/solar_device/${device.id}/reset`);
      toast.success("Device reset & unbound successfully");
      fetchDeviceDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Reset failed");
    }
  };

  const handleDelete = async () => {
    if (!device) return;
    if (!confirm(`Are you sure you want to remove Machine #${device.shs_machine_id} from registry?`)) return;
    try {
      await apiClient.delete(`/solar_device/${device.id}`);
      toast.success("Device removed from assets");
      router.push('/devices/system-box');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-slate-300">
        <Loader2 className="animate-spin text-primary" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Retrieving System Box Details...</span>
      </div>
    );
  }

  if (!device) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-transparent py-12 px-6 tracking-tighter">
      <div className="max-w-[1000px] mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Breadcrumbs items={[
            { label: 'System Box Registry', href: '/devices/system-box' },
            { label: `Master S/N: ${device.shs_machine_id}` }
          ]} />
          <button onClick={() => router.push('/devices/system-box')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Registry
          </button>
        </div>

        {/* Master Identity Card */}
        <Card className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] p-10 md:p-14 border border-slate-100 dark:border-white/5 shadow-sm space-y-10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 text-primary rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 shrink-0">
                <Cpu size={32} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black italic uppercase text-slate-900 dark:text-white tracking-tight font-mono">{device.shs_machine_id}</h1>
                  <Badge className={cn("px-3 py-1 rounded-full font-black text-[9px] uppercase border-none shadow-sm", STATUS_MAP[device.status]?.badgeVariant)}>
                    {STATUS_MAP[device.status]?.label || 'IN STOCK'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {device.status === 1 ? <Unlock size={12} className="text-green-500" /> : <Lock size={12} className="text-slate-400" />}
                  <span>{device.status === 1 ? "Active Protocol Bound" : "Standby / In Stock"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(userRole === "1" || userRole === "3") && (
                <Button variant="outline" onClick={handleReset} className="rounded-xl h-11 px-5 font-bold uppercase text-[10px] tracking-widest border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500">
                  <RotateCcw size={16} className="mr-2" /> Reset & Unbind
                </Button>
              )}
              {(userRole === "1" || userRole === "3") && device.status !== 1 && (
                <Button variant="ghost" onClick={handleDelete} className="w-11 h-11 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                  <Trash2 size={20} />
                </Button>
              )}
            </div>
          </div>

          {/* Hardware Components Grid */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Zap size={14} className="text-primary" /> Hardware Manifest Components
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Solar PV Panel Box */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                  <Sun size={24} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Solar PV Panel (S/N)</span>
                  <span className="font-mono text-base font-black text-slate-900 dark:text-slate-100">
                    {device.solar_equipment_id || <span className="text-slate-300 italic">Unbound</span>}
                  </span>
                </div>
              </div>

              {/* Radio Component */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center shrink-0">
                  <Radio size={24} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Radio Component</span>
                  <span className="font-mono text-base font-black text-slate-900 dark:text-slate-100">{device.radio_id || '-'}</span>
                </div>
              </div>

              {/* Flashlight Unit */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                  <Flashlight size={24} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Flashlight Unit</span>
                  <span className="font-mono text-base font-black text-slate-900 dark:text-slate-100">{device.flashlight_id || '-'}</span>
                </div>
              </div>

              {/* LED Light Component */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <Lightbulb size={24} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">LED Light Component</span>
                  <span className="font-mono text-base font-black text-slate-900 dark:text-slate-100">{device.led_light_id || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deployment & Customer Profile Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            {/* Deployment Region */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
                <MapPin size={12} /> Deployment Region & Operator
              </span>
              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-lg font-black uppercase italic text-slate-900 dark:text-slate-100">
                  {device.city_name || 'UNASSIGNED'} {device.town_name ? `/ ${device.town_name}` : ''}
                </div>
                {device.operator_username && (
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary font-mono bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    <UserCircle2 size={12} /> @{device.operator_username}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Binding Info */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
                <Building2 size={12} /> Assigned Customer Profile
              </span>
              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                {device.customer_id ? (
                  <Link href={`/customers/${device.customer_id}`} className="group flex items-center justify-between hover:opacity-80 transition-opacity">
                    <div>
                      <p className="text-lg font-black italic uppercase text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{device.customer_name || 'Bound Customer'}</p>
                      <p className="text-[10px] font-mono font-bold text-slate-400">UUID: {device.customer_uuid}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 font-black text-[8px] uppercase">Active Link</Badge>
                  </Link>
                ) : (
                  <div className="text-sm font-bold text-slate-300 dark:text-slate-700 italic">No Customer Profile Bound</div>
                )}
              </div>
            </div>
          </div>

          {/* System Protocol Timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1 flex items-center gap-1"><Calendar size={10} /> Production Date</span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{device.production_date?.split('T')[0] || device.production_date?.split(' ')[0] || '-'}</span>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Created At</span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{device.created_at?.replace('T', ' ').slice(0, 16) || '-'}</span>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Bound At</span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{device.bound_at?.replace('T', ' ').slice(0, 16) || '-'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
