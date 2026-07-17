"use client";

import { useState, useEffect } from "react";

export function LanguageToggle() {
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') || 'en';
    setLang(savedLang);

    const handleLangChange = () => {
      setLang(localStorage.getItem('app_lang') || 'en');
    };

    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const setLanguage = (newLang: string) => {
    if (newLang === lang) return;
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
    window.dispatchEvent(new Event('languageChange'));
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-sm text-[12px] font-bold">
      <button
        onClick={() => setLanguage('en')}
        className={`hover:text-primary transition-colors cursor-pointer ${lang === 'en' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
      >
        EN
      </button>
      <span className="text-slate-200 dark:text-slate-700">|</span>
      <button
        onClick={() => setLanguage('cn')}
        className={`hover:text-primary transition-colors cursor-pointer ${lang === 'cn' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
      >
        中文
      </button>
    </div>
  );
}
