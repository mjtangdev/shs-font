// ==============================================================================
// 开发环境 API 地址映射表 / API Server URLs Map
// ==============================================================================
export const SERVER_URLS: Record<string, string> = {
  "local":    "http://localhost:8008/api/v1",
  "unknow":   "http://192.168.2.133:8000/api/v1",
  "ppalma":   "http://192.168.0.117:8000/api/v1",
  "prod":     "https://api.shstest.site/api/v1",
  "dev-82":   "http://192.168.10.82:8000/api/v1",
  "dev-200":  "http://192.168.200.65:8000/api/v1",
  "home-71":  "http://192.168.2.71:3000/api/v1",
  "dev-109":  "http://192.168.10.109:8000/api/v1",
  "dev-101":  "http://192.168.2.101:8000/api/v1",
  "dev-103":  "http://192.168.0.103:8000/api/v1",
  "magelco":  "http://172.16.11.114:8000/api/v1",
};

// ------------------------------------------------------------------------------
// 【当前选中的环境 Key】修改此处的名称即可直接切换环境（如: "local", "magelco", "prod" 等）
// ------------------------------------------------------------------------------
export const ACTIVE_ENV_KEY = "local";

// 动态计算 API 地址：优先使用显式环境变量；若环境变量为空，在浏览器端自动绑定当前访问 IP/域名 (8008 端口)
const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:8008/api/v1`;
    }
  }
  return SERVER_URLS[ACTIVE_ENV_KEY] || "http://localhost:8008/api/v1";
};

export const API_BASE_URL = getApiBaseUrl();
