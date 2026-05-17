'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Loader2,
  FileSpreadsheet, Hash, UserCircle2, Shield, Search, ChevronDown, UserPlus, X
} from 'lucide-react';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";

import Breadcrumbs from '@/components/Breadcrumbs'; 
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface UserRecord {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: number;
}

export default function CreatePOSPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  const [formData, setFormData] = useState({
    pos_sn: '0310740090312319',
    assigned_user_id: 0,
    assigned_user_name: ''
  });

  // 获取用户列表 (根据后端模型：Role 2 是 Operator)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiClient.get('/user/');
        const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
        // 根据 shs-backend/app/models/users.py: 2 是 Operator
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

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    setLoading(true);
    const toastId = toast.loading("Uploading POS Manifest...");

    try {
      await apiClient.post('/pos/import', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Batch import successful", { id: toastId });
      setTimeout(() => router.push('/devices/pos'), 1000);
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
    if (!formData.pos_sn) return toast.error("POS SN is required");

    setLoading(true);
    try {
      await apiClient.post('/pos/create', {
        pos_sn: formData.pos_sn,
        assigned_user_id: formData.assigned_user_id || null
      });
      toast.success("POS Terminal registered successfully");
      setTimeout(() => router.push('/devices/pos'), 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed. Check if SN already exists.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPickerUsers = users.filter(u =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-transparent py-12 px-6 tracking-tighter">
      <div className="max-w-[800px] mx-auto space-y-6">
        
        <Breadcrumbs
          items={[
            { label: 'pos', href: '/devices/pos' },
            { label: 'Register Asset' }
          ]}
        />

        {/* --- 1. Excel 批量上传 --- */}
        <div>
          <input 
            type="file" id="excel-upload" className="hidden"
            accept=".xlsx,.xls" onChange={handleExcelUpload} disabled={loading}
          />
          <label 
            htmlFor="excel-upload"
            className={cn(
              "group cursor-pointer bg-white dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 transition-all hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-3",
              loading && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-slate-400">
              {loading ? <Loader2 className="animate-spin" size={28} /> : <FileSpreadsheet size={28} />}
            </div>
            <div className="text-center">
              <h4 className="text-lg font-black italic uppercase text-slate-900 dark:text-white">Batch Import POS Assets</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Upload manifest spreadsheet</p>
            </div>
          </label>
        </div>

        {/* --- 2. 手动表单 --- */}
        <div className="bg-white dark:bg-slate-900/60 rounded-[2rem] p-10 md:p-14 shadow-sm border border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-4 mb-12 border-b border-slate-50 dark:border-white/5 pb-8">
            <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg text-primary">
              <Shield size={24} />
            </div>
            <h2 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white tracking-tighter">Terminal Specifications</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Terminal Serial (SN)</label>
                <div className="relative">
                  <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={20} />
                  <input 
                    required placeholder="ENTER POS SN..."
                    className="w-full h-16 pl-14 pr-6 border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl focus:border-primary focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-lg transition-all text-slate-900 dark:text-slate-100"
                    value={formData.pos_sn} 
                    onChange={(e) => setFormData({...formData, pos_sn: e.target.value})} 
                  />
                </div>
              </div>

              {/* User Picker Dialog */}
              <div className="space-y-3">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">Assign Operator</label>
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
                    <DialogContent className="max-w-[480px] p-0 border-none rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 shadow-2xl">
                        <DialogHeader className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-b dark:border-white/5">
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                                <UserPlus className="text-primary" /> Select Operator
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <Input
                                    placeholder="SEARCH OPERATOR BY NAME..."
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                    className="pl-11 h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest"
                                />
                            </div>
                            <ScrollArea className="h-[350px] pr-4">
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({...formData, assigned_user_id: 0, assigned_user_name: 'STOCK (UNASSIGNED)'});
                                            setIsPickerOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all border",
                                            formData.assigned_user_id === 0 ? "bg-primary text-white border-transparent" : "hover:bg-slate-50 dark:hover:bg-white/5 border-transparent text-slate-400"
                                        )}
                                    >
                                        <span className="font-bold text-sm uppercase tracking-widest">STOCK (UNASSIGNED)</span>
                                        {formData.assigned_user_id === 0 && <CheckCircle2 size={18} />}
                                    </button>

                                    {filteredPickerUsers.map(user => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    assigned_user_id: user.id,
                                                    assigned_user_name: `${user.first_name} ${user.last_name}`
                                                });
                                                setIsPickerOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all border",
                                                formData.assigned_user_id === user.id ? "bg-primary text-white border-transparent" : "hover:bg-slate-50 dark:hover:bg-white/5 border-transparent"
                                            )}
                                        >
                                            <div className="flex flex-col text-left">
                                                <span className={cn("font-black italic uppercase tracking-tight text-base", formData.assigned_user_id === user.id ? "text-white" : "text-slate-900 dark:text-white")}>
                                                    {user.first_name} {user.last_name}
                                                </span>
                                                <span className={cn("text-[9px] font-bold uppercase tracking-widest", formData.assigned_user_id === user.id ? "text-white/60" : "text-slate-400")}>
                                                    @{user.username}
                                                </span>
                                            </div>
                                            {formData.assigned_user_id === user.id && <CheckCircle2 size={20} />}
                                        </button>
                                    ))}
                                    {filteredPickerUsers.length === 0 && !fetchingUsers && (
                                        <div className="py-20 text-center opacity-30">
                                            <Search size={40} className="mx-auto mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No operators found</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </DialogContent>
                </Dialog>
              </div>

            </div>

            <button
              type="submit" disabled={loading}
              className="w-full h-20 bg-primary text-white dark:text-slate-900 rounded-2xl font-black uppercase text-lg shadow-xl shadow-primary/20 active:scale-[0.98] hover:opacity-90 transition-all flex items-center justify-center gap-4 mt-6 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <>Authorize Registration <CheckCircle2 size={24} /></>}
            </button>
          </form>
        </div>

        <div className="px-4 py-2 text-center">
            <p className="text-[9px] font-black uppercase text-slate-200 dark:text-slate-800 tracking-[0.5em]">Terminal Asset Management Protocol v3.2</p>
        </div>

      </div>
    </div>
  );
}
