"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import { ASSETS } from '@/lib/assets/images'; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Lock, User, ArrowRight } from 'lucide-react';
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { TextAnimate } from "@/components/ui/text-animate";

import Cookies from 'js-cookie';

export default function SolarWhiteLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- 修改密码相关状态 ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const router = useRouter();

  // 辅助函数：更健壮地将后端值转换为布尔值
  const toBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const trimmedValue = value.trim().toLowerCase();
      return trimmedValue === 'true' || trimmedValue === '1';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false; // 默认处理 null, undefined, 0, 空字符串等为 false
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");

    setUpdatingPassword(true);
    try {
      // 使用 PATCH 方法调用修改密码 API
      await apiClient.patch('/user/me/change-password', { new_password: newPassword });
      
      toast.success("Password updated successfully!");
      setShowPasswordDialog(false);
      
      // 1. 同步更新本地状态，标记 password_updated 为 true
      const storedStr = localStorage.getItem('shs_setup_status');
      let currentStatus = { password_updated: true, region_set: false, provider_config_set: false };
      if (storedStr) {
        try { currentStatus = { ...JSON.parse(storedStr), password_updated: true }; } catch(e){}
      }
      const statusStr = JSON.stringify(currentStatus);
      localStorage.setItem('shs_setup_status', statusStr);
      
      const isAllSet = currentStatus.password_updated && currentStatus.region_set && currentStatus.provider_config_set;
      Cookies.set('shs_setup_status', isAllSet ? 'completed' : statusStr, { expires: 1, path: '/' });

      // 2. 根据剩余的系统配置状态决定去向 (强制刷新以更新 Middleware 状态)
      if (!currentStatus.region_set || !currentStatus.provider_config_set) {
        window.location.href = '/setup';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: unknown) {
      const errorDetail = (err as any).response?.data?.detail;
      const errorMsg = Array.isArray(errorDetail) ? errorDetail[0]?.msg : errorDetail;
      toast.error(errorMsg || "Failed to update password. Please try again.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. 构建 FastAPI 要求的 Form Data 格式
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      // 2. 发送请求 (请确保 apiClient 已配置 baseURL)
      const { data } = await apiClient.post('/login/token', params.toString(), {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded' 
        }
      });

      console.log("Login API response data:", data); // 打印完整的后端响应数据
      // --- 核心存储逻辑 ---
      
      const apiSetupStatus = data.setup_status || {}; // 确保 setup_status 存在，否则使用空对象

      // 存储 Token 用于后续 API 鉴权
      Cookies.set('shs_token', data.access_token, { expires: 1, path: '/' });
      localStorage.setItem('shs_token', data.access_token);
      
      // 存储基本用户信息
      if (data.user_role) localStorage.setItem('user_role', data.user_role.toString());
      if (data.username) localStorage.setItem('username', data.username);
      
      // --- 初始化状态处理 ---
      // 从 data.setup_status 中提取并使用更健壮的 toBoolean 函数处理布尔值
      const isPasswordUpdated = toBoolean(apiSetupStatus.password_updated);
      const regionSet = toBoolean(apiSetupStatus.region_set);
      const providerConfigSet = toBoolean(apiSetupStatus.provider_config_set);

      const setupStatus = {
        password_updated: isPasswordUpdated, // 将 password_updated 也加入 setupStatus
        region_set: regionSet,
        provider_config_set: providerConfigSet
      };

      const setupStatusStr = JSON.stringify(setupStatus);
      localStorage.setItem('shs_setup_status', setupStatusStr);
      // 恢复写入 'completed' 魔术字符串，兼容 Middleware 的拦截判断逻辑
      Cookies.set('shs_setup_status', (isPasswordUpdated && regionSet && providerConfigSet) ? 'completed' : setupStatusStr, { expires: 1, path: '/' });

      // 主动清理可能在之前的版本中残留的无用独立标识
      ['is_initialized', 'region_set', 'provider_config_set'].forEach(k => {
        localStorage.removeItem(k);
        Cookies.remove(k, { path: '/' });
      });

      // --- 密码安全检查 ---
      console.log("Password Update Check:", { original: apiSetupStatus.password_updated, type: typeof apiSetupStatus.password_updated, resolved: isPasswordUpdated });

      if (!isPasswordUpdated) {
        console.log("Condition met: data.password_updated is false. Showing password dialog."); // 确认条件是否满足
        setShowPasswordDialog(true);
        setLoading(false);
        return; // 拦截跳转逻辑
      }

      toast.success(`Welcome back, ${data.username}!`);

      // --- 跳转逻辑 (仅在密码已更新的情况下执行) ---
      setTimeout(() => {
        // 根据新字段判断是否需要初始化
        if (!regionSet || !providerConfigSet) {
          window.location.href = '/setup'; // 强制硬刷新跳转
        } else {
          window.location.href = '/dashboard'; // 强制硬刷新跳转
        }
      }, 800);

    } catch (err: unknown) {
      const errorData = (err as any).response?.data;
      console.error("Login Detail Error:", errorData);
      // 提取 FastAPI 的错误信息
      const errorDetail = errorData?.detail;
      const errorMsg = Array.isArray(errorDetail) ? errorDetail[0]?.msg : errorDetail;
      toast.error(errorMsg || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 强制性安全检查：隐藏 Dialog 的默认关闭按钮 */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Target specific classes/attributes used by Shadcn/Radix DialogClose component */
        button[class*="DialogClose"], /* For buttons with class name containing DialogClose */
        .DialogClose,                /* For exact class name DialogClose */
        [data-radix-dialog-close] {  /* For Radix UI's data attribute on close button */
          display: none !important; 
        }
      ` }} />

      <Toaster position="top-center" richColors />

      <div className="flex flex-col lg:flex-row w-full h-screen">
        
        {/* 左侧：2/3 展示区 */}
        <div className="hidden lg:flex lg:w-2/3 flex-col items-center justify-center bg-slate-50/30 p-24 border-r border-slate-100 relative overflow-hidden">
          <div className="text-center flex flex-col items-center">
            <img 
              src={ASSETS.SOLAR_SYSTEM} 
              className="w-full max-w-2xl h-auto mb-16 select-none pointer-events-none"
            />
            
            <TextAnimate animation="blurIn" className="text-5xl font-black text-slate-900 tracking-tighter italic">
                Solar Home System
            </TextAnimate>

          </div>
        </div>

        {/* 右侧：1/3 登录区 (白色背景 + 灰色网格) */}
        <div className="w-full lg:w-1/3 flex flex-col justify-center p-8 lg:p-12 bg-white relative overflow-hidden">
          
          {/* 💡 白色背景上的灰色闪烁网格 */}
          <FlickeringGrid 
            className="absolute inset-0 z-0" 
            maxOpacity={0.1} 
            color="rgb(148, 163, 184)" 
            squareSize={4}
            gridGap={6}
          />

          {/* 💡 增强通透感的白色毛玻璃卡片 */}
          <div className="max-w-[400px] w-full mx-auto relative z-10 
            p-10 rounded-[2.5rem] 
            /* 关键：使用极淡的白色背景和厚重的模糊来实现白底上的玻璃感 */
            bg-white/5 
            backdrop-blur-2xl 
            border border-white/80 
            shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]">
            
            <div className="mb-12">
              <h2 className="text-3xl font-black text-slate-950 tracking-tight italic">Sign In</h2>
              <p className="text-slate-500 mt-2 text-lg font-medium italic">Authorized access only</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 group-focus-within:text-slate-950 transition-colors" />
                <Input 
                  required
                  placeholder="Username"
                  className="w-full h-14 pl-12 bg-white/60 border-slate-200 rounded-2xl focus-visible:ring-1 focus-visible:ring-slate-950 transition-all text-lg placeholder:text-slate-300"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 group-focus-within:text-slate-950 transition-colors" />
                <Input 
                  required
                  type="password" 
                  placeholder="Password"
                  className="w-full h-14 pl-12 bg-white/60 border-slate-200 rounded-2xl focus-visible:ring-1 focus-visible:ring-slate-950 transition-all text-lg placeholder:text-slate-300"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="pt-6">
                <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-yellow-400 text-black border-none rounded-2xl font-black 
                            transition-all duration-300 
                            hover:bg-black hover:text-white hover:cursor-pointer 
                            active:scale-[0.98] 
                            shadow-lg shadow-yellow-400/20 
                            flex items-center justify-center gap-2 group"
                >
                    {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                    ) : (
                    <>
                        <span className="tracking-[0.1em]">LOG IN</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                    )}
                </Button>
            </div>
            </form>

            <div className="mt-20 text-center border-t border-slate-100 pt-8">
              <p className="text-[10px] text-slate-300 font-bold tracking-[0.4em] uppercase">
                Terminal v0.0.1 
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 💡 默认密码修改提示弹出框 - 采用与页面一致的拟物化白玻风格 */}
      <Dialog open={showPasswordDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-[420px] p-0 overflow-hidden border-none rounded-3xl bg-white shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)]">
          <DialogHeader className="sr-only"><DialogTitle>Security Action Required</DialogTitle><DialogDescription>Your account is using a default password and needs to be updated.</DialogDescription></DialogHeader>
          <div className="p-10">
              
              <div className="mb-8 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 mb-4">
                  <Lock size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-950 tracking-tight italic">Update Default Password</h3>
                <p className="text-slate-500 mt-2 text-sm font-medium leading-relaxed px-4">
                  For security reasons, you must change your password before proceeding to the dashboard.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                  <Input 
                    required
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 pl-12 bg-slate-50 border-slate-100 rounded-2xl focus-visible:ring-1 focus-visible:ring-slate-950 transition-all"
                  />
                </div>
                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                  <Input 
                    required
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pl-12 bg-slate-50 border-slate-100 rounded-2xl focus-visible:ring-1 focus-visible:ring-slate-950 transition-all"
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit"
                    disabled={updatingPassword}
                    className="w-full h-14 bg-yellow-400 text-black border-none rounded-2xl font-black 
                            transition-all duration-300 
                            hover:bg-black hover:text-white hover:cursor-pointer 
                            active:scale-[0.98] 
                            shadow-lg shadow-yellow-400/20 
                            flex items-center justify-center gap-2 group"
                  >
                    {updatingPassword ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <span className="tracking-[0.1em]">CONFIRM UPDATE</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}