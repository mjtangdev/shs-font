import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // 1. 获取 Token (注意：中间件只能读取 Cookie，无法读取 LocalStorage)
  // Note: Middleware runs on server-side, it can only access Cookies.
  const token = request.cookies.get('shs_token')?.value;
  const setupStatus = request.cookies.get('shs_setup_status')?.value; // 获取初始化状态 Cookie
  const { pathname } = request.nextUrl;

  // 2. 定义不需要拦截的白名单 / Public paths
  if (pathname === '/login' || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // 3. 如果没有 Token，重定向到登录页 / Redirect to login if no token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. 初始化状态检查逻辑
  // 如果已经登录但没完成初始化，且不在 setup 页面，则强制跳到 /setup
  if (setupStatus !== 'completed' && pathname !== '/setup') {
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  // 如果已经完成初始化，但用户尝试访问 /setup，则重定向到首页
  if (setupStatus === 'completed' && pathname === '/setup') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// 匹配所有路径，除了静态资源 / Match all paths except static files
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};