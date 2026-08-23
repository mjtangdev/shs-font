'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).toUpperCase();

  return (
    <div className="flex items-center gap-8 h-full select-none">
      {/* 1. Date Section - Flat Horizontal */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 whitespace-nowrap">
          {dateStr}
        </span>
        <span className="text-[10px] font-black text-slate-200 dark:text-slate-800">/</span>
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest">{time.getFullYear()}</span>
      </div>

      <div className="h-6 w-px bg-slate-100 dark:bg-white/5" />

      {/* 2. Digital Precision Clock */}
      <div className="flex items-baseline gap-0.5 font-black tabular-nums text-slate-900 dark:text-white">
        <span className="text-2xl tracking-tighter">{hours}</span>
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-xl mx-0.5 text-slate-300 dark:text-slate-700"
        >
          :
        </motion.span>
        <span className="text-2xl tracking-tighter">{minutes}</span>
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-xl mx-0.5 text-slate-300 dark:text-slate-700"
        >
          :
        </motion.span>
        <span className="text-2xl tracking-tighter">{seconds}</span>
      </div>
    </div>
  );
}
