'use client';

import { useState, useEffect, useCallback } from "react";
import { 
  LogOut, LayoutDashboard, Settings, Zap, Users, 
  ChevronDown, UserSquare, UserCog, Wallet, 
  Map, Building2, CreditCard, Tablet, Monitor, ShieldAlert, FileSpreadsheet
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

export function Navbar() {
  const pathname = usePathname();

  const [openBasic, setOpenBasic] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [openDevice, setOpenDevice] = useState(false);
  const [openFinance, setOpenFinance] = useState(false);

  const [role, setRole] = useState<number>(0);
  const [username, setUsername] = useState<string>("");
  const [mounted, setMounted] = useState(false);

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
    window.addEventListener('popstate', syncAuth);
    window.addEventListener('pageshow', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
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
      case 0: return "Super Admin";
      case 1: return "Administrator";
      case 2: return "Operator";
      case 3: return "Finance";
      default: return "Staff";
    }
  };

  // --- [ 权限判定逻辑 ] ---
  const IS_SUPERADMIN = mounted && role === 0;
  const IS_ADMIN = mounted && (role === 1 || role === 0);
  const IS_OPERATOR = mounted && role === 2;
  const IS_FINANCE = mounted && role === 3;

  const navItemStyles = "flex items-center justify-center gap-3 h-12 w-44 text-[15px] transition-all group rounded-xl cursor-pointer";
  const activeStyles = "font-bold text-primary";
  const inactiveStyles = "font-medium text-slate-500 dark:text-slate-400 hover:text-primary";
  const dropdownItemStyles = "flex items-center gap-3 px-3.5 py-2.5 text-[13px] text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="w-full px-[50px] h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center min-w-[60px]">
          <Link href="/dashboard" className="group cursor-pointer">
            <div className="bg-slate-900 dark:bg-slate-800 p-2.5 rounded-2xl text-white group-hover:bg-primary transition-all duration-300">
              <Zap size={22} fill="currentColor" />
            </div>
          </Link>
        </div>

        {/* 导航部分 */}
        <div className="flex items-center gap-1">
          
          <Link href="/dashboard" className={`${navItemStyles} ${pathname === '/dashboard' ? activeStyles : inactiveStyles}`}>
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </Link>

          {mounted && (
            <>
              {/* 1. Settings / Rates 逻辑 */}
              {IS_ADMIN && (
                <div onMouseEnter={() => setOpenBasic(true)} onMouseLeave={() => setOpenBasic(false)}>
                  <DropdownMenu open={openBasic} onOpenChange={setOpenBasic}>
                    <DropdownMenuTrigger asChild>
                      <button className={`outline-none ${navItemStyles} ${pathname.includes('/settings') ? activeStyles : inactiveStyles}`}>
                        <Settings size={19} />
                        <span>Settings</span>
                        <ChevronDown size={13} className={`ml-1 transition-transform duration-200 ${openBasic ? 'rotate-180' : ''}`} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48 p-1 bg-white dark:bg-slate-900 shadow-xl dark:shadow-none rounded-xl border-slate-100 dark:border-slate-800">
                      <DropdownMenuItem asChild className="p-0"><Link href="/settings/regions" className={dropdownItemStyles}><Map size={16}/> Regions</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-0"><Link href="/settings/branches" className={dropdownItemStyles}><Building2 size={16}/> Branches</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-0"><Link href="/settings/templates" className={dropdownItemStyles}><FileSpreadsheet size={16}/> Templates</Link></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* 2. Users 逻辑：ADMIN 是下拉；OPERATOR 和 FINANCE 是单图标 */}
              {IS_ADMIN ? (
                <div onMouseEnter={() => setOpenUser(true)} onMouseLeave={() => setOpenUser(false)}>
                  <DropdownMenu open={openUser} onOpenChange={setOpenUser}>
                    <DropdownMenuTrigger asChild>
                      <button className={`outline-none ${navItemStyles} ${pathname.includes('/users') || pathname.includes('/customers') ? activeStyles : inactiveStyles}`}>
                        <Users size={19} />
                        <span>Users</span>
                        <ChevronDown size={13} className={`ml-1 transition-transform duration-200 ${openUser ? 'rotate-180' : ''}`} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48 p-1 bg-white dark:bg-slate-900 shadow-xl dark:shadow-none rounded-xl border-slate-100 dark:border-slate-800">
                      <DropdownMenuItem asChild className="p-0"><Link href="/customers" className={dropdownItemStyles}><UserSquare size={16}/> Customers</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-0"><Link href="/users" className={dropdownItemStyles}><UserCog size={16}/> Team</Link></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (IS_OPERATOR || IS_FINANCE) ? (
                <Link href="/customers" className={`${navItemStyles} ${pathname.includes('/customers') ? activeStyles : inactiveStyles}`}>
                  <UserSquare size={19} />
                  <span>Customers</span>
                </Link>
              ) : null}

              {/* 3. Devices - 全员可见 (1, 2, 3) */}
              <div onMouseEnter={() => setOpenDevice(true)} onMouseLeave={() => setOpenDevice(false)}>
                <DropdownMenu open={openDevice} onOpenChange={setOpenDevice}>
                  <DropdownMenuTrigger asChild>
                    <button className={`outline-none ${navItemStyles} ${pathname.includes('/devices') ? activeStyles : inactiveStyles}`}>
                      <Monitor size={19} />
                      <span>Devices</span>
                      <ChevronDown size={13} className={`ml-1 transition-transform duration-200 ${openDevice ? 'rotate-180' : ''}`} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48 p-1 bg-white dark:bg-slate-900 shadow-xl dark:shadow-none rounded-xl border-slate-100 dark:border-slate-800">
                    <DropdownMenuItem asChild className="p-0"><Link href="/devices/card" className={dropdownItemStyles}><CreditCard size={16}/> IC Cards</Link></DropdownMenuItem>
                    {!IS_OPERATOR && (
                      <DropdownMenuItem asChild className="p-0"><Link href="/devices/pos" className={dropdownItemStyles}><CreditCard size={16}/> POS</Link></DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="p-0"><Link href="/devices/solar" className={dropdownItemStyles}><Tablet size={16}/> Solar Units</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* 4. Finance - 对账权限控制：ADMIN(0,1) 或 FINANCE(3) */}
              {(IS_ADMIN || IS_FINANCE) ? (
                <div onMouseEnter={() => setOpenFinance(true)} onMouseLeave={() => setOpenFinance(false)}>
                  <DropdownMenu open={openFinance} onOpenChange={setOpenFinance}>
                    <DropdownMenuTrigger asChild>
                      <button className={`outline-none ${navItemStyles} ${pathname.includes('/finance') ? activeStyles : inactiveStyles}`}>
                        <Wallet size={19} />
                        <span>Finance</span>
                        <ChevronDown size={13} className={`ml-1 transition-transform duration-200 ${openFinance ? 'rotate-180' : ''}`} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48 p-1 bg-white dark:bg-slate-900 shadow-xl dark:shadow-none rounded-xl border-slate-100 dark:border-slate-800">
                      <DropdownMenuItem asChild className="p-0"><Link href="/finance" className={dropdownItemStyles}><Wallet size={16}/> Transactions</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-0"><Link href="/finance/expired" className={dropdownItemStyles}><ShieldAlert size={16}/> Expired Accounts</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-0"><Link href="/finance/reconcile" className={dropdownItemStyles}><Monitor size={16}/> Reconciliation</Link></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : IS_OPERATOR ? (
                /* Operator 只能看到交易流水链接，不能看到对账 */
                <Link href="/finance" className={`${navItemStyles} ${pathname === '/finance' ? activeStyles : inactiveStyles}`}>
                  <Wallet size={19} />
                  <span>Finance</span>
                </Link>
              ) : null}
            </>
          )}
        </div>

        {/* 用户信息与登出 */}
        <div className="flex items-center gap-4 min-w-[150px] justify-end">
          
          <ThemeToggle />
          
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