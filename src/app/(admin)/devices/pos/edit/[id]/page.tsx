'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  CheckCircle2, Loader2, Hash, UserCircle2, Shield, Trash2, AlertCircle, Unlock, Lock, Building2, ChevronDown, Search, UserPlus
} from 'lucide-react';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";

import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface UserRecord {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: number;
}

export default function EditPOSPage() {
  const router = useRouter();
  const params = useParams();
  const posId = params.id;

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  const [formData, setFormData] = useState({
    pos_sn: '',
    assigned_user_id: 0,
    assigned_user_name: '',
    status: 0,
    lock_status: 0,
    branch_office: ''
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiClient.get('/user/');
        const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
        // Role 2 is Operator based on backend model
        const operators = data.filter((u: UserRecord) => u.role === 2);
        setUsers(operators);
      } catch (err) {
        toast.error("Failed to sync team directory");
      } finally {
        setFetchingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!posId) return;
    const fetchPosData = async () => {
      setFetchingData(true);
      try {
        const res = await apiClient.get(`/pos/check/${posId}`);
        if (res.data && res.data.exists) {
          setFormData({
            pos_sn: res.data.pos_sn || posId as string,
            assigned_user_id: res.data.assigned_user_id || 0,
            assigned_user_name: res.data.assigned_user_name || 'STOCK (UNASSIGNED)',
            status: res.data.status || 0,
            lock_status: res.data.lock_status || 0,
            branch_office: res.data.branch_office || ''
          });
        }
      } catch (err) {
        toast.error("Failed to load POS details");
      } finally {
        setFetchingData(false);
      }
    };
    fetchPosData();
  }, [posId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await apiClient.patch(`/pos/${posId}`, {
        assigned_user_id: formData.assigned_user_id || null,
        status: formData.status,
        lock_status: formData.lock_status,
        branch_office: formData.branch_office
      });
      toast.success("POS configuration updated");
      setTimeout(() => router.push('/devices/pos'), 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this POS asset?")) return;
    setLoading(true);
    try {
      await apiClient.delete(`/pos/${posId}`);
      toast.success("POS removed from assets");
      router.push('/devices/pos');
    } catch (err: any) {
      toast.error("Deletion failed");
      setLoading(false);
    }
  };

  const filteredPickerUsers = users.filter(u =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (fetchingData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-slate-300">
        <Loader2 className="animate-spin text-primary" size={40} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Loading Asset Data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-transparent py-12 px-6 tracking-tighter">
      <div className="max-w-[800px] mx-auto space-y-6">
        <Breadcrumbs items={[{ label: 'pos', href: '/devices/pos' }, { label: 'Edit Asset' }]} />

        <div className="bg-white dark:bg-slate-900/60 rounded-[2rem] p-10 md:p-14 shadow-sm border border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center justify-between mb-12 border-b border-slate-50 dark:border-white/5 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg text-primary"><Shield size={24} /></div>
              <div>
                <h2 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white tracking-tighter">Update Terminal</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">SN: {posId}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleDelete} className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={20} /></Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Custodian / Operator</label>
                <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                    <DialogTrigger asChild>
                        <button type="button" className="w-full h-16 px-6 border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-between group hover:border-primary transition-all text-left">
                           <div className="flex items-center gap-4">
                                <UserCircle2 className="text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors" size={20} />
                                <span className={cn("text-lg font-bold", formData.assigned_user_id ? "text-slate-900 dark:text-white" : "text-slate-300 italic")}>
                                    {formData.assigned_user_name || "Assign custodian..."}
                                </span>
                           </div>
                           <ChevronDown size={20} className="text-slate-300" />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[480px] p-0 border-none rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
                        <DialogHeader className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-b dark:border-white/5">
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                                <UserPlus className="text-primary" /> Select Operator
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <Input placeholder="SEARCH OPERATOR..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="pl-11 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest" />
                            </div>
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-2">
                                    <button type="button" onClick={() => { setFormData({...formData, assigned_user_id: 0, assigned_user_name: 'STOCK (UNASSIGNED)'}); setIsPickerOpen(false); }} className={cn("w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all border", formData.assigned_user_id === 0 ? "bg-primary text-white border-transparent" : "hover:bg-slate-50 dark:hover:bg-white/5 border-transparent text-slate-400")}>
                                        <span className="font-bold text-sm uppercase tracking-widest">STOCK (UNASSIGNED)</span>
                                    </button>
                                    {filteredPickerUsers.map(user => (
                                        <button key={user.id} type="button" onClick={() => { setFormData({...formData, assigned_user_id: user.id, assigned_user_name: `${user.first_name} ${user.last_name}`}); setIsPickerOpen(false); }} className={cn("w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all border", formData.assigned_user_id === user.id ? "bg-primary text-white border-transparent" : "hover:bg-slate-50 dark:hover:bg-white/5 border-transparent")}>
                                            <div className="flex flex-col text-left">
                                                <span className={cn("font-black italic uppercase tracking-tight text-base", formData.assigned_user_id === user.id ? "text-white" : "text-slate-900 dark:text-white")}>{user.first_name} {user.last_name}</span>
                                                <span className={cn("text-[9px] font-bold uppercase tracking-widest", formData.assigned_user_id === user.id ? "text-white/60" : "text-slate-400")}>@{user.username}</span>
                                            </div>
                                            {formData.assigned_user_id === user.id && <CheckCircle2 size={20} />}
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Current Status</label>
                <div className="relative">
                  <AlertCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={20} />
                  <select className="w-full h-16 pl-14 pr-6 border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl focus:border-primary focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-lg transition-all text-slate-900 dark:text-slate-100 appearance-none" value={formData.status} onChange={(e) => setFormData({...formData, status: parseInt(e.target.value)})}>
                    <option value={0}>IN STOCK</option>
                    <option value={1}>ACTIVATED</option>
                    <option value={3}>DAMAGED / RMA</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Security Control</label>
                <div className="relative">
                  {formData.lock_status === 0 ? <Unlock className="absolute left-6 top-1/2 -translate-y-1/2 text-green-500" size={20} /> : <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-red-500" size={20} />}
                  <select className={cn("w-full h-16 pl-14 pr-6 border-2 dark:border-slate-800 rounded-2xl outline-none font-bold text-lg transition-all appearance-none", formData.lock_status === 0 ? "bg-green-50/10 border-green-100/20 text-green-600 dark:text-green-400" : "bg-red-50/10 border-red-100/20 text-red-600 dark:text-red-400")} value={formData.lock_status} onChange={(e) => setFormData({...formData, lock_status: parseInt(e.target.value)})}>
                    <option value={0}>NORMAL (UNLOCKED)</option>
                    <option value={1}>ADMIN LOCKED</option>
                    <option value={2}>FINANCE LOCKED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Branch Office</label>
                <div className="relative">
                  <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={20} />
                  <input placeholder="Enter branch name..." className="w-full h-16 pl-14 pr-6 border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl focus:border-primary focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-lg transition-all text-slate-900 dark:text-slate-100" value={formData.branch_office} onChange={(e) => setFormData({...formData, branch_office: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="pt-6 flex gap-4">
                <button type="submit" disabled={loading} className="flex-1 h-20 bg-primary text-white dark:text-slate-900 rounded-2xl font-black uppercase text-lg shadow-xl shadow-primary/20 active:scale-[0.98] hover:opacity-90 transition-all flex items-center justify-center gap-4 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={24} /> : <>Commit Updates <CheckCircle2 size={24} /></>}</button>
                <Button type="button" variant="outline" onClick={() => router.push('/devices/pos')} className="h-20 px-10 rounded-2xl font-black uppercase text-slate-400 border-2">Cancel</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
