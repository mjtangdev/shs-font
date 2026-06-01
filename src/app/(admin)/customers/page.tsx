"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  MapPin,
  Loader2,
  Users,
  ChevronDown,
  ChevronRight,
  Building2,
  Home,
  Download,
  Trash2,
  Lock,
  AlertCircle,
  Eye,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import apiClient from "@/lib/axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Breadcrumbs from "@/components/Breadcrumbs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface RegionData {
  id: number;
  name: string;
  level: number;
  children: RegionData[];
}

function RegionNode({
  node,
  selectedId,
  onSelect,
  depth = 0,
}: {
  node: RegionData;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  depth?: number;
}) {
  const isMunicipality = node.level === 0;
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  const getIcon = () => {
    if (isMunicipality) return <Building2 className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-primary")} />;
    if (node.level === 1) return <MapPin className={cn("h-3 w-3", isSelected ? "text-white" : "text-slate-400")} />;
    return <Home className={cn("h-3 w-3", isSelected ? "text-white" : "text-slate-400")} />;
  };

  const getLevelLabel = () => {
    if (isMunicipality) return "Municipality";
    if (node.level === 1) return "Barangay";
    return "Purok";
  };

  return (
    <div className="w-full select-none" title={getLevelLabel()}>
      <div
        onClick={() => onSelect(isSelected ? null : node.id)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer group mb-1",
          isSelected
            ? "bg-primary text-white shadow-md shadow-primary/20"
            : isMunicipality
              ? "bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <div
          onClick={(e) => {
            if (isMunicipality) return;
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={cn(
            "w-4 h-4 flex items-center justify-center rounded transition-colors",
            !isMunicipality && "hover:bg-black/5 dark:hover:bg-white/10"
          )}
        >
          {hasChildren && !isMunicipality && (isOpen ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />)}
          {isMunicipality && <div className="w-1 h-3.5 bg-primary/20 rounded-full mr-1" />}
        </div>
        {getIcon()}
        <span
          className={cn(
            "text-sm truncate flex-1 tracking-tight",
            isMunicipality ? "text-sm font-black uppercase" : "font-semibold",
            isSelected ? "text-white" : "text-slate-700 dark:text-slate-300"
          )}
        >
          {node.name}
        </span>
      </div>
      {hasChildren && (isMunicipality || isOpen) && (
        <div className="relative my-0.5">
          {node.children.map((child) => (
            <RegionNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomerPage() {
  const router = useRouter();
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isBoundFilter, setIsBoundFilter] = useState<string>("all"); // 'all', 'bound', 'unbound'
  const [loading, setLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20); // 默认改为 20

  const [deletePassword, setDeletePassword] = useState("");
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setUserRole(localStorage.getItem("user_role"));
  }, []);

  const fetchRegions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/org/regions/tree");
      const data = res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
      setRegions(data);
    } catch {
      toast.error("Failed to load regions");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setIsListLoading(true);
    try {
      const res = await apiClient.get("/customer/", {
        params: {
          region_id: selectedRegionId || undefined,
          search: search || undefined,
          is_bound: isBoundFilter === 'all' ? undefined : isBoundFilter === 'bound',
          skip: (currentPage - 1) * pageSize,
          limit: pageSize,
        },
      });
      setCustomers(res.data.items || []);
      setTotalCount(res.data.total || 0);
    } finally {
      setIsListLoading(false);
    }
  }, [selectedRegionId, search, isBoundFilter, currentPage, pageSize]);

  // Reset to page 1 when filter, search, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRegionId, search, isBoundFilter, pageSize]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (selectedRegionId) params.append('region_id', selectedRegionId.toString());
      if (search) params.append('search', search);

      const response = await apiClient.get(`/customer/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `SHS_Customers_${date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export successful");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/customer/${id}`);
      toast.success("Record deleted");
      fetchCustomers();
    } catch {
      toast.error("Delete failed");
    }
  };

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-slate-50 dark:bg-slate-950">

      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors gap-8">
        <div className="flex items-center gap-8 flex-1">
          <Breadcrumbs items={[{ label: "customers" }]} />

          {/* Search Box & Tabs Group */}
          <div className="flex items-center gap-4 flex-1 max-w-4xl">
            {/* Search Input */}
            <div className="relative flex-1 flex items-center h-11 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="text-slate-400 group-focus-within:text-primary transition-colors mr-2 shrink-0" size={14} />
              <input
                type="text"
                placeholder="SEARCH CUSTOMERS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-full bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
              {isListLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400 shrink-0" />}
            </div>

            {/* Binding Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              {[
                { id: 'all', label: 'All Entries' },
                { id: 'bound', label: 'Bound' },
                { id: 'unbound', label: 'Unassigned' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setIsBoundFilter(f.id)}
                  className={cn(
                    "px-4 h-9 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    isBoundFilter === f.id
                      ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-xl h-10 px-5 font-black border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 hover:bg-slate-50 dark:text-slate-200 uppercase text-[10px] tracking-widest transition-colors shadow-sm dark:shadow-none active:scale-95"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Export List
          </Button>
          <Link href="/customers/create" passHref>
            <Button asChild className="rounded-xl h-10 px-6 font-bold shadow-sm dark:shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest">
              <span>+ New Record</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="relative z-10 w-80 border-r border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col shrink-0 shadow-sm transition-colors">
          <ScrollArea className="h-full w-full">
            <div className="p-5 space-y-2">
              <button
                type="button"
                onClick={() => setSelectedRegionId(null)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-6 text-sm font-bold border",
                  selectedRegionId === null
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl dark:bg-white dark:text-slate-900 dark:border-white dark:shadow-none scale-[1.02]"
                    : "text-slate-500 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:bg-slate-800/50"
                )}
              >
                <Users className="h-4 w-4" />
                <span>All Customers</span>
              </button>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                    Loading Tree
                  </span>
                </div>
              ) : (
                regions.map((node) => (
                  <RegionNode key={node.id} node={node} selectedId={selectedRegionId} onSelect={setSelectedRegionId} />
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        <main className="relative z-10 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors">
          <div className="p-10">
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

              <Card className="border-none shadow-sm dark:shadow-none rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 transition-colors">
                <Table className="table-fixed">
                  <TableHeader className="bg-transparent border-b border-slate-100 dark:border-slate-800 transition-colors">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="w-[30%] px-10 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Profile & Address</TableHead>
                      <TableHead className="w-[15%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Status</TableHead>
                      <TableHead className="w-[15%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Contact</TableHead>
                      <TableHead className="w-[15%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-center">Region Area</TableHead>
                      <TableHead className="w-[15%] px-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle text-right">Created At</TableHead>
                      <TableHead className="w-[10%] text-right pr-8 py-4 font-black text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none align-middle">Ops</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                    {customers.map((c) => (
                      <TableRow
                        key={c.id}
                        className="group hover:bg-slate-100/80 dark:hover:bg-white/[0.08] transition-colors border-none even:bg-slate-50 dark:even:bg-white/[0.03]"
                      >
                        <TableCell className="py-5 px-10 align-middle">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-black italic text-slate-900 dark:text-white text-[15px] uppercase tracking-tight leading-none group-hover:text-primary transition-colors">
                              {(c.first_name || '')} {(c.last_name || '')}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                              ID: {c.uuid}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center align-middle">
                           {c.is_bound ? (
                             <Badge className="bg-green-500/10 text-green-500 border-none px-2 py-0.5 rounded-md font-black text-[8px] uppercase">Bound</Badge>
                           ) : (
                             <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-400 border-none px-2 py-0.5 rounded-md font-black text-[8px] uppercase">Unbound</Badge>
                           )}
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <span className="text-[13px] font-bold text-slate-600 dark:text-slate-400 font-mono tracking-tight">{c.mobile}</span>
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <Badge className="bg-primary/10 text-primary border-none px-3 py-1 rounded-full font-black text-[8px] uppercase shadow-sm mx-auto">
                            {c.region_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right align-middle pr-10">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest leading-none">
                              {c.created_at?.split(" ")[0]}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                              {c.created_at?.split(" ")[1]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8 align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/customers/${c.id}`)}
                              className="text-slate-300 dark:text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {userRole === "1" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => router.push(`/customers/${c.id}?edit=true`)}
                                  className="text-slate-300 dark:text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  title="Edit Profile"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCustomerToDelete(c);
                                    setDeletePassword("");
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Delete Record"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {customers.length === 0 && !isListLoading && (
                  <div className="py-16 text-center flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      No Customers Found
                    </p>
                  </div>
                )}
              </Card>

              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2 py-8 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-6">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">
                      Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} records
                    </p>

                    {/* Page Size Selector */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/5">
                      {[20, 50, 100].map(size => (
                        <button
                          key={size}
                          onClick={() => setPageSize(size)}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all",
                            pageSize === size
                              ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {totalCount > pageSize && (
                    <Pagination className="w-auto mx-0">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); if(currentPage > 1) setCurrentPage(currentPage - 1); }}
                            className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                          />
                        </PaginationItem>

                        {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }).map((_, i) => {
                          // Simple logic for page numbers: 1, 2, 3, 4, 5...
                          // In a real app with 100+ pages, you'd want ellipsis logic
                          const pageNum = i + 1;
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                isActive={currentPage === pageNum}
                                onClick={(e) => { e.preventDefault(); setCurrentPage(pageNum); }}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        {Math.ceil(totalCount / pageSize) > 5 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); if(currentPage < Math.ceil(totalCount / pageSize)) setCurrentPage(currentPage + 1); }}
                            className={cn(currentPage === Math.ceil(totalCount / pageSize) && "pointer-events-none opacity-50")}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[420px] rounded-2xl border-none shadow-2xl p-10 bg-white dark:bg-slate-900/60">
          <DialogHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-red-100 dark:border-red-500/20">
              <Lock className="text-red-500 dark:text-red-400" size={28} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100">
              Admin Authorization
            </DialogTitle>
            <DialogDescription className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
              Enter admin password to delete{" "}
              <span className="text-slate-900 dark:text-slate-100">{customerToDelete?.first_name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Input
              type="password"
              placeholder="Admin Password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full h-14 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 font-bold text-lg text-center transition-all outline-none"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                if (!deletePassword) return toast.error("Password is required");
                handleDelete(customerToDelete.id);
                setIsDeleteDialogOpen(false);
              }}
              className="w-full h-14 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-xl dark:shadow-none active:scale-95"
            >
              Confirm Deletion
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full h-14 rounded-xl font-black uppercase text-xs tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-all active:scale-95"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
