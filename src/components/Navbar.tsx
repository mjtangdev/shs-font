'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  LogOut, LayoutDashboard, Settings, Zap, Users, 
  ChevronDown, UserSquare, UserCog, Wallet, 
  Map, Building2, CreditCard, Tablet, Monitor, ShieldAlert, FileSpreadsheet,
  Languages, RefreshCw, Wifi
} from "lucide-react";
import Link from "next/link"; 
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { translations, TranslationKey } from "@/lib/i18n";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useHardwareMode } from "@/hooks/useHardwareMode";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  const [openBasic, setOpenBasic] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [openDevice, setOpenDevice] = useState(false);
  const [openFinance, setOpenFinance] = useState(false);

  const timeoutBasic = useRef<NodeJS.Timeout | null>(null);
  const timeoutUser = useRef<NodeJS.Timeout | null>(null);
  const timeoutDevice = useRef<NodeJS.Timeout | null>(null);
  const timeoutFinance = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (setter: (val: boolean) => void, timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setter(true);
  };

  const handleMouseLeave = (setter: (val: boolean) => void, timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    timeoutRef.current = setTimeout(() => {
      setter(false);
    }, 150); // 150ms delay to prevent flickering
  };

  const [role, setRole] = useState<number>(0);
  const [username, setUsername] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<string>("en");

  const { mode, toggleMode, isNextGen, mounted: hwMounted } = useHardwareMode();

  const t = (key: TranslationKey) => {
    return (translations as any)[lang][key] || key;
  };

  const syncAuth = useCallback(() => {
    if (typeof window === 'undefined') return;
    const savedRole = localStorage.getItem('user_role');
    const savedName = localStorage.getItem('username');
    if (savedRole !== null) {
      const parsedRole = parseInt(savedRole, 10);
      setRole(isNaN(parsedRole) ? 99 : parsedRole); // 99作为降级的安全默认值 (Staff)
      setUsername(savedName || "User");
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    syncAuth();
    const savedLang = localStorage.getItem('app_lang') || 'en';
    setLang(savedLang);

    const handleLangChange = () => {
      setLang(localStorage.getItem('app_lang') || 'en');
    };

    window.addEventListener('languageChange', handleLangChange);
    window.addEventListener('popstate', syncAuth);
    window.addEventListener('pageshow', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      window.removeEventListener('popstate', syncAuth);
      window.removeEventListener('pageshow', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, [syncAuth]);

  useEffect(() => { syncAuth(); }, [pathname, syncAuth]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logout Successful");
    setTimeout(() => { window.location.href = '/login'; }, 500);
  };

  const getRoleBadge = (roleId: number) => {
    switch (roleId) {
      case 0: return t('super_admin');
      case 1: return t('administrator');
      case 2: return t('operator');
      case 3: return t('finance_role');
      default: return t('staff');
    }
  };

  // --- [ 权限判定逻辑 ] ---
  const IS_SUPERADMIN = mounted && role === 0;
  const IS_ADMIN = mounted && (role === 1 || role === 0);
  const IS_OPERATOR = mounted && role === 2;
  const IS_FINANCE = mounted && role === 3;

  const navItemStyles = "flex items-center justify-center gap-2.5 h-11 px-5 text-[14px] transition-all group rounded-xl cursor-pointer";
  const activeStyles = "font-bold text-primary";
  const inactiveStyles = "font-medium text-slate-500 dark:text-slate-400 hover:text-primary";
  const dropdownItemStyles = "flex items-center gap-3 px-3.5 py-2.5 text-[13px] text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="w-full px-[50px] h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center min-w-[60px]">
          <Link href="/dashboard" className="group cursor-pointer">
            <div className="transition-all duration-300 transform group-hover:scale-105 active:scale-95 flex items-center justify-center">
              <img
                src="/logo.jpg"
                alt="SHS Logo"
                className="w-12 h-12 object-contain rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
              <div className="logo-fallback hidden w-12 h-12 bg-slate-900 dark:bg-slate-800 p-2.5 rounded-2xl text-white group-hover:bg-primary transition-all duration-300 items-center justify-center">
                <Zap size={22} fill="currentColor" />
              </div>
            </div>
          </Link>
        </div>

        {/* 导航部分 */}
        <div className="flex items-center gap-1">
          
          <Link href="/dashboard" className={`${navItemStyles} ${pathname === '/dashboard' ? activeStyles : inactiveStyles}`}>
            <LayoutDashboard size={19} />
            <span>{t('dashboard')}</span>
          </Link>

          {isNextGen && (
            <Link href="/monitoring" className={`${navItemStyles} ${pathname === '/monitoring' ? activeStyles : inactiveStyles}`}>
              <Monitor size={19} />
              <span>{t('monitoring')}</span>
            </Link>
          )}

          {mounted && (
            <>
              {/* 1. Settings / Rates 逻辑 */}
              {IS_ADMIN && (
                <div
                  onMouseEnter={() => handleMouseEnter(setOpenBasic, timeoutBasic)}
                  onMouseLeave={() => handleMouseLeave(setOpenBasic, timeoutBasic)}
                >
                  <DropdownMenu open={openBasic} onOpenChange={setOpenBasic} modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button className={`outline-none ${navItemStyles} ${pathname.includes('/settings') ? activeStyles : inactiveStyles}`}>
                        <Settings size={19} />
                        <span>{t('settings')}</span>
                        <ChevronDown size={13} className={`ml-1 transition-transform duration-200 ${openBasic ? 'rotate-180' : ''}`} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      sideOffset={2}
                      className="w-48 p-1 bg-white dark:bg-slate-900 shadow-xl dark:shadow-none rounded-xl border-slate-100 dark:border-slate-800"
                      onMouseEnter={() => handleMouseEnter(setOpenBasic, timeoutBasic)}
                      onMouseLeave={() => handleMouseLeave(setOpenBasic, timeoutBasic)}
                    >
                      <DropdownMenuItem asChild className="p-0"><Link href="/settings/regions" className={dropdownItemStyles}><Map size={16}/> {t('regions')}</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-0"><Link href="/settings/branches" className={dropdownItemStyles}><Building2 size={16}/> {t('branches')}</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-0"><Link href="/settings/templates" className={dropdownItemStyles}><FileSpreadsheet size={16}/> {t('templates')}</Link></DropdownMenuItem>
                      {/* Temporarily hidden for production / 暂时隐藏迁移选项 */}
                      {/* <DropdownMenuItem asChild className="p-0"><Link href="/settings/migration" className={dropdownItemStyles}><RefreshCw size={16}/> {t('migration')}</Link></DropdownMenuItem> */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* 2. Users 逻辑 */}
              {IS_ADMIN ? (
                <div
                  onMouseEnter={() => handleMouseEnter(setOpenUser, timeoutUser)}
                  onMouseLeave={() => handleMouseLeave(setOpenUser, timeoutUser)}
                >
                  <DropdownMenu open={openUser} onOpenChange={setOpenUser} modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button className={`outline-none ${navItemStyles} ${pathname.includes('/users') || pathname.includes('/customers') ? activeStyles : inactiveStyles}`}>
                        <Users size={19} />
                        <span>{t('users')}</span>
                        <ChevronDown size={13} className={`ml-1 transition-transform duration-200 ${openUser ? 'rotate-180' : ''}`} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      sideOffset={2}
                      className="w-48 p-1 bg-white dark:bg-slate-900 shadow-xl dark:shadow-none rounded-xl border-slate-100 dark:border-slate-800"
                      onMouseEnter={() => handleMouseEnter(setOpenUser, timeoutUser)}
                      onMouseLeave={() => handleMouseLeave(setOpenUser, timeoutUser)}
                    >
                      <DropdownMenuItem asChild className="p-0"><Link href="/customers" className={dropdownItemStyles}><UserSquare size={16}/> {t('customers')}</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-0"><Link href="/users" className={dropdownItemStyles}><UserCog size={16}/> {t('team')}</Link></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (IS_OPERATOR || IS_FINANCE) ? (
                <Link href="/customers" className={`${navItemStyles} ${pathname.includes('/customers') ? activeStyles : inactiveStyles}`}>
                  <UserSquare size={19} />
                  <span>{t('customers')}</span>
                </Link>
              ) : null}

              {/* 3. Devices */}
              <div
                onMouseEnter={() => handleMouseEnter(setOpenDevice, timeoutDevice)}
                onMouseLeave={() => handleMouseLeave(setOpenDevice, timeoutDevice)}
              >
                <DropdownMenu open={openDevice} onOpenChange={setOpenDevice} modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button className={`outline-none ${navItemStyles} ${pathname.includes('/devices') ? activeStyles : inactiveStyles}`}>
                      <Monitor size={19} />
                      <span>{t('devices')}</span>
                      <ChevronDown size={13} className={`ml-1 transition-transform duration-200 ${openDevice ? 'rotate-180' : ''}`} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    sideOffset={2}
                    className="w-48 p-1 bg-white dark:bg-slate-900 shadow-xl dark:shadow-none rounded-xl border-slate-100 dark:border-slate-800"
                    onMouseEnter={() => handleMouseEnter(setOpenDevice, timeoutDevice)}
                    onMouseLeave={() => handleMouseLeave(setOpenDevice, timeoutDevice)}
                  >
                    <DropdownMenuItem asChild className="p-0"><Link href="/devices/card" className={dropdownItemStyles}><CreditCard size={16}/> {t('ic_cards')}</Link></DropdownMenuItem>
                    {!IS_OPERATOR && (
                      <DropdownMenuItem asChild className="p-0"><Link href="/devices/pos" className={dropdownItemStyles}><CreditCard size={16}/> {t('pos')}</Link></DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="p-0"><Link href="/devices/solar" className={dropdownItemStyles}><Tablet size={16}/> {t('solar_units')}</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* 4. Finance */}
              {(IS_ADMIN || IS_FINANCE) ? (
                <div
                  onMouseEnter={() => handleMouseEnter(setOpenFinance, timeoutFinance)}
                  onMouseLeave={() => handleMouseLeave(setOpenFinance, timeoutFinance)}
                >
                  <DropdownMenu open={openFinance} onOpenChange={setOpenFinance} modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button className={`outline-none ${navItemStyles} ${pathname.includes('/finance') ? activeStyles : inactiveStyles}`}>
                        <Wallet size={19} />
                        <span>{t('finance')}</span>
                        <ChevronDown size={13} className={`ml-1 transition-transform duration-200 ${openFinance ? 'rotate-180' : ''}`} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      sideOffset={2}
                      className="w-48 p-1 bg-white dark:bg-slate-900 shadow-xl dark:shadow-none rounded-xl border-slate-100 dark:border-slate-800"
                      onMouseEnter={() => handleMouseEnter(setOpenFinance, timeoutFinance)}
                      onMouseLeave={() => handleMouseLeave(setOpenFinance, timeoutFinance)}
                    >
                      <DropdownMenuItem asChild className="p-0"><Link href="/finance" className={dropdownItemStyles}><Wallet size={16}/> {t('transactions')}</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-0"><Link href="/finance/expired" className={dropdownItemStyles}><ShieldAlert size={16}/> {t('expired_accounts')}</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-0"><Link href="/finance/reconcile" className={dropdownItemStyles}><Monitor size={16}/> {t('reconciliation')}</Link></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : IS_OPERATOR ? (
                <Link href="/finance" className={`${navItemStyles} ${pathname === '/finance' ? activeStyles : inactiveStyles}`}>
                  <Wallet size={19} />
                  <span>{t('finance')}</span>
                </Link>
              ) : null}
            </>
          )}
        </div>

        {/* 用户信息与登出 */}
        <div className="flex items-center gap-4 min-w-[200px] justify-end">
          
          {/* Hardware Mode Toggle - Temporarily disabled for production */}
          {/*
          <button
            onClick={toggleMode}
            title={`Switch to ${isNextGen ? 'Legacy' : 'NextGen'} Mode`}
            className={cn(
              "p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2",
              isNextGen
                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Wifi size={20} />
          </button>
          */}

          <NotificationCenter />
          <ThemeToggle />
          {/* Temporarily disabled language toggle | 暂时禁用语言切换 */}
          {/* <LanguageToggle /> */}

          <div className="flex flex-col items-end border-r border-slate-100 dark:border-slate-800/50 pr-5">
            <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-none">
              {mounted ? username : "---"}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-primary mt-2 leading-none">
              {mounted ? getRoleBadge(role) : "Checking..."}
            </span>
          </div>

          <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}