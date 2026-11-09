// ==============================================================================
// 开发环境 API 地址映射表 / API Server URLs Map
// ==============================================================================
export const SERVER_URLS: Record<string, string> = {
  "local":    "http://127.0.0.1:8000/api/v1",
  "home":     "http://192.168.2.133:8000/api/v1",
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
  "BASELCO":  "http://192.168.100.122:8008/api/v1",
};

// ------------------------------------------------------------------------------
// 【当前选中的环境 Key】修改此处的名称即可直接切换环境（如: "local", "magelco", "prod" 等）
// ------------------------------------------------------------------------------
export const ACTIVE_ENV_KEY = "home";

// 动态计算 API 地址：优先使用环境变量与配置表，确保开发调试时修改配置即刻生效
const getApiBaseUrl = (): string => {
  // 1. 如果有显式构建/打包环境变量，优先使用
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // 2. 本地开发环境 (pnpm dev) 下，直接严格使用 ACTIVE_ENV_KEY 对应地址
  if (process.env.NODE_ENV === 'development') {
    return SERVER_URLS[ACTIVE_ENV_KEY] || "http://127.0.0.1:8000/api/v1";
  }
  // 3. 生产容器无环境变量时（如 build-auto.sh）：浏览器端根据访问 IP 动态自适应 8008 端口
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:8008/api/v1`;
    }
  }
  return SERVER_URLS[ACTIVE_ENV_KEY] || "http://127.0.0.1:8000/api/v1";
};

export const API_BASE_URL = getApiBaseUrl();
