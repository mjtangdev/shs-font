'use client';

import React, { useEffect, useRef, createContext, useContext, useState } from 'react';
import { toast } from 'sonner';
import { Zap, CreditCard, Cpu, Wallet, RefreshCw, Bell, CloudUpload } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface SSEEvent {
  event: 'CARD_REGISTERED' | 'SOLAR_UNIT_REGISTERED' | 'POS_REGISTERED' | 'POS_RECHARGE_UPLOADED' | 'POS_DATA_SYNCED';
  data: any;
  timestamp: string;
}

export interface Notification {
  id: string;
  event: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'high';
}

interface SSEContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

export function useSSE() {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSE must be used within a SSEProvider');
  }
  return context;
}

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('shs_notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load notifications", e);
      }
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('shs_notifications', JSON.stringify(notifications.slice(0, 50)));
  }, [notifications]);

  useEffect(() => {
    const connectSSE = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('shs_token') : null;
      if (!token) {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        return;
      }

      if (eventSourceRef.current) return;

      const url = `${API_BASE_URL}/pos-terminal/events/stream`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const payload: SSEEvent = JSON.parse(event.data);
          handleSSEEvent(payload);
        } catch (err) {
          console.error("[SSE] Failed to parse event data:", err);
        }
      };

      es.onerror = () => {
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
        // Reconnect logic is built-in to EventSource
      };
    };

    connectSSE();
    window.addEventListener('storage', connectSSE);

    return () => {
      window.removeEventListener('storage', connectSSE);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const handleSSEEvent = (payload: SSEEvent) => {
    const { event, data, timestamp } = payload;
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let title = "";
    let description = "";
    let type: Notification['type'] = 'info';
    let icon: React.ReactNode = <Bell size={18} />;

    switch (event) {
      case 'CARD_REGISTERED':
        title = "Card Registered";
        description = `UUID: ${data.card_uuid} by ${data.operator}`;
        icon = <CreditCard size={18} className="text-green-600" />;
        toast(<span className="text-green-600 font-black uppercase tracking-tight">{title}</span>, {
          description: <span className="text-slate-600 dark:text-slate-400 text-xs">{description}</span>,
          icon
        });
        break;
      case 'SOLAR_UNIT_REGISTERED':
        title = "Solar Unit Provisioned";
        description = `ID: ${data.shs_machine_id} by ${data.operator}`;
        icon = <Zap size={18} className="text-green-600" />;
        toast(<span className="text-green-600 font-black uppercase tracking-tight">{title}</span>, {
          description: <span className="text-slate-600 dark:text-slate-400 text-xs">{description}</span>,
          icon
        });
        break;
      case 'POS_REGISTERED':
        title = "POS Activated";
        description = `SN: ${data.pos_sn} by ${data.operator}`;
        icon = <Cpu size={18} className="text-green-600" />;
        toast(<span className="text-green-600 font-black uppercase tracking-tight">{title}</span>, {
          description: <span className="text-slate-600 dark:text-slate-400 text-xs">{description}</span>,
          icon
        });
        break;
      case 'POS_RECHARGE_UPLOADED':
        title = "Financial Sync Success";
        description = `POS ${data.pos_sn}: ${data.summary.transactions} txns.`;
        type = 'high';
        icon = <CloudUpload className="text-green-600 animate-bounce" size={20} />;
        toast.success(
          <span className="text-green-600 font-black uppercase tracking-tight">{title}</span>,
          {
            description: <span className="text-slate-500 font-medium">{description}</span>,
            icon,
            duration: 8000,
            className: "border-l-4 border-l-green-500"
          }
        );
        break;
      case 'POS_DATA_SYNCED':
        title = "POS Data Synced";
        description = `POS ${data.pos_sn}: ${data.summary.new_customers} customers.`;
        icon = <RefreshCw className="text-blue-500" size={18} />;
        toast(title, { description, icon });
        break;
    }

    if (title) {
      const newNotification: Notification = {
        id,
        event,
        title,
        description,
        timestamp: timestamp || new Date().toISOString(),
        read: false,
        type
      };
      setNotifications(prev => [newNotification, ...prev]);
      window.dispatchEvent(new CustomEvent('shs-data-refresh', { detail: { event, data } }));
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SSEContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications }}>
      {children}
    </SSEContext.Provider>
  );
}
