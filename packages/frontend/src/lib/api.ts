import axios, { AxiosError } from 'axios';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL environment variable is required');
}

console.log('📡 API URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor - log requests
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
    config.withCredentials = true;
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (res) => {
    console.log(`✅ ${res.config.method?.toUpperCase()} ${res.config.url} - ${res.status}`);
    return res;
  },
  (error: AxiosError) => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    const isLoginPage = window.location.pathname === '/login';
    const isRegisterPage = window.location.pathname === '/register';
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !isAuthEndpoint && !isLoginPage && !isRegisterPage) {
      console.warn('🔑 401 Unauthorized - Logging out...');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    
    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      console.warn('⏳ Rate limit exceeded');
      window.dispatchEvent(new CustomEvent('auth:rate_limited'));
    }
    
    return Promise.reject(error);
  }
);

export default api;