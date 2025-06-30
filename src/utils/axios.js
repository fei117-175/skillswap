import axios from 'axios';
import router from '@/router';

// 创建axios实例
const service = axios.create({
    baseURL: 'http://127.0.0.1:8000', // 使用 Vite 的环境变量
    timeout: 10000
});

// Token管理工具
const tokenManager = {
    getAccessToken: () => localStorage.getItem('access_token'),
    getRefreshToken: () => localStorage.getItem('refresh_token'),

    setTokens: (access, refresh) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        service.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    },

    clearTokens: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        delete service.defaults.headers.common['Authorization'];
    },

    isTokenExpired: (token) => {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    },

    shouldRefreshToken: (token) => {
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // 在token过期前5分钟开始刷新
            return (payload.exp * 1000) - (5 * 60 * 1000) < Date.now();
        } catch {
            return false;
        }
    },
    refreshToken: async function () {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken || this.isTokenExpired(refreshToken)) {
            throw new Error('Invalid or expired refresh token');
        }

        try {
            const response = await service.post('/api/token/refresh/', {
                refresh: refreshToken
            }, {
                _skipAuth: true  // 添加这个标记避免无限循环
            });

            tokenManager.setTokens(response.data.access, response.data.refresh || refreshToken);
            return response.data.access;
        } catch (error) {
            tokenManager.clearTokens();
            throw error;
        }
    }
};
// 请求拦截器
service.interceptors.request.use(
    config => {
        console.log('请求拦截器 - 添加Token:', tokenManager.getAccessToken());
        const token = tokenManager.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// 响应拦截器
service.interceptors.response.use(
    response => {
        console.log('[响应拦截器] 请求成功')
        return response
    },
    async error => {
        console.log('[响应拦截器] 请求错误:', error.response?.status)
        const originalRequest = error.config;

        // 跳过refresh请求本身和标记的请求
        if (originalRequest._skipAuth ||
            error.response?.status !== 401 ||
            originalRequest._retry ||
            originalRequest.url.includes('/token/')) {
            // 添加Token过期跳转逻辑
            if (error.response?.status === 401) {
                tokenManager.clearTokens();
                router.push('/index');
                window.location.reload()
            }
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        try {
            const newToken = await tokenManager.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return service(originalRequest);
        } catch (refreshError) {
            tokenManager.clearTokens();
            router.push('/index');
            return Promise.reject(refreshError);
        }
    }
);

export { service, tokenManager };