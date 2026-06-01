'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, ChevronRight, ChevronDown, RefreshCw,
  Edit2, Globe, Building2, Home, Percent,
  Loader2, AlertCircle, MapPin, Settings2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import apiClient from '@/lib/axios';

// --- 接口定义 (Interfaces) ---
interface RegionNode {
  id: number;
  name: string;
  level: number;
  parent_id: number | null;
  children: RegionNode[];
  is_occupied: boolean;
  daily_rate: number;
}

interface RegionManagementProps {
  refreshTrigger?: number;
  isCompact?: boolean;
}

export const RegionManagement: React.FC<RegionManagementProps> = ({ refreshTrigger, isCompact }) => {
  const [regions, setRegions] = useState<RegionNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<number[]>([]); 

  const [globalRate, setGlobalRate] = useState(''); // 新增：全局费率UI状态
  const [isSyncing, setIsSyncing] = useState(false); // 全局同步状态

  // --- 状态管理 (State Management) ---
  const [isRootEditOpen, setIsRootEditOpen] = useState(false);     
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);       
  const [isAddTownOpen, setIsAddTownOpen] = useState(false);       
  const [isPlaceholderOpen, setIsPlaceholderOpen] = useState(false); // 占位：子层级重命名提示
  const [isRateEditOpen, setIsRateEditOpen] = useState(false);     // 新增：修改费率弹窗
  
  const [targetParent, setTargetParent] = useState<RegionNode | null>(null); 
  const [newName, setNewName] = useState('');                      
  const [isSubmitting, setIsSubmitting] = useState(false);          

  // --- 统一样式 (Unified Styles) ---
  const commonInputStyles = "rounded-xl border-none bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 font-bold text-lg text-slate-900 dark:text-slate-100 transition-all";
  const hideNumberArrows = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  const handleGlobalRateBlur = () => {
    if (!globalRate.trim()) return;
    const parsed = parseFloat(globalRate);
    if (!isNaN(parsed)) {
      setGlobalRate(parsed.toFixed(2));
    }
  };

  /**
   * 提交全局费率同步 (Sync All Rates)
   */
  const handleSyncAll = async () => {
    const parsedRate = parseFloat(globalRate);
    if (isNaN(parsedRate)) {
      return toast.error("Please enter a valid number for the global rate.");
    }

    const formattedRate = Number(parsedRate.toFixed(2));
    setIsSyncing(true);
    try {
      await apiClient.patch('/org/regions/sync-all-rates', { 
        new_rate: formattedRate 
      });
      toast.success("Global rate synced successfully to all regions");
      fetchRegions();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * 获取地区树数据 (Fetch Regions Tree)
   */
  const fetchRegions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/org/regions/tree');
      const data = res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      setRegions(data);
      
      if (data.length > 0) {
        setExpandedIds(prev => prev.length === 0 ? [data[0].id] : prev);
      }
    } catch (err) {
      toast.error("Failed to load regions");
    } finally {
      setLoading(false);
    }
  }, []); // 移除 expandedIds.length 依赖，避免展开折叠时触发重新抓取

  useEffect(() => { fetchRegions(); }, [fetchRegions, refreshTrigger]);

  /**
   * 处理添加按钮点击 (Handle Add Button Click)
   * 记录父节点并打开对应弹窗 (Record parent and open correct dialog)
   */
  const handleAddClick = (parent: RegionNode) => { // Refactor: Pass the node to rename
    setTargetParent(parent);
    setNewName(""); // Clear newName for adding
    if (parent.level === 0) setIsAddCityOpen(true);
    else setIsAddTownOpen(true);
  };

  /**
   * 处理费率修改点击 (Handle Rate Edit Click)
   */
  const handleRateEditClick = (node: RegionNode) => {
    console.log("Selected Region ID for rate update:", node.id);
    setTargetParent(node);
    setNewName(node.daily_rate != null ? node.daily_rate.toString() : "0.00");
    setIsRateEditOpen(true);
  };

  /**
   * 提交费率修改 (Submit Rate Update)
   * 对接接口：PATCH /org/regions/update-rate
   */
  const handleRateEditSubmit = async () => {
    if (!targetParent) return;
    
    const parsedRate = parseFloat(newName);
    if (isNaN(parsedRate)) {
      return toast.error("Please enter a valid number for the rate.");
    }

    const formattedRate = Number(parsedRate.toFixed(2));
    setIsSubmitting(true);
    try {
      await apiClient.patch('/org/regions/update-rate', { 
        region_id: targetParent.id, 
        new_rate: formattedRate 
      });
      toast.success("Daily rate updated successfully");
      setIsRateEditOpen(false);
      fetchRegions();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally { setIsSubmitting(false); }
  };

  /**
   * 处理重命名按钮点击 (Handle Rename Button Click)
   * 根据节点类型打开不同的重命名弹窗
   */
  const handleRenameClick = (node: RegionNode) => {
    setTargetParent(node);
    setNewName(node.name);
    if (node.level === 0) {
      setIsRootEditOpen(true);
    } else {
      setIsPlaceholderOpen(true);
    }
  };

  /**
   * 统一改名提交 (Unified Rename Submit)
   * 对接接口：PATCH /org/regions/update-name
   */
  const handleRenameSubmit = async () => {
    if (!newName.trim() || !targetParent) return toast.error("Name is required");
    setIsSubmitting(true);
    try {
      await apiClient.patch('/org/regions/update-name', { 
        region_id: targetParent.id, 
        name: newName.trim() 
      });
      toast.success("Municipality updated successfully");
      setIsRootEditOpen(false);
      setIsPlaceholderOpen(false);
      fetchRegions();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally { setIsSubmitting(false); }
  };

  /**
   * 提交新增请求 (Submit Add Request)
   * 对接接口：POST /org/regions/
   */
const submitNewRegion = async (type: 'City' | 'Town') => {
    if (!newName.trim() || !targetParent) {
      return toast.error("Please enter a valid name");
    }

    setIsSubmitting(true);
    
    // 逻辑：城市 level=1, 城镇 level=2
    const nextLevel = targetParent.level + 1;

    // 核心变动：如果是添加城市，则 parent_id 固定为 0
    const payload = {
      name: newName.trim(),
      level: nextLevel,
      parent_id: type === 'City' ? 0 : targetParent.id
    };

    try {
      await apiClient.post('/org/regions/', payload);
      toast.success(`${type} "${newName}" added successfully`);
      
      setIsAddCityOpen(false);
      setIsAddTownOpen(false);
      
      if (!expandedIds.includes(targetParent.id)) {
        setExpandedIds(prev => [...prev, targetParent.id]);
      }
      
      fetchRegions(); 
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || `Failed to add ${type}`;
      toast.error(errorMsg);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const getSubtleIcon = (level: number) => {
    const props = { size: 14, className: "text-slate-400" };
    if (level === 0) return <Globe {...props} />;
    if (level === 1) return <Building2 {...props} />;
    return <Home {...props} />;
  };

  const renderRows = (nodes: RegionNode[]) => {
    return nodes.map(node => {
      if (!node.name) return null;

      const isExpanded = expandedIds.includes(node.id);
      const hasChildren = node.children && node.children.length > 0;
      const canAdd = node.level < 2; 
      
      const rowPadClass = isCompact ? "py-5" : "py-8";
      const btnClass = isCompact ? "h-10 px-5" : "h-12 px-6";
      const titleRootClass = isCompact ? "text-lg text-slate-900 dark:text-slate-100" : "text-xl text-slate-900 dark:text-slate-100";
      const titleChildClass = isCompact ? "text-sm text-slate-600 dark:text-slate-300" : "text-base text-slate-600 dark:text-slate-300";

      return (
        <React.Fragment key={node.id}>
          <TableRow className="border-none hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group">
            <TableCell className={`${rowPadClass} border-none`}>
              <div className="flex items-center gap-4" style={{ paddingLeft: `${node.level * 48}px` }}>
                <div className="w-6 flex justify-center">
                  {hasChildren && (
                    <button 
                      onClick={() => setExpandedIds(prev => prev.includes(node.id) ? prev.filter(i => i !== node.id) : [...prev, node.id])} 
                      className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-transform active:scale-90"
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  )}
                </div>
              <div className={`flex items-center justify-center ${isCompact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl bg-slate-100 dark:bg-slate-800/50`}>
                  {getSubtleIcon(node.level)}
                </div>
                <span className={`font-black uppercase italic tracking-tighter ${node.level === 0 ? titleRootClass : titleChildClass}`}>
                  {node.name}
                </span>
              </div>
            </TableCell>

            <TableCell className={`${rowPadClass} border-none`}>
              <div className="flex items-center gap-5">
                <div className="flex flex-col justify-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 leading-none">Daily Rate</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`flex items-center ${isCompact ? 'text-lg' : 'text-xl'} font-black italic text-slate-900 dark:text-slate-100`}>
                      <span className={`inline-block ${isCompact ? 'text-base' : 'text-lg'} font-black italic text-slate-400 dark:text-slate-500 !mr-[5px]`}>₱</span>
                      <span className="tracking-tighter">{node.daily_rate != null ? Number(node.daily_rate).toFixed(2) : "0.00"}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">/ DAY</span>
                  </div>
                </div>
                <button onClick={() => handleRateEditClick(node)} className={`flex items-center justify-center gap-2 ${btnClass} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-900 dark:text-slate-100 hover:bg-primary hover:border-primary hover:text-white transition-all shadow-sm cursor-pointer active:scale-95`}>
                  <Settings2 size={14} className="text-slate-400 group-hover:text-white" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Adjust</span>
                </button>
              </div>
            </TableCell>

            <TableCell className={`${rowPadClass} text-right border-none pr-10`}>
              <div className="flex items-center justify-end gap-3">
                {canAdd && (
                  <button onClick={() => handleAddClick(node)} className={`flex items-center justify-center gap-2 ${btnClass} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-900 dark:text-slate-100 hover:bg-primary hover:border-primary hover:text-white transition-all shadow-sm cursor-pointer active:scale-95`}>
                    <Plus size={14} className="text-primary group-hover:text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{node.level === 0 ? "Add Barangay" : "Add Purok"}</span>
                  </button>
                )}
                <button onClick={() => handleRenameClick(node)} className={`flex items-center justify-center gap-2 ${btnClass} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-900 dark:text-slate-100 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all shadow-sm cursor-pointer active:scale-95`}>
                  <Edit2 size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Rename</span>
                </button>
              </div>
            </TableCell>
          </TableRow>
          {hasChildren && isExpanded && renderRows(node.children)}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      {/* 全局费率设置区域 (Global Rate Settings) */}
      <div className={`flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-50 dark:border-slate-800/50 shadow-sm ${isCompact ? 'p-4 mb-4' : 'p-6 mb-6'}`}>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <Percent size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest italic tracking-tight">Global Base Rate</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 leading-none">Set and sync a default rate to all regions</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex items-center w-full md:w-40">
            <span className="absolute left-4 text-sm font-black italic text-slate-400 dark:text-slate-500">₱</span>
            <Input 
              value={globalRate} 
              onChange={e => setGlobalRate(e.target.value)} 
              onBlur={handleGlobalRateBlur}
              type="number" 
              placeholder="0.00" 
              className={`pl-8 h-12 ${commonInputStyles} ${hideNumberArrows}`} 
            />
          </div>
          <button 
            type="button" 
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 h-12 px-6 bg-primary text-white rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 font-black uppercase text-[10px] tracking-widest whitespace-nowrap disabled:opacity-50"
          >
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span>Sync All</span>
          </button>
        </div>
      </div>

      {/* 列表容器 (Table Container) */}
      <div className={`bg-white dark:bg-slate-900/60 rounded-2xl ${isCompact ? 'p-2' : 'p-4'} shadow-sm border border-slate-50 dark:border-slate-800/50 overflow-hidden`}>
        {loading ? (
          <div className={`${isCompact ? 'h-[350px]' : 'h-[600px]'} flex items-center justify-center`}><Loader2 className="w-10 h-10 text-slate-900 dark:text-slate-100 animate-spin" /></div>
        ) : (
          <Table>
            <TableBody>
              {regions.length > 0 ? renderRows(regions) : (
                <TableRow><TableCell colSpan={3} className="h-96 text-center italic text-slate-200 dark:text-slate-700 uppercase font-black tracking-widest">No Data Found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 1. Add Barangay Dialog - 添加社区 */}
      <Dialog open={isAddCityOpen} onOpenChange={setIsAddCityOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-xl border-none shadow-2xl p-12 bg-white dark:bg-slate-900">
          <DialogHeader className="space-y-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-primary/20">
              <Building2 className="text-primary" size={28} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100">Add New Barangay</DialogTitle>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic tracking-wider">Municipality: {targetParent?.name}</p>
          </DialogHeader>
          <div className="py-10">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Barangay Name" className={`w-full max-w-[260px] mx-auto h-14 text-center ${commonInputStyles}`} />
          </div>
          <DialogFooter className="bg-transparent border-none p-0 sm:justify-center">
            <button 
              onClick={() => submitNewRegion('City')} 
              disabled={isSubmitting || !newName.trim()} 
              className="w-full bg-primary text-white h-14 rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all shadow-xl disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Confirm Barangay'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Add Purok Dialog - 添加区组 */}
      <Dialog open={isAddTownOpen} onOpenChange={setIsAddTownOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-xl border-none shadow-2xl p-12 bg-white dark:bg-slate-900">
          <DialogHeader className="space-y-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-primary/20">
              <MapPin className="text-primary" size={28} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100">Add New Purok</DialogTitle>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic tracking-wider">In Barangay: {targetParent?.name}</p>
          </DialogHeader>
          <div className="py-10">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Purok Name" className={`w-full max-w-[260px] mx-auto h-14 text-center ${commonInputStyles}`} />
          </div>
          <DialogFooter className="bg-transparent border-none p-0 sm:justify-center">
            <button 
              onClick={() => submitNewRegion('Town')} 
              disabled={isSubmitting || !newName.trim()} 
              className="w-full bg-primary text-white h-14 rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all shadow-xl disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Confirm Purok'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Update Root Dialog - 编辑根节点 (Municipality) */}
      <Dialog open={isRootEditOpen} onOpenChange={setIsRootEditOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-xl border-none shadow-2xl p-12 bg-white dark:bg-slate-900">
          <DialogHeader className="space-y-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-primary/20">
              <Settings2 className="text-primary" size={28} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100">Update Municipality</DialogTitle>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic tracking-wider">Modify Root Identity</p>
          </DialogHeader>
          <div className="py-10">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Municipality Name" className={`w-full max-w-[260px] mx-auto h-14 text-center ${commonInputStyles}`} />
          </div>
          <DialogFooter className="bg-transparent border-none p-0 sm:justify-center">
            <button 
              onClick={handleRenameSubmit} 
              disabled={isSubmitting} 
              className="w-full bg-primary text-white h-14 rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all shadow-xl cursor-pointer active:scale-95"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Apply Changes'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Restricted Dialog - 暂未开放提示 */}
      <Dialog open={isPlaceholderOpen} onOpenChange={setIsPlaceholderOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-xl border-none shadow-2xl p-12 bg-white dark:bg-slate-900 text-center">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-2 border border-slate-100 dark:border-slate-800">
              <AlertCircle className="text-slate-400" size={28} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100">Municipality</DialogTitle>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic tracking-wider">Update name for: {targetParent?.name}</p>
          </DialogHeader>
          <div className="py-10">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Municipality Name" className={`w-full max-w-[260px] mx-auto h-14 text-center ${commonInputStyles}`} />
          </div>
          <DialogFooter className="bg-transparent border-none p-0 sm:justify-center">
            <button 
              onClick={handleRenameSubmit} 
              disabled={isSubmitting || !newName.trim()} 
              className="w-full bg-primary text-white h-14 rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all shadow-xl disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Apply Changes'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Update Rate Dialog - 修改费率 */}
      <Dialog open={isRateEditOpen} onOpenChange={setIsRateEditOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-xl border-none shadow-2xl p-12 bg-white dark:bg-slate-900">
          <DialogHeader className="space-y-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-primary/20">
              <Percent className="text-primary" size={28} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100">Update Daily Rate</DialogTitle>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic tracking-wider">Municipality: {targetParent?.name}</p>
          </DialogHeader>
          <div className="py-10 flex items-center justify-center w-full max-w-[260px] mx-auto">
            <span className="inline-block text-xl font-black italic text-slate-400 dark:text-slate-500 !mr-[5px] shrink-0">₱</span>
            <div className="flex-1">
              <Input 
                type="number" 
                step="0.01" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                onBlur={() => {
                  const parsed = parseFloat(newName);
                  if (!isNaN(parsed)) setNewName(parsed.toFixed(2));
                }}
              className={`w-full h-14 text-center ${commonInputStyles} ${hideNumberArrows}`} 
              />
            </div>
          </div>
          <DialogFooter className="bg-transparent border-none p-0 sm:justify-center">
            <button 
              onClick={handleRateEditSubmit} 
              disabled={isSubmitting || !newName.trim()} 
              className="w-full bg-primary text-white h-14 rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all shadow-xl disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Apply Rate'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};