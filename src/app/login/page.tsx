"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import { ASSETS } from '@/lib/assets/images'; // 💡 确保这里引用了你的 Base64 资源
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import { Loader2, Lock, User, ArrowRight } from 'lucide-react';
import { FlickeringGrid } from "@/components/magicui/flickering-grid"; // 💡 引入 Flickering Grid

export default function FlickeringLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams({ username, password });
      const { data } = await apiClient.post('/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('shs_token', data.access_token);
      toast.success("Login Successful");
      setTimeout(() => router.push('/'), 800);
    } catch (err: any) {
      toast.error("Login Failed", { description: "Invalid credentials" });
    } finally {
      setLoading(false);
    }
  };

  return (
    // 💡 整个容器设为 relative，以便背景网格绝对定位
    <div className="min-h-screen flex items-center justify-center bg-white overflow-hidden relative">
      <Toaster position="top-center" richColors />

      {/* 💡 第一层：Magic UI Flickering Grid 背景 */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <FlickeringGrid
          className="w-full h-full"
          squareSize={4}
          gridGap={6}
          // 使用 slate 色调，并设置 20% 的不透明度 (0.2)
          color="#94a3b8" 
          maxOpacity={0.2} // 💡 关键：设置 20% 的最大不透明度
          flickerChance={0.1}
          height={1600} // 根据需要调整，确保覆盖全屏
          width={1600} // 根据需要调整
        />
      </div>

      {/* 💡 第二层：现有的登录布局 - 确保背景色为 transparent */}
      <div className="flex flex-col lg:flex-row w-full h-screen z-10 relative bg-transparent">
        
        {/* 左侧：2/3 占比展示区 - 调整背景为透明/浅色遮罩 */}
        <div className="hidden lg:flex lg:w-2/3 flex-col items-center justify-between p-24 bg-slate-50/10 backdrop-blur-sm">
          
          {/* 这里放置放大后的图片 */}
          <div className="w-full flex items-center justify-center pt-16">
            <img 
              src={ASSETS.SOLAR_ILLUSTRATION} 
              alt="Solar System Terminal"
              className="w-full max-w-2xl h-auto object-contain pointer-events-none select-none"
            />
          </div>
          
          {/* 这里放置缩小后的标题 */}
          <div className="text-center pb-20 w-full">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">
              Solar Home System
            </h1>
            <p className="text-slate-400 mt-4 text-xl font-light italic">
              Management & Monitoring Terminal
            </p>
          </div>
        </div>

        {/* 右侧：1/3 占比登录区 - 保持基础样式，加入一点半透明感 */}
        <div className="w-full lg:w-1/3 flex flex-col justify-center p-8 lg:p-16 bg-white/90 backdrop-blur-lg border-l border-slate-100 shadow-2xl shadow-slate-200/50">
          <div className="max-w-[360px] w-full mx-auto">
            
            <div className="mb-14 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-slate-950 tracking-tight italic">Sign In</h2>
              <p className="text-slate-500 mt-2 text-lg font-light italic">Authorized access only</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              
              {/* 用户名 */}
              <div className="relative group flex items-center">
                <User size={18} className="absolute left-3.5 text-slate-400 group-focus-within:text-slate-950 transition-colors z-10" />
                <Input 
                  required
                  type="text" 
                  placeholder="Username"
                  className="w-full h-12 pl-11 bg-white/50 border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-950 shadow-none transition-all placeholder:text-slate-300 text-lg font-medium tracking-wide"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* 密码 */}
              <div className="relative group flex items-center">
                <Lock size={18} className="absolute left-3.5 text-slate-400 group-focus-within:text-slate-950 transition-colors z-10" />
                <Input 
                  required
                  type="password" 
                  placeholder="Password"
                  className="w-full h-12 pl-11 bg-white/50 border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-slate-950 shadow-none transition-all placeholder:text-slate-300 text-lg font-medium tracking-wide"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-950 hover:bg-black text-white rounded-lg h-12 text-md font-bold transition-all shadow-lg shadow-slate-200 active:scale-[0.98] mt-6 flex items-center justify-center gap-2"
                >
                {loading ? <Loader2 className="animate-spin" size={24} /> : (
                  <>
                  <span>LOG IN</span>
                  <ArrowRight size={18} />
                  </>
                )}
                </Button>
              </div>
            </form>

            {/* 页脚 */}
            <div className="mt-32 text-center lg:text-left border-t border-slate-50 pt-8 footer">
              <p className="text-[10px] text-slate-200 font-medium tracking-[0.4em] uppercase leading-relaxed footer-text">
                Terminal System v2.6.4 <br/> Quzelco Grid Tech © 2026
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}