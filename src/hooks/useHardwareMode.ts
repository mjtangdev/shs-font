'use client';

import { useState, useEffect, useCallback } from 'react';

// 硬件版本类型定义
export type HardwareMode = 'legacy' | 'nextgen';

export function useHardwareMode() {
  const [mode, setMode] = useState<HardwareMode>('legacy');
  const [mounted, setMounted] = useState(false);

  // 初始化时从 localStorage 读取
  useEffect(() => {
    // Force legacy mode for production build
    setMode('legacy');
    setMounted(true);
  }, []);

  const setHardwareMode = useCallback((newMode: HardwareMode) => {
    // Temporarily disabled for production
    // setMode(newMode);
    // localStorage.setItem('shs_hardware_mode', newMode);
    // window.dispatchEvent(new CustomEvent('shs-hardware-mode-change', { detail: newMode }));
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'legacy' ? 'nextgen' : 'legacy';
    setHardwareMode(newMode);
  }, [mode, setHardwareMode]);

  return {
    mode,
    isNextGen: mode === 'nextgen',
    isLegacy: mode === 'legacy',
    setHardwareMode,
    toggleMode,
    mounted
  };
}
