"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import { ASSETS } from '@/lib/assets/images'; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Lock, User, ArrowRight } from 'lucide-react';
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { TextAnimate } from "@/components/ui/text-animate";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { translations, TranslationKey } from "@/lib/i18n";

import Cookies from 'js-cookie';

const loginInputClass =
  "w-full h-14 pl-12 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl focus-visible:ring-1 focus-visible:ring-slate-950 dark:focus-visible:ring-primary transition-all text-lg text-foreground placeholder:text-muted-foreground";

const loginInputIconClass =
  "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 z-10 group-focus-within:text-slate-950 dark:group-focus-within:text-primary transition-colors pointer-events-none";

export default function SolarWhiteLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Default to English for now | 暂时默认使用英文
  const [lang] = useState<string>("en");
  // const [lang, setLang] = useState<string>("en");

  // --- 修改密码相关状态 ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const router = useRouter();

  // 语言同步
  useEffect(() => {
    // Temporarily disabled language sync | 暂时禁用语言同步
    /*
    const savedLang = localStorage.getItem('app_lang') || 'en';
    setLang(savedLang);

    const handleLangChange = () => {
      setLang(localStorage.getItem('app_lang') || 'en');
    };

    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
    */
  }, []);

  const t = (key: TranslationKey) => {
    return (translations as any)[lang][key] || key;
  };

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
    if (newPassword !== confirmPassword) return toast.error(t('passwordsDoNotMatch'));
    if (newPassword.length < 6) return toast.error(t('passwordTooShort'));

    setUpdatingPassword(true);
    try {
      // 使用 PATCH 方法调用修改密码 API
      await apiClient.patch('/user/me/change-password', { new_password: newPassword });
      
      toast.success(t('passwordUpdatedSuccess'));
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
      // 使用 JSON 格式登录，更可靠且符合现代 SPA 实践
      const { data } = await apiClient.post('/login/token-json', {
        username: username,
        password: password
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

      toast.success(`${t('welcomeBack')}, ${data.username}!`);

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
      toast.error(errorMsg || t('invalidCredentials'));
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



      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <ThemeToggle />
        {/* Temporarily disabled language toggle | 暂时禁用语言切换 */}
        {/* <LanguageToggle /> */}
      </div>

      <div className="flex flex-col lg:flex-row w-full h-screen">
        
        {/* 左侧：2/3 展示区 — dark 模式与右侧同色 */}
        <div className="hidden lg:flex lg:w-2/3 flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-950 p-24 border-r border-slate-100 dark:border-slate-800/50 relative overflow-hidden transition-colors">
          <FlickeringGrid
            className="absolute inset-0 z-0"
            maxOpacity={0.1}
            color="rgb(148, 163, 184)"
            squareSize={4}
            gridGap={6}
          />
          <div className="text-center flex flex-col items-center relative z-10">
            <img 
              src={ASSETS.SOLAR_SYSTEM} 
              className="w-full max-w-2xl h-auto mb-16 select-none pointer-events-none dark:opacity-90"
            />

            <TextAnimate animation="blurIn" className="text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tighter italic">
              Solar Home System
            </TextAnimate>

          </div>
        </div>

        {/* 右侧：1/3 登录区 (白色背景 + 灰色网格) */}
        <div className="w-full lg:w-1/3 flex flex-col justify-center p-8 lg:p-12 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors">
          
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
            bg-white dark:bg-slate-900/40 
            backdrop-blur-2xl 
            border border-white/80 dark:border-slate-700/50 
            shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:shadow-none">
            
            <div className="mb-12">
              <h2 className="text-3xl font-black text-slate-950 dark:text-slate-100 tracking-tight italic">{t('signIn')}</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium italic">{t('authorizedAccess')}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative group">
                <User size={18} className={loginInputIconClass} />
                <Input
                  required
                  placeholder={t('username')}
                  className={loginInputClass}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="relative group">
                <Lock size={18} className={loginInputIconClass} />
                <Input
                  required
                  type="password"
                  placeholder={t('password')}
                  className={loginInputClass}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="pt-6">
                <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-primary text-slate-950 border-none rounded-2xl font-black
                            transition-all duration-300 
                            hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 hover:cursor-pointer
                            active:scale-[0.98] 
                            shadow-lg shadow-primary/20
                            flex items-center justify-center gap-2 group"
                >
                    {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                    ) : (
                    <>
                        <span className="tracking-[0.1em]">{t('logIn')}</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                    )}
                </Button>
            </div>
            </form>

            <div className="mt-20 text-center border-t border-slate-100 dark:border-slate-800/50 pt-8">
              <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold tracking-[0.4em] uppercase">
                Terminal v0.0.1 
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 💡 默认密码修改提示弹出框 - 采用与页面一致的拟物化白玻风格 */}
      <Dialog open={showPasswordDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-[420px] p-0 overflow-hidden border-none rounded-3xl bg-white dark:bg-slate-900/60 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)]">
          <DialogHeader className="sr-only"><DialogTitle>{t('securityActionRequired')}</DialogTitle><DialogDescription>{t('defaultPasswordNotice')}</DialogDescription></DialogHeader>
          <div className="p-10">
              
              <div className="mb-8 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 border border-primary/20">
                  <Lock size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-950 dark:text-slate-100 tracking-tight italic">{t('updateDefaultPassword')}</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium leading-relaxed px-4">
                  {t('securityReasonNotice')}
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="relative group">
                  <Lock size={16} className={loginInputIconClass} />
                  <Input
                    required
                    type="password"
                    placeholder={t('newPassword')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`h-12 ${loginInputClass}`}
                  />
                </div>
                <div className="relative group">
                  <Lock size={16} className={loginInputIconClass} />
                  <Input
                    required
                    type="password"
                    placeholder={t('confirmNewPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-12 ${loginInputClass}`}
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit"
                    disabled={updatingPassword}
                    className="w-full h-14 bg-primary text-slate-950 border-none rounded-2xl font-black
                            transition-all duration-300 
                            hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 hover:cursor-pointer
                            active:scale-[0.98] 
                            shadow-lg shadow-primary/20
                            flex items-center justify-center gap-2 group"
                  >
                    {updatingPassword ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <span className="tracking-[0.1em]">{t('confirmUpdate')}</span>
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