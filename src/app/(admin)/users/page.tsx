'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, List, UserPlus, Search, 
  UserCircle2, Building2, Edit2, Home, 
  ChevronRight, Loader2, Construction, Wallet, Shield,
  Mail, Phone, Filter
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import Breadcrumbs  from "@/components/Breadcrumbs"
         

/**
 * ROLE_MAP: Definitive Role styles and icons
 * 角色映射：定义各角色的颜色、图标及文案
 * 1: Admin (Black), 2: Finance (Green), 3: Operator (Blue)
 */
const ROLE_MAP: Record<number, { label: string, color: string, activeColor: string, icon: React.ReactNode }> = {
  1: { 
    label: 'ADMIN', 
    color: 'text-slate-400 border-transparent hover:text-slate-900', 
    activeColor: 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-200',
    icon: <UserCircle2 size={10} /> 
  },
  2: { 
    label: 'FINANCE', 
    color: 'text-slate-400 border-transparent hover:text-emerald-600', 
    activeColor: 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100',
    icon: <Wallet size={10} /> 
  },
  3: { 
    label: 'OPERATOR', 
    color: 'text-slate-400 border-transparent hover:text-blue-600', 
    activeColor: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100',
    icon: <Shield size={10} /> 
  }
};

interface UserRecord {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  role: number;
  position?: string;
  is_active: boolean;
  entity_name?: string;
}

