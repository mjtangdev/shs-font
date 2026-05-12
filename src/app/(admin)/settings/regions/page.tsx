'use client';

import Breadcrumbs from '@/components/Breadcrumbs'; 
import { RegionManagement } from '@/components/RegionManagement';

export default function RegionsPage() {
  return (
    <div className="py-8 px-6 md:px-[60px] max-w-[1920px] mx-auto space-y-6 animate-in fade-in duration-1000">
      
      {/* 导航 (Navigation) */}
      <Breadcrumbs 
          items={[
            { label: 'regions' } 
          ]}
        />
      <RegionManagement />
    </div>
  );
}