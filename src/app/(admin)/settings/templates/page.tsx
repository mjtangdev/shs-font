'use client';

import React, { useState } from 'react';
import {
  Download, Loader2,
  UserPlus, CreditCard, Tablet, Info
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Breadcrumbs from '@/components/Breadcrumbs';
import apiClient from '@/lib/axios';
import { toast } from "sonner";

const TEMPLATES = [
  {
    title: "Customer Import Template",
    description: "Standard manifest for bulk customer registration. Includes identity, contact, and beneficiary details.",
    endpoint: "/customer/import-template",
    filename: "SHS_Customer_Import_Template.xlsx",
    icon: UserPlus,
    fields: [
      "first_name", "last_name", "gender", "mobile", "birthday",
      "address", "email", "beneficiary_count", "representative_name", "rep_relationship"
    ]
  },
  {
    title: "IC Card Provisioning Template",
    description: "Mapping manifest for physical IC cards. Pairs printed serial numbers with chip UIDs.",
    endpoint: "/card/import-template",
    filename: "SHS_Card_Import_Template.xlsx",
    icon: CreditCard,
    fields: ["card_number (Physical SN)", "card_uuid (Hex UID)"]
  },
  {
    title: "SHS Device Inventory Template",
    description: "Inventory manifest for Solar Home System units and associated peripheral hardware.",
    endpoint: "/solar_device/import-template",
    filename: "SHS_Device_Import_Template.xlsx",
    icon: Tablet,
    fields: [
      "shs_machine_id", "solar_equipment_id", "radio_id",
      "flashlight_id", "led_light_id", "production_date"
    ]
  }
];

export default function TemplatesPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (endpoint: string, filename: string) => {
    setDownloading(endpoint);
    try {
      const response = await apiClient.get(endpoint, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Template download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download template.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-transparent py-12 px-6 tracking-tighter transition-colors">
      <div className="max-w-[1000px] mx-auto space-y-8">

        <Breadcrumbs
          items={[
            { label: 'settings', href: '/settings/regions' },
            { label: 'Data Templates' }
          ]}
        />

        <header className="space-y-2">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">
                Template <span className="text-primary">Registry</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 italic">
                Data Marshalling & Ingestion Protocols
            </p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {TEMPLATES.map((tpl, idx) => (
            <Card key={idx} className="group bg-white dark:bg-slate-900/60 rounded-[2.5rem] p-8 md:p-10 border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none hover:shadow-xl dark:hover:border-primary/20 transition-all duration-500 overflow-hidden relative">

              {/* Background Decoration */}
              <div className="absolute -right-8 -bottom-8 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <tpl.icon size={220} />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-slate-950 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg text-primary shrink-0 border border-white/5">
                    <tpl.icon size={32} />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {tpl.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed max-w-xl">
                      {tpl.description}
                    </p>

                    {/* Fields Tags */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        {tpl.fields.map(f => (
                            <span key={f} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[9px] font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">
                                {f}
                            </span>
                        ))}
                    </div>
                  </div>
                </div>

                <Button
                  disabled={downloading !== null}
                  onClick={() => handleDownload(tpl.endpoint, tpl.filename)}
                  className="h-16 px-8 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 group-hover:scale-[1.05] transition-all min-w-[200px] bg-primary text-primary-foreground hover:opacity-90 border-none shadow-lg shadow-primary/20"
                >
                  {downloading === tpl.endpoint ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Download size={18} />
                  )}
                  <span>{downloading === tpl.endpoint ? "Fetching..." : "Download .XLSX"}</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-[1.5rem] p-6 flex items-start gap-4 transition-colors">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Info className="text-primary" size={20} />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">Validation Protocol Notice</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tighter">
                    Ensure all mandatory fields are populated before ingestion. Invalid data formats (e.g., malformed Email or UID) will trigger a batch rejection for security enforcement.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
}
