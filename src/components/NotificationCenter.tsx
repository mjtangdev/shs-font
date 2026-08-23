'use client';

import React from 'react';
import { Bell, CheckCheck, Trash2, Clock, Zap, CreditCard, Cpu, Wallet, RefreshCw } from 'lucide-react';
import { useSSE, Notification } from './SSEProvider';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

export function NotificationCenter() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useSSE();

  const getIcon = (event: string, type: string) => {
    switch (event) {
      case 'CARD_REGISTERED': return <CreditCard size={14} className="text-green-500" />;
      case 'SOLAR_UNIT_REGISTERED': return <Zap size={14} className="text-green-500" />;
      case 'POS_REGISTERED': return <Cpu size={14} className="text-green-500" />;
      case 'POS_RECHARGE_UPLOADED': return <Wallet size={14} className="text-green-500" />;
      case 'POS_DATA_SYNCED': return <RefreshCw size={14} className="text-slate-400" />;
      default: return <Bell size={14} />;
    }
  };

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id);

    // 根据事件类型跳转到相应页面
    switch (n.event) {
      case 'CARD_REGISTERED':
        router.push('/devices/card');
        break;
      case 'SOLAR_UNIT_REGISTERED':
        router.push('/devices/solar');
        break;
      case 'POS_REGISTERED':
        router.push('/devices/pos');
        break;
      case 'POS_RECHARGE_UPLOADED':
      case 'POS_DATA_SYNCED':
        router.push('/finance');
        break;
      default:
        // 如果是通用通知，可以不跳转或跳转到 Dashboard
        break;
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 cursor-pointer outline-none">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950 animate-in zoom-in">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden" sideOffset={8}>
        <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <DropdownMenuLabel className="p-0 font-black text-[11px] uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100">
            Notifications
          </DropdownMenuLabel>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
              className="p-1 hover:text-primary transition-colors"
              title="Mark all as read"
            >
              <CheckCheck size={14} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); clearNotifications(); }}
              className="p-1 hover:text-red-500 transition-colors"
              title="Clear all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-slate-400 gap-2 opacity-50">
              <Bell size={32} strokeWidth={1} />
              <span className="text-[10px] font-black uppercase tracking-widest">No notifications</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "flex flex-col gap-1 p-4 border-b border-slate-50 dark:border-white/5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/5",
                    !n.read && "bg-primary/5 dark:bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                        {getIcon(n.event, n.type)}
                      </div>
                      <span className={cn(
                        "text-[11px] font-black uppercase tracking-tight",
                        !n.read
                          ? (['CARD_REGISTERED', 'SOLAR_UNIT_REGISTERED', 'POS_REGISTERED'].includes(n.event) ? "text-green-600 dark:text-green-400" : "text-slate-900 dark:text-slate-100")
                          : "text-slate-500"
                      )}>
                        {n.title}
                      </span>
                    </div>
                    {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className={cn(
                    "text-[11px] leading-relaxed pl-9",
                    ['CARD_REGISTERED', 'SOLAR_UNIT_REGISTERED', 'POS_REGISTERED'].includes(n.event)
                      ? "text-slate-600 dark:text-slate-400 font-medium"
                      : "text-slate-500 dark:text-slate-400"
                  )}>
                    {n.description}
                  </p>
                  <div className="flex items-center gap-1 pl-9 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    <Clock size={10} />
                    {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
              System Logs Real-time
            </span>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
