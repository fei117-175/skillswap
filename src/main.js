
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

import { tokenManager } from '@/utils/axios';

// 启动时检查token状态
if (tokenManager.getAccessToken()) {
  if (tokenManager.shouldRefreshToken(tokenManager.getAccessToken())) {
    // 预刷新token
    tokenManager.refreshToken().catch(() => {
      tokenManager.clearTokens();
    });
  }
} 
const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(createPinia())
app.use(router)
app.use(pinia)
app.mount('#app')
