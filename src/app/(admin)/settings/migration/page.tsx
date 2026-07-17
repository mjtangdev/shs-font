"use client";

import React, { useState, useRef } from "react";
import { RefreshCw, Database, CloudSync, ShieldCheck, ArrowRightLeft, Upload, FileArchive, CheckCircle2, AlertCircle, Lock, Info } from "lucide-react";
import { toast } from "sonner";
import { translations } from "@/lib/i18n";
import apiClient from "@/lib/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function MigrationPage() {
  const [migrating, setMigrating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Default to English for now | 暂时默认使用英文
  const [lang] = useState<string>("en");
  // const [lang] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('app_lang') || 'en' : 'en'));

  const t = (key: string) => {
    return (translations as any)[lang][key] || key;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
      } else {
        toast.error(lang === 'en' ? "Please select a valid .zip file" : "请选择有效的 .zip 备份文件");
        e.target.value = "";
      }
    }
  };

  const handleMigration = async () => {
    if (!selectedFile) {
      toast.error(lang === 'en' ? "Please select a migration file first" : "请先选择迁移文件");
      return;
    }
    if (!adminPassword) {
      toast.error(lang === 'en' ? "Admin password is required" : "请输入管理员密码");
      return;
    }

    setMigrating(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("password", adminPassword);

    try {
      await apiClient.post('/maintenance/migrate-from-legacy-zip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(lang === 'en' ? "Migration Successful" : "旧版系统数据迁移成功");
      setSelectedFile(null);
      setAdminPassword("");
      setIsConfirmOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      console.error("Migration error:", error);
      const detail = error.response?.data?.detail || (lang === 'en' ? "Migration failed" : "迁移失败，请检查文件格式或密码");
      toast.error(detail);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">
          {lang === 'en' ? "Legacy System" : "旧版软件"} <span className="text-primary italic">{lang === 'en' ? "Migration" : "数据迁移"}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          {lang === 'en'
            ? "Transfer your historical records from the old software to the new platform using ZIP backups."
            : "通过上传旧版软件导出的 ZIP 备份包，将历史数据完整迁移至当前系统。"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <Database size={24} />
              </div>
              <h2 className="text-xl font-bold">{lang === 'en' ? "Target System" : "目标系统"}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{lang === 'en' ? "Current Platform" : "当前平台"}</span>
                <span className="font-bold">SHS v1.5 Next</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{lang === 'en' ? "Data Compatibility" : "数据兼容性"}</span>
                <span className="text-emerald-500 font-black uppercase tracking-widest text-[10px] bg-emerald-500/10 px-2 py-1 rounded">Optimized</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-slate-950 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Upload size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">{lang === 'en' ? "Import Legacy Data" : "导入旧版数据"}</h2>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              selectedFile
              ? "border-primary/50 bg-primary/5"
              : "border-slate-800 hover:border-slate-700 bg-slate-900/40"
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".zip" className="hidden" />
            {selectedFile ? (
              <>
                <FileArchive size={32} className="text-primary" />
                <div className="text-center">
                  <p className="text-sm font-bold text-white truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </>
            ) : (
              <>
                <CloudSync size={32} className="text-slate-700" />
                <p className="text-xs text-slate-500 font-medium">{lang === 'en' ? "Select .zip backup file" : "选择旧版导出的 .zip 文件"}</p>
              </>
            )}
          </div>

          <button
            onClick={() => setIsConfirmOpen(true)}
            disabled={migrating || !selectedFile}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
              migrating || !selectedFile
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-primary text-slate-950 hover:scale-[1.01] active:scale-95 shadow-lg shadow-primary/20"
            }`}
          >
            {migrating ? <RefreshCw size={20} className="animate-spin" /> : <ArrowRightLeft size={20} />}
            {migrating ? (lang === 'en' ? "Processing..." : "正在迁移...") : (lang === 'en' ? "Start Migration" : "确认开始迁移")}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[1100px] w-[95vw] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
          <div className="bg-slate-950 p-5 text-center border-b border-white/5">
            <div className="flex items-center justify-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary">
                <Lock size={20} />
              </div>
              <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-white">
                Legacy System Migration Clearance
              </DialogTitle>
            </div>
          </div>

          <div className="p-10 flex flex-col items-center">
            <div className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-10 rounded-3xl space-y-5">
              <div className="flex items-center gap-4 text-primary font-black uppercase italic tracking-[0.25em] text-xs">
                <AlertCircle size={22} /> Essential Migration Protocol
              </div>
              <p className="text-[16px] text-slate-600 dark:text-slate-300 leading-relaxed font-bold">
                {lang === 'en'
                  ? "This migration imports Customer profiles, IC Card records, SHS Hardware units, and Financial transactions. To ensure system stability, POS Operator accounts and Regional hierarchies MUST be created manually first. It is critical that your new regional structure perfectly matches the legacy software to avoid data mapping failures and display errors after data ingestion."
                  : "迁移须知：本次操作将导入客户档案、IC卡记录、SHS硬件设备及财务交易数据。为确保系统稳定运行，POS操作员账号及地区架构必须预先手动创建。请务必确认新系统的地区架构与旧软件完全一致，否则将导致迁移后的数据关联失效或显示异常。"}
              </p>
            </div>

            <div className="w-full mt-[20px] px-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-[10px]">Confirm Admin Password</label>
                <div className="relative w-full">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    type="password"
                    placeholder="ENTER PASSWORD TO AUTHORIZE"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="h-14 pl-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-sm focus-visible:ring-primary/5 focus-visible:border-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-row items-center gap-4 mt-10">
                <Button
                  onClick={handleMigration}
                  disabled={migrating || !adminPassword}
                  className="flex-1 h-16 bg-primary text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all"
                >
                  {migrating ? <RefreshCw size={20} className="animate-spin mr-2" /> : "Authorize & Execute Migration"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-10 h-16 text-slate-400 font-bold uppercase text-[10px] tracking-widest rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Safety Notice */}
      <div className="bg-amber-500/5 border border-amber-500/20 p-8 rounded-3xl flex gap-5 items-start">
        <AlertCircle size={28} className="text-amber-500 shrink-0" />
        <div className="space-y-2">
          <h4 className="text-amber-500 font-bold text-sm uppercase tracking-widest">{lang === 'en' ? "Strict Warning" : "安全操作警告"}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {lang === 'en'
              ? "Migration will replace current database entries with legacy software data. This process cannot be undone. Always ensure you are uploading the correct backup from the old system."
              : "执行迁移操作会将当前系统的部分数据替换为旧版软件的历史记录。此过程不可撤销。在操作前，请务必确认您上传的是从老软件中导出的正确备份包。"}
          </p>
        </div>
      </div>

    </div>
  );
}
