import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

const Breadcrumbs = ({ items = [] }: BreadcrumbsProps) => {
  return (
    // leading-none 确保行高不干扰 flex 居中
    <nav className="flex items-center gap-4 text-slate-400 leading-none">
      {/* 1. Dashboard 固定层级 */}
      <Link 
        href="/dashboard" 
        className="flex items-center hover:text-slate-900 transition-colors group"
      >
        <span className="text-[12px] font-black uppercase tracking-[0.12em] group-hover:italic">
          dashboard
        </span>
      </Link>

      {/* 2. 动态渲染后续层级 */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.label} className="flex items-center gap-4">
            {/* 12px 字体下，图标 12px 配合极细微下移，对齐效果最佳 */}
            <ChevronRight 
              size={12} 
              className="text-slate-400 shrink-0 translate-y-[0.5px] opacity-70" 
            />
            
            {isLast ? (
              // 当前页面：高亮黄色
              <div className="text-yellow-500 italic font-black text-[12px] uppercase tracking-[0.12em] whitespace-nowrap">
                {item.label}
              </div>
            ) : (
              // 中间路径
              <Link 
                href={item.href || '#'} 
                className="hover:text-slate-900 transition-colors group flex items-center"
              >
                <span className="text-[12px] font-black uppercase tracking-[0.12em] group-hover:italic whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;