export default function UsersPage() {
  // State Management | 状态管理
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all'); // Flat Filter State | 扁平筛选状态
  const [showDevModal, setShowDevModal] = useState(false);

  /**
   * Data Fetching | 获取用户数据
   */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/user/');
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setUsers(data);
    } catch (err) {
      toast.error("DATA SYNC ERROR: Registry access denied.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Combined Filter Logic | 复合筛选逻辑
   * Filters by search query and role selection | 同时通过搜索词和角色进行过滤
   */
  const filteredUsers = users.filter(u => {
    const searchStr = searchQuery.toLowerCase();
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const matchesSearch = u.username.toLowerCase().includes(searchStr) || fullName.includes(searchStr);
    const matchesRole = roleFilter === 'all' || u.role.toString() === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="py-8 px-6 md:px-[60px] max-w-[1920px] mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* 1. Breadcrumbs | 面包屑导航 */}
      <Breadcrumbs 
          items={[
            { label: 'Team ' } 
          ]}

        />

      {/* 2. Compact Control Panel | 紧凑型控制面板 */}
{/* 2. Control Panel - 增强视觉重心的 Search 区域 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-4 rounded-[32px]">
        
        {/* Left Side: Search & Filter */}
        <div className="flex items-center gap-6 flex-nowrap">
          {/* Search Box: 底部加粗黑线 + 加深文字颜色 */}
          <div className="relative w-full lg:w-[480px] group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="SEARCH PROTOCOL BY IDENTITY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 h-[64px] bg-transparent border-b-2 border-slate-900 text-[11px] font-black uppercase tracking-[0.2em] outline-none transition-all text-slate-950 placeholder:text-slate-300"
            />
          </div>

          {/* Vertical Separator */}
          <div className="h-8 w-px bg-slate-100 hidden sm:block" />

          {/* Role Selector: 统一高度 h-[64px] */}
          <div className="flex items-center h-[64px] gap-1">
            <button 
              onClick={() => setRoleFilter('all')}
              className={cn(
                "px-8 h-full rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                roleFilter === 'all' 
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                  : "text-slate-400 hover:text-slate-950 hover:bg-slate-50"
              )}
            >
              ALL
            </button>
            
            {[1, 2, 3].map((rId) => (
              <button 
                key={rId}
                onClick={() => setRoleFilter(rId.toString())}
                className={cn(
                  "flex items-center gap-3 px-6 h-full rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                  roleFilter === rId.toString() 
                    ? ROLE_MAP[rId].activeColor 
                    : "text-slate-400 hover:text-slate-950 hover:bg-slate-50"
                )}
              >
                {ROLE_MAP[rId].icon}
                {ROLE_MAP[rId].label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: View Mode & Create */}
        <div className="flex items-center gap-4 h-[64px]">
          {/* View Toggle */}
          <div className="flex items-center h-full gap-1">
            <button 
              onClick={() => setViewMode('table')} 
              className={cn(
                "w-16 h-full rounded-2xl transition-all flex items-center justify-center",
                viewMode === 'table' 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
              )}
            >
              <List size={22} />
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={cn(
                "w-16 h-full rounded-2xl transition-all flex items-center justify-center",
                viewMode === 'grid' 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
              )}
            >
              <LayoutGrid size={22} />
            </button>
          </div>

          {/* Create Button */}
          <Link href="/users/create" className="h-full ml-2">
            <button className="flex items-center gap-3 px-12 h-full bg-slate-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.25em] hover:bg-yellow-400 hover:text-slate-900 transition-all shadow-2xl active:scale-95">
              <UserPlus size={20} /> REG. MEMBER
            </button>
          </Link>
        </div>
      </div>

      {/* 3. Main Registry Content | 主要数据展示区 */}
      {loading ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-slate-300">
          <Loader2 className="animate-spin text-yellow-400" size={40} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synching Directory...</span>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View | 表格视图 */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 px-8 leading-none">User Identity</th>
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 leading-none">Contact Protocol</th>
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 leading-none">Assignment & Role</th>
                <th className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 leading-none">Auth Status</th>
                <th className="text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-8 pr-12 leading-none">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50/30 transition-all">
                  <td className="py-7 px-8 flex items-center gap-5">
                    {/* Initial Avatar | 首字母头像 */}
                    <div className="flex flex-col">
                       <span className="font-black uppercase italic tracking-tighter text-slate-900 text-base leading-tight">
                         {user.first_name} {user.last_name}
                       </span>
                       <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                         @{user.username}
                       </span>
                    </div>
                  </td>
                  <td className="px-8">
                    <div className="flex flex-col gap-1.5 text-slate-500 font-bold text-[9px] uppercase italic tracking-tight">
                      <div className="flex items-center gap-2"><Mail size={10} className="text-slate-300" /> {user.email || 'N/A'}</div>
                      <div className="flex items-center gap-2"><Phone size={10} className="text-slate-300" /> {user.mobile}</div>
                    </div>
                  </td>
                  <td className="px-8">
                    <div className="flex flex-col gap-2">
                       {/* Role Badge | 角色标签 */}
                       <div className={cn(
                        "inline-flex w-fit items-center gap-1.5 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                        ROLE_MAP[user.role]?.color || ROLE_MAP[3].color
                      )}>
                        {ROLE_MAP[user.role]?.icon || ROLE_MAP[3].icon}
                        {ROLE_MAP[user.role]?.label || 'OPERATOR'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase italic tracking-tighter">
                        <Building2 size={12} className="text-yellow-500" />
                        {user.entity_name || 'CENTRAL SYSTEM'}
                      </div>
                    </div>
                  </td>
                  <td className="px-8">
                    <div className="flex items-center gap-2">
                       <div className={cn("w-1.5 h-1.5 rounded-full", user.is_active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-400")} />
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">
                         {user.is_active ? 'Authorized' : 'Suspended'}
                       </span>
                    </div>
                  </td>
                  <td className="py-7 px-8 pr-12 text-right">
                    <button onClick={() => setShowDevModal(true)} className="w-9 h-9 rounded-xl border border-slate-100 inline-flex items-center justify-center text-slate-300 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View | 网格视图 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-12">
          {filteredUsers.map((user) => (
            <div key={user.id} onClick={() => setShowDevModal(true)} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative flex flex-col min-h-[320px] cursor-pointer group">
              <div className="absolute top-6 right-6">
                 <div className={cn("text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border", ROLE_MAP[user.role]?.color)}>
                  {ROLE_MAP[user.role]?.label}
                </div>
              </div>
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner text-slate-900 group-hover:bg-yellow-400 group-hover:scale-110 transition-all duration-500">
                <UserCircle2 size={28} />
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">@{user.username}</p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
                <div className="flex items-center gap-3 text-slate-900">
                  <Building2 size={14} className="text-yellow-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest italic">{user.entity_name || 'CENTRAL'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className={cn("text-[8px] font-black uppercase tracking-widest", user.is_active ? "text-green-600" : "text-red-400")}>
                    {user.is_active ? 'Active Protocol' : 'Restricted'}
                  </div>
                  <Edit2 size={12} className="text-slate-100 group-hover:text-slate-900 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Development Modal | 开发中模态框 --- */}
      <Dialog open={showDevModal} onOpenChange={setShowDevModal}>
        <DialogContent className="max-w-[400px] rounded-2xl border-none bg-white p-0 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="h-2 bg-yellow-400" />
          <div className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-900 ring-8 ring-slate-50/50">
              <Construction size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Protocol Restricted</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Modification logic is currently locked <br/> for secure deployment phase.
              </p>
            </div>
            <button onClick={() => setShowDevModal(false)} className="w-full h-14 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-yellow-400 hover:text-slate-900 transition-all shadow-xl">
              Confirm Awareness
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}