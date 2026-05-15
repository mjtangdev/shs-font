'use client';

import React from 'react';

export default function SkeuoICCard() {
  return (
    <div className="inline-flex items-center ml-4 select-none opacity-0 animate-in fade-in slide-in-from-left-2 fill-mode-forwards duration-1000">
      {/* 工业风连接线 */}
      <div className="w-4 h-[2px] bg-slate-900/10 mr-5 rounded-full" />

      <div className="relative group">
        {/* 卡片本体：深蓝色材质 + 物理厚度阴影 + 内凹陷感 */}
        <div 
          className="relative w-12 h-7 rounded-[3px] overflow-hidden transition-transform duration-500 group-hover:-translate-y-0.5"
          style={{
            // 基础塑料渐变
            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
            // 超重叠层阴影：模拟物理厚度边缘 (硬阴影) + 落地环境阴影 (软阴影) + 内边缘高光
            boxShadow: `
              inset 0 1px 1px rgba(255,255,255,0.3), 
              inset 0 -1px 1px rgba(0,0,0,0.2),
              1px 1px 0px #172554, 
              2px 2px 0px #172554, 
              3px 3px 0px #172554,
              5px 5px 10px rgba(0,0,0,0.4)
            `,
            border: '0.5px border rgba(255,255,255,0.1)'
          }}
        >
          
          {/* 1. 拟物化 IC 芯片：多层金属蚀刻效果 */}
          <div 
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[14px] h-[10px] rounded-[1px] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #fcd34d 0%, #d97706 100%)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.2)'
            }}
          >
            {/* 芯片触点细线 (蚀刻感) */}
            <div className="absolute inset-0 flex flex-wrap opacity-80">
              <div className="w-1/2 h-1/2 border-r-[0.5px] border-b-[0.5px] border-black/20" />
              <div className="w-1/2 h-1/2 border-b-[0.5px] border-black/20" />
              <div className="w-1/2 h-1/2 border-r-[0.5px] border-black/20" />
              <div className="w-1/2 h-1/2" />
            </div>
          </div>

          {/* 2. 表面流光动画：模拟光线划过油亮塑料表面 */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              width: '200%',
              transform: 'skewX(-20deg)',
              animation: 'move-light 3.5s infinite linear'
            }}
          />

          {/* 3. 装饰性哑光条 (模拟磁条边缘感) */}
          <div className="absolute bottom-1 right-1.5 w-4 h-[1px] bg-black/20 rounded-full" />
        </div>

        {/* 4. 实时工作指示灯：右上角微型绿灯 (自带呼吸) */}
        <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full border-[1.5px] border-white bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
      </div>

      {/* 5. 侧边状态标注 */}
      <div className="ml-5 flex flex-col justify-center leading-none gap-1">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-900 italic">
            SECURE_LINK
          </span>
        </div>
        <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest pl-2.5">
          NFC_PROTOCOL
        </span>
      </div>

      {/* 注入动画 Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes move-light {
          0% { transform: translateX(-120%) skewX(-20deg); }
          30% { transform: translateX(120%) skewX(-20deg); }
          100% { transform: translateX(120%) skewX(-20deg); }
        }
      `}} />
    </div>
  );
}