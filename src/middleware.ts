import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. 获取 Token (注意：中间件只能读取 Cookie，无法读取 LocalStorage)
  // Note: Middleware runs on server-side, it can only access Cookies.
  const token = request.cookies.get('shs_token')?.value;
  const { pathname } = request.nextUrl;

  // 2. 定义不需要拦截的白名单 / Public paths
  if (pathname === '/login' || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // 3. 如果没有 Token，重定向到登录页 / Redirect to login if no token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// 匹配所有路径，除了静态资源 / Match all paths except static files
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};