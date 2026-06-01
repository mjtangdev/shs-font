'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, History, Loader2, Search, Calendar,
  CreditCard, UserCircle2, MapPin, Download,
  ArrowUpRight, ArrowDownRight, Copy
} from 'lucide-react';
import { toast } from "sonner";
import apiClient from '@/lib/axios';
import { cn } from "@/lib/utils";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CustomerHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id;

  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_amount: 0, transaction_count: 0 });

  const handleExport = async () => {
    if (!customer?.uuid) return;
    setIsExporting(true);
    const toastId = toast.loading("Generating customer financial report...");
    try {
      const params = new URLSearchParams();
      params.append('customer_uuid', customer.uuid);

      const response = await apiClient.get(`/finance/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `SHS_History_${customer.first_name}_${customer.last_name}_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to generate report", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch customer basic info to get UUID
      const custRes = await apiClient.get(`/customer/${customerId}`);
      const custData = custRes.data;
      setCustomer(custData);

      // 2. Fetch all transactions for this customer using finance endpoint
      // Ensure the finance endpoint supports customer_uuid filter
      const txRes = await apiClient.get('/finance/transactions', {
        params: { customer_uuid: custData.uuid, limit: 100 }
      });
      setTransactions(txRes.data.items || []);

      // 3. Optional: summary for this customer
      const sumRes = await apiClient.get('/finance/summary', {
        params: { customer_uuid: custData.uuid }
      });
      setSummary(sumRes.data);

    } catch (err) {
      toast.error("Failed to load historical data");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <span className="font-black uppercase tracking-[0.3em] text-slate-400">Syncing Ledger...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12 px-6 tracking-tighter transition-colors">
      <div className="max-w-[1100px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        <div className="flex items-center justify-between">
          <Breadcrumbs items={[
            { label: 'customers', href: '/customers' },
            { label: customer?.first_name + ' ' + customer?.last_name, href: `/customers/${customerId}` },
            { label: 'Financial History' }
          ]} />
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft size={14} /> Return to Profile
          </button>
        </div>

        {/* Financial Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-8 border-none shadow-sm bg-slate-950 text-white rounded-[24px]">
             <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                   <History size={20} className="text-primary" />
                </div>
                <Badge className="bg-primary text-slate-950 border-none px-2 py-0.5 font-black text-[8px] uppercase">Lifetime</Badge>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
             <h2 className="text-4xl font-black italic tracking-tighter">₱{summary.total_amount.toLocaleString()}</h2>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white dark:bg-slate-900/60 rounded-[24px]">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transactions</p>
             <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-slate-100">{summary.transaction_count}</h2>
             <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase">
                <ArrowUpRight size={12} /> Sync complete
             </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white dark:bg-slate-900/60 rounded-[24px]">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Expiry</p>
             <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-slate-100">{customer?.expiry_time ? customer.expiry_time.split(' ')[0] : 'N/A'}</h2>
             <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase">
                <Calendar size={12} /> Coverage Status
             </div>
          </Card>
        </div>

        {/* Transaction Ledger */}
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white dark:bg-slate-900/60">
          <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
             <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100">Transaction Ledger</h3>
             <Button
               variant="outline"
               onClick={handleExport}
               disabled={isExporting}
               className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 border-slate-100 dark:border-slate-800"
             >
               {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download size={14} className="mr-2" />}
               Export Excel
             </Button>
          </div>
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-10 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Ref ID / Time</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Method / POS</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Operator</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Action</TableHead>
                <TableHead className="text-right pr-10 font-black text-[10px] uppercase tracking-widest text-slate-400">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50 dark:divide-slate-800">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow key={tx.transaction_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-none">
                    <TableCell className="px-10 py-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                             {tx.transaction_id.length > 12 ? `${tx.transaction_id.slice(0, 6)}...${tx.transaction_id.slice(-6)}` : tx.transaction_id}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(tx.transaction_id);
                              toast.success("Transaction ID copied");
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all text-slate-400"
                          >
                            <Copy size={10} />
                          </button>
                        </div>
                        <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{tx.transaction_time?.replace('T', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase text-slate-900 dark:text-slate-100">POS-Terminal</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.pos_sn}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400 italic">@{tx.operator_username}</span>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            tx.action_type === 'RECHARGE' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-blue-500"
                          )} />
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
                            {tx.action_type === 'RECHARGE' ? 'LOAD' : tx.action_type}
                          </span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                       <div className="flex flex-col items-end">
                          <span className="text-lg font-black text-slate-950 dark:text-slate-100 italic">₱{Number(tx.amount).toFixed(2)}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+{tx.days} Days Access</span>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <History size={32} className="text-slate-100 dark:text-slate-800" />
                       <span className="text-[10px] font-black uppercase text-slate-300 dark:text-slate-700 tracking-widest italic">No historical records synchronized yet</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

      </div>
    </div>
  );
}
