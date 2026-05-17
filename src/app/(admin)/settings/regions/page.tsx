'use client';

import Breadcrumbs from '@/components/Breadcrumbs'; 
import { RegionManagement } from '@/components/RegionManagement';

export default function RegionsPage() {
  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden font-sans transition-colors duration-500 bg-[#f8fafc] dark:bg-slate-950">
      
      {/* 1. Top Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-20 transition-colors">
        <Breadcrumbs items={[{ label: 'regional hierarchy' }]} />
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent transition-colors p-10">
        <div className="max-w-[1920px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <RegionManagement />
        </div>
      </main>
    </div>
  );
}
