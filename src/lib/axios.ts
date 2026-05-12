import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor / 请求拦截器 ---
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('shs_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 开发环境下打印请求日志 / Log request in development
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `%c >> [API Request] ${config.method?.toUpperCase()} ${config.url}`, 
      'color: #0ea5e9; font-weight: bold;', 
      {
        params: config.params,
        data: config.data,
        headers: config.headers
      }
    );
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- Response Interceptor / 响应拦截器 ---
apiClient.interceptors.response.use(
  (response) => {
    // 开发环境下打印成功响应日志 / Log success response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `%c << [API Response] ${response.status} ${response.config.url}`, 
        'color: #10b981; font-weight: bold;', 
        response.data
      );
    }
    return response;
  },
  (error) => {
    // 开发环境下打印错误日志 / Log error response in development
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `%c !! [API Error] ${error.response?.status || 'Network Error'} ${error.config?.url}`, 
        'color: #ef4444; font-weight: bold;', 
        {
          message: error.message,
          detail: error.response?.data?.detail || 'No detail provided',
          serverData: error.response?.data
        }
      );
    }

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('shs_token');
        localStorage.removeItem('shs_role');
        // 只有不在登录页时才跳转，防止死循环
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;