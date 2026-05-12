"use client";

import React, { useState, useEffect, useCallback } from "react";
// 引入 Download 和 Trash2 图标
import { Search, MapPin, Loader2, Users, ChevronDown, ChevronRight, Building2, Home, Download, Trash2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import apiClient from "@/lib/axios";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ... RegionNode 组件保持不变 ...
function RegionNode({ node, selectedId, onSelect, depth = 0 }: { node: any, selectedId: number | null, onSelect: any, depth?: number }) {
    // (此处省略 RegionNode 的实现，保持你代码中原样即可)
    const isRoot = node.level === 0;
    const [isOpen, setIsOpen] = useState(true);
    const isSelected = selectedId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const getIcon = () => {
      if (isRoot) return <Building2 className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-blue-600")} />;
      if (node.level === 1) return <MapPin className={cn("h-3 w-3", isSelected ? "text-white" : "text-slate-400")} />;
      return <Home className={cn("h-3 w-3", isSelected ? "text-white" : "text-slate-400")} />;
    };
    return (
      <div className="w-full">
        <div onClick={() => onSelect(isSelected ? null : node.id)} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group mb-1", isSelected ? "bg-primary text-white shadow-lg shadow-primary/20" : isRoot ? "bg-slate-50/50 text-slate-900 font-bold hover:bg-slate-100" : "hover:bg-slate-50 text-slate-600")} style={{ paddingLeft: `${depth * 16 + 12}px` }}>
          <div onClick={(e) => { if (isRoot) return; e.stopPropagation(); setIsOpen(!isOpen); }} className={cn("w-4 h-4 flex items-center justify-center rounded transition-colors", !isRoot && "hover:bg-black/5")}>
            {hasChildren && !isRoot && (isOpen ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />)}
            {isRoot && <div className="w-1 h-3.5 bg-primary/20 rounded-full mr-1" /> }
          </div>
          {getIcon()}
          <span className={cn("text-sm truncate flex-1 tracking-tight", isRoot ? "text-base font-black uppercase" : "font-semibold", isSelected ? "text-white" : "text-slate-700")}>{node.name}</span>
        </div>
        {hasChildren && (isRoot || isOpen) && (
          <div className="relative my-0.5">
            {node.children.map((child: any) => (
              <RegionNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
}

export default function CustomerPage() {
  const [regions, setRegions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [deletePassword, setDeletePassword] = useState("");
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 初始化时从 LocalStorage 获取角色
  useEffect(() => {
    setUserRole(localStorage.getItem('user_role'));
  }, []);

  const fetchRegions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/org/regions/tree');
      setRegions(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      toast.error("Failed to load regions");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setIsListLoading(true);
    try {
      const res = await apiClient.get('/customer/', {
        params: {
          region_id: selectedRegionId || undefined,
          search: search || undefined
        }
      });
      setCustomers(res.data.items || []);
      setTotal(res.data.total || 0);
    } finally {
      setIsListLoading(false);
    }
  }, [selectedRegionId, search]);

  // --- 导出 Excel 函数 ---
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/customer/export', {
        params: { region_id: selectedRegionId || undefined },
        responseType: 'blob', // 关键：处理文件流
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SHS_Customers_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export successful");
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  // --- 删除客户函数 ---
  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/customer/${id}`);
      toast.success("Record deleted");
      fetchCustomers(); // 刷新列表
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  useEffect(() => { fetchRegions(); }, [fetchRegions]);
  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans">
      {/* 左侧边栏 */}
      <aside className="w-80 border-r border-slate-200 bg-white p-5 flex flex-col gap-4 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-3">
            <button
              onClick={() => setSelectedRegionId(null)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-6 text-sm font-bold border",
                selectedRegionId === null 
                  ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200 scale-[1.02]" 
                  : "text-slate-500 hover:bg-slate-50 border-transparent"
              )}
            >
              <Users className="h-4 w-4" />
              <span>All Customers</span>
            </button>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Loading Tree</span>
              </div>
            ) : (
              regions.map(node => (
                <RegionNode key={node.id} node={node} selectedId={selectedRegionId} onSelect={setSelectedRegionId} />
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* 右侧主内容 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search customers..." 
              className="pl-12 bg-slate-100/50 border-none h-12 rounded-2xl text-sm focus:bg-white transition-all shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            {/* 导出按钮 */}
            <Button 
                variant="outline" 
                onClick={handleExport}
                disabled={isExporting}
                className="rounded-2xl h-12 px-6 font-bold border-slate-200 hover:bg-slate-50"
            >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Export
            </Button>
            <Link href="/customers/create" passHref>
                <Button className="rounded-2xl h-12 px-8 font-bold shadow-lg transition-all active:scale-95">
                    + New Record
                </Button>
            </Link>
          </div>
        </header>

        <div className="p-10 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-8">
            <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="py-6 px-10 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Profile & Address</TableHead>
                    <TableHead className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Contact</TableHead>
                    <TableHead className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Region Area</TableHead>
                    <TableHead className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Created At</TableHead>
                    {/* 只有 Admin 展示操作列标题 */}
                    {userRole === "1" && <TableHead className="text-right pr-10 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                      <TableCell className="py-7 px-10">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-bold text-slate-800 text-lg tracking-tight leading-none">{c.first_name} {c.last_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">ID: {c.uuid}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-slate-600 font-mono">{c.mobile}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-50 text-blue-600 border-none px-4 py-1.5 rounded-full font-black text-[10px] shadow-sm uppercase">
                          {c.region_name}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-right", userRole !== "1" && "pr-10")}>
                        <div className="flex flex-col items-end">
                          <span className="text-[12px] text-slate-500 font-bold">{c.created_at?.split(' ')[0]}</span>
                          <span className="text-[10px] text-slate-300 font-medium">{c.created_at?.split(' ')[1]}</span>
                        </div>
                      </TableCell>
                      
                      {/* --- Admin 专属删除列 --- */}
                      {userRole === "1" && (
                        <TableCell className="text-right pr-10">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setCustomerToDelete(c);
                              setDeletePassword("");
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {customers.length === 0 && !isListLoading && (
                <div className="py-40 text-center flex flex-col items-center gap-4">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* 删除密码验证弹窗 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[420px] rounded-3xl border-none shadow-2xl p-10 bg-white">
          <DialogHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-red-100">
              <Lock className="text-red-500" size={28} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Admin Authorization</DialogTitle>
            <DialogDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic tracking-wider">
              Enter admin password to delete <span className="text-slate-900">{customerToDelete?.first_name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Input 
              type="password"
              placeholder="Admin Password" 
              value={deletePassword} 
              onChange={(e) => setDeletePassword(e.target.value)} 
              className="w-full h-14 rounded-2xl border-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 font-bold text-lg text-center transition-all" 
            />
          </div>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => {
                if (!deletePassword) return toast.error("Password is required");
                // TODO: 此处未来可对接验证密码的接口，目前验证输入不为空后直接执行删除操作
                handleDelete(customerToDelete.id);
                setIsDeleteDialogOpen(false);
              }}
              className="w-full h-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95"
            >
              Confirm Deletion
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-900 transition-all active:scale-95"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}