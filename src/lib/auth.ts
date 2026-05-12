import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * 执行全局登出操作：
 * - 清理所有 localStorage 数据
 * - 清除 shs_token Cookie
 * - 重定向到登录页面
 * @param router Next.js useRouter 实例
 */
export const logout = (router: AppRouterInstance) => {
  localStorage.clear(); // 清理所有本地缓存数据
  document.cookie = "shs_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax"; // 清除身份验证 Cookie
  document.cookie = "shs_setup_status=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax"; // 清除初始化状态 Cookie
  router.push('/login'); // 跳转回登录页面
};