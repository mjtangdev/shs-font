"use client";

import React, { useState, useEffect } from "react";
import { Zap, ShieldCheck, Settings, UserCog, Monitor, Smartphone, Moon, Sun, Languages, ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

type Language = "en" | "cn";
type Mode = "web" | "pos";

const CONTENT = {
  en: {
    title: "System Manual",
    subtitle: "Comprehensive guide for SHS Frontend operations.",
    web: "Management Web",
    pos: "Terminal POS",
    chapters: {
      auth: {
        title: "Authentication",
        desc: "Access the system using default credentials. Password reset is mandatory on first login.",
        user: "Username",
        pass: "Password",
      },
      org: {
        title: "Organization Setup",
        desc: "Configure company identity, TIN, and logo for receipts.",
      },
      rates: {
        title: "Regional & Rates",
        desc: "Build service hierarchy and define pricing for each district.",
      },
      team: {
        title: "Team Management",
        desc: "Manage user profiles and reset passwords for operators.",
      }
    }
  },
  cn: {
    title: "系统操作手册",
    subtitle: "太阳能家庭系统前端完整操作指南。",
    web: "管理后台",
    pos: "终端 POS",
    chapters: {
      auth: {
        title: "身份验证",
        desc: "使用默认凭据访问系统。首次登录时必须重置密码。",
        user: "用户名",
        pass: "密码",
      },
      org: {
        title: "组织机构设置",
        desc: "配置公司 Logo、税号和地址。这些信息将显示在所有收据上。",
      },
      rates: {
        title: "区域与费率",
        desc: "构建服务层级并为每个区域定义电费价格。",
      },
      team: {
        title: "团队管理",
        desc: "管理用户资料并为操作员重置密码。",
      }
    }
  }
};

export default function ManualPage() {
  const [lang, setLang] = useState<Language>("en");
  const [mode, setMode] = useState<Mode>("web");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const t = CONTENT[lang];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex gap-8 items-center">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500 fill-current" />
              <span className="font-black italic text-xl tracking-tighter uppercase">SHS Manual</span>
            </div>

            <div className="hidden md:flex gap-4">
              <button
                onClick={() => setMode("web")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${mode === "web" ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.web}
              </button>
              <button
                onClick={() => setMode("pos")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${mode === "pos" ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.pos}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 hover:bg-accent rounded-full">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Lang Toggle */}
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <button onClick={() => setLang("en")} className={`text-xs font-black ${lang === "en" ? "text-yellow-500" : "text-muted-foreground"}`}>EN</button>
              <span className="text-border">|</span>
              <button onClick={() => setLang("cn")} className={`text-xs font-black ${lang === "cn" ? "text-yellow-500" : "text-muted-foreground"}`}>CN</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-16 px-6">
        {mode === "web" ? (
          <div className="space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-4">
                {lang === "en" ? "Web" : "管理"} <span className="text-yellow-500">{lang === "en" ? "Portal" : "后台"}</span>
              </h1>
              <p className="text-muted-foreground text-xl max-w-2xl">{t.subtitle}</p>
            </header>

            {/* Auth Section */}
            <section className="space-y-12">
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-10 h-10 text-yellow-500" />
                <h2 className="text-4xl font-black uppercase italic tracking-tight">{t.chapters.auth.title}</h2>
              </div>
              <div className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed italic border-l-4 border-yellow-500/30 pl-6">{t.chapters.auth.desc}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="relative group overflow-hidden rounded-2xl border-2 border-border transition-colors hover:border-yellow-500/50">
                    <img src="/manual/img/img1.png" alt="Login" className="w-full h-auto" />
                  </div>
                  <div className="relative group overflow-hidden rounded-2xl border-2 border-border transition-colors hover:border-yellow-500/50">
                    <img src="/manual/img/img3.png" alt="Password Change" className="w-full h-auto" />
                  </div>
                </div>
              </div>
            </section>

            {/* Organization */}
            <section className="space-y-12">
              <div className="flex items-center gap-4">
                <Settings className="w-10 h-10 text-yellow-500" />
                <h2 className="text-4xl font-black uppercase italic tracking-tight">{t.chapters.org.title}</h2>
              </div>
              <div className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed italic border-l-4 border-yellow-500/30 pl-6">{t.chapters.org.desc}</p>
                <div className="rounded-2xl border-2 border-border overflow-hidden">
                  <img src="/manual/img/img2.png" alt="Org Profile" className="w-full h-auto" />
                </div>
              </div>
            </section>

            {/* Rates */}
            <section className="space-y-12">
              <div className="flex items-center gap-4">
                <Monitor className="w-10 h-10 text-yellow-500" />
                <h2 className="text-4xl font-black uppercase italic tracking-tight">{t.chapters.rates.title}</h2>
              </div>
              <div className="bg-card border border-border p-8 rounded-[2rem] shadow-sm">
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed italic border-l-4 border-yellow-500/30 pl-6">{t.chapters.rates.desc}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <img src="/manual/img/img6.png" className="rounded-xl border border-border" />
                  <img src="/manual/img/img9.png" className="rounded-xl border border-border" />
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-4">
                {lang === "en" ? "POS" : "终端"} <span className="text-yellow-500">{lang === "en" ? "Terminal" : "POS"}</span>
              </h1>
              <p className="text-muted-foreground text-xl max-w-2xl">{lang === "en" ? "Mobile field collection and device binding guide." : "移动现场收费及设备绑定指南。"}</p>
            </header>

            <section className="space-y-12">
              <div className="flex items-center gap-4">
                <Smartphone className="w-10 h-10 text-yellow-500" />
                <h2 className="text-4xl font-black uppercase italic tracking-tight">{lang === "en" ? "Daily Collection" : "日常收费"}</h2>
              </div>
              <div className="flex justify-center">
                <div className="max-w-sm rounded-[3rem] border-8 border-card overflow-hidden shadow-2xl ring-1 ring-border">
                  <img src="/manual/img/img15.png" alt="POS" className="w-full h-auto" />
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
