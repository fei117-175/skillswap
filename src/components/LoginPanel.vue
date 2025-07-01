<template>
  <!-- 移动端控制按钮 -->
  <div class="mobile-toggle-btn" v-if="isMobile" @click="toggleMobilePanel">
    {{ isMobilePanelOpen ? '×' : '☰' }}
  </div>

  <!-- 登录容器 -->
  <div class="login-container" 
       :class="{ 
         'collapsed': isCollapsed,
         'mobile-view': isMobile,
         'mobile-open': isMobile && isMobilePanelOpen
       }"
       @mouseenter="!isMobile && expandPanel()"
       @mouseleave="!isMobile && shouldCollapse ? collapsePanel() : null">
    
    <!-- 折叠状态（仅桌面端） -->
    <div class="collapsed-view" v-show="isCollapsed && !isMobile">
      <span v-if="loginStatus === 0">LOGINVIEW</span>
      <div v-else class="vertical-text">SELFMESSAGE</div>
    </div>

    <!-- 展开状态内容 -->
    <div class="login-content" v-show="!isCollapsed || isMobile || token_loginStatus === 0">
      <!-- 登录界面 -->
      <div v-if="loginStatus === 0" class="login-section">
        <div class="imgbox">
          <img src="/skillswapicon.png" alt="SkillSwap Logo">
        </div>
        <div class="login-form">
          <h3>用户登录</h3>
          <form @submit.prevent="handleLogin">
            <input v-model="username" type="text" placeholder="用户名" 
                   @focus="lockPanel" @blur="unlockPanel">
            <input v-model="password" type="password" placeholder="密码" 
                   @focus="lockPanel" @blur="unlockPanel">
            <div class="button-group">
              <button type="submit">登录</button>
              <button type="button" @click="register">注册</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 导航菜单（登录后） -->
      <div v-else class="nav-menu">
        <div class="user-profile">
          <div class="avatar-container" @click="triggerFileInput">
            <img :src="avatarUrl" alt="头像" class="avatar-image">
            <input type="file" ref="fileInput" style="display: none" 
                   accept="image/jpeg,image/png,image/gif" @change="handleAvatarChange">
            <div class="avatar-upload-hint">点击更换头像</div>
            <div v-if="isUploading" class="avatar-loading">上传中...</div>
          </div>
          <h3>{{ userData.username }}</h3>
        </div>

        <nav>
          <ul>
            <li v-for="item in navItems" :key="item.id" 
                :class="{ active: activeNav === item.id }"
                @click="navigateTo(item.id)">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text">{{ item.text }}</span>
            </li>
          </ul>
        </nav>

        <button class="logout-btn" @click="handleLogout">
          <span class="nav-text">退出登录</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { service, tokenManager } from '@/utils/axios';
import { useRouter, useRoute } from 'vue-router';
import { useCounterStore } from "@/stores/counter";

export default {
  name: 'LoginBox',
  setup() {
    const user = useCounterStore();
    const router = useRouter()
    const route = useRoute();
    const isCollapsed = ref(true)
    const shouldCollapse = ref(true)
    const username = ref('')
    const password = ref('')
    const loginStatus = ref(0)
    const activeNav = ref('profile')
    const fileInput = ref(null)
    const isUploading = ref(false)
    const token_loginStatus = ref(route.state?.token_loginStatus || 0);
    const userData = ref(null)
    const isMobile = ref(false)
    const isMobilePanelOpen = ref(false)

    const navItems = ref([
      { id: 'profile', text: '个人资料', icon: '👤' },
      { id: 'notes', text: '我的博客', icon: '📝' },
      { id: 'collection', text: '我的收藏', icon: '🧾' }
    ])

    const avatarUrl = computed(() => {
      return userData.value?.avatar || '/default-avatar.jpg';
    });

    // 检测移动端
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
    }

    // 切换移动端面板
    const toggleMobilePanel = () => {
      isMobilePanelOpen.value = !isMobilePanelOpen.value
    }

    onMounted(async () => {
      checkMobile()
      window.addEventListener('resize', checkMobile)

      if (localStorage.getItem('access_token')) {
        try {
          await service.get('/api/verify/')
          loginStatus.value = 1
          const response = await service.get('/api/user/')
          userData.value = response.data
        } catch (error) {
          tokenManager.clearTokens()
        }
      }
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile)
    })

    const triggerFileInput = () => {
      fileInput.value.click()
    }

    const handleAvatarChange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('只支持JPG, JPEG、PNG 或 GIF 格式的图片');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过 2MB');
        return;
      }

      isUploading.value = true;

      try {
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('username', userData.value.username);

        const response = await service.post(
          '/avatar/',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          }
        );

        userData.value.avatar = response.data.avatar_path;
      } catch (error) {
        alert(`头像更新失败: ${error.message}`);
      } finally {
        isUploading.value = false;
        event.target.value = '';
      }
    }

    const handleLogin = async () => {
      try {
        const response = await service.post('/login/', {
          username: username.value,
          password: password.value
        })
        alert('登录成功')
        user.loginUser = true
        localStorage.setItem('username', response.data.username)
        tokenManager.setTokens(
          response.data.tokens.access,
          response.data.tokens.refresh
        );

        userData.value = {
          username: response.data.username,
          avatar: response.data.avatar,
          sk_id: response.data.sk_id
        }

        loginStatus.value = 1
        if (isMobile.value) {
          isMobilePanelOpen.value = false // 移动端登录后自动收起
        }
      } catch (error) {
        alert(error.response?.data?.detail || '登录失败')
        router.push('/index')
      }
    }

    const handleLogout = async () => {
      try {
        await service.post('/logout/')
      } finally {
        tokenManager.clearTokens()
        user.loginUser = false
        window.location.reload()
        localStorage.removeItem('username')
        loginStatus.value = 0
        userData.value = null
      }
    }

    const expandPanel = () => { 
      if (!isMobile.value) {
        isCollapsed.value = false 
      }
    }
    
    const collapsePanel = () => { 
      if (!isMobile.value) {
        isCollapsed.value = true 
      }
    }
    
    const lockPanel = () => { shouldCollapse.value = false }
    const unlockPanel = () => { shouldCollapse.value = true }
    
    const navigateTo = (id) => {
      activeNav.value = id
      if(id === 'profile'){
        router.push({name:'profile', params:{sk_id: userData.value.sk_id}})
      } else {
        router.push({name: id})
      }
      if (isMobile.value) {
        isMobilePanelOpen.value = false // 移动端导航后自动收起
      }
    }
    
    const register = () => { 
      router.push('/register') 
      if (isMobile.value) {
        isMobilePanelOpen.value = false // 移动端注册后自动收起
      }
    } 

    return {
      isCollapsed,
      shouldCollapse,
      username,
      password,
      loginStatus,
      userData,
      navItems,
      activeNav,
      fileInput,
      isUploading,
      avatarUrl,
      isMobile,
      isMobilePanelOpen,
      expandPanel,
      collapsePanel,
      lockPanel,
      unlockPanel,
      toggleMobilePanel,
      triggerFileInput,
      handleAvatarChange,
      handleLogin,
      handleLogout,
      navigateTo,
      register
    }
  }
}
</script>

<style scoped>
/* 基础样式 - 保持原有桌面端样式不变 */
.login-container {
  position: fixed;
  top: 0;
  right: 0;
  width: 20vw;
  height: 100vh;
  background-color: white;
  transition: all 0.5s cubic-bezier(0.65, 0, 0.35, 1);
  z-index: 999;
  box-shadow: -5px 0 15px rgba(32, 211, 62, 0.2);
  overflow: hidden;
}

.login-container.collapsed {
  width: 8vw;
}

.collapsed-view {
  width: 8vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 0.5rem;
  color: #20d33e;
  font-weight: bold;
  font-size: 1.2rem;
  background-color: white;
}

.vertical-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  letter-spacing: 0.5rem;
  color: #20d33e;
  font-weight: bold;
  font-size: 1.2rem;
}

.login-content {
  width: 20vw;
  height: 100%;
  padding: 2rem;
  box-sizing: border-box;
  overflow-y: auto;
}

.imgbox {
  width: 90%;
  height: 20%;
  margin-left: 5%;
  margin-top: 2%;
}

.imgbox>img {
  max-width: 100%;
  height: auto;
}

.login-form {
  display: flex;
  margin-top: 5%;
  flex-direction: column;
  gap: 1.5rem;
}

.login-form h3 {
  color: #333;
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 2rem;
}

.login-form input {
  margin-top: 6%;
  width: 90%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.login-form button {
  width: 60%;
  margin-top: 6%;
  margin-left: 18%;
  padding: 0.8rem;
  background-color: #20d33e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.login-form button:hover {
  background-color: #1aad32;
}

/* 导航菜单样式 */
.nav-menu {
  display: flex;
  flex-direction: column;
  height: 90%;
  margin-top: 20%;
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.avatar-container {
  position: relative;
  cursor: pointer;
  margin-bottom: 10px;
  width: 120px;
  height: 120px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eee;
  transition: opacity 0.3s;
}

.avatar-container:hover .avatar-image {
  opacity: 0.8;
}

.avatar-upload-hint {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  text-align: center;
  padding: 5px;
  border-bottom-left-radius: 60px;
  border-bottom-right-radius: 60px;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-container:hover .avatar-upload-hint {
  opacity: 1;
}

.avatar-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
}

.user-profile h3 {
  color: #333;
  margin: 0;
  font-size: 1.2rem;
}

nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

nav li {
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

nav li:hover {
  background-color: rgba(32, 211, 62, 0.1);
}

nav li.active {
  background-color: rgba(32, 211, 62, 0.2);
}

nav li.active .nav-text {
  font-weight: bold;
  color: #20d33e;
}

.nav-icon {
  margin-right: 1rem;
  font-size: 1.2rem;
}

.nav-text {
  font-size: 0.9rem;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.8rem;
  margin-top: 40%;
  background-color: transparent;
  border: 1px solid #ff6b6b;
  color: #ff6b6b;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:hover {
  background-color: #ff6b6b;
  color: white;
}

/* 移动端特有样式 */
.mobile-toggle-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  background-color: #20d33e;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  cursor: pointer;
}

.login-container.mobile-view {
  width: 0;
  transform: translateX(100%);
  transition: all 0.3s ease;
  box-shadow: none;
}

.login-container.mobile-view.mobile-open {
  width: 80vw;
  transform: translateX(0);
  box-shadow: -5px 0 15px rgba(32, 211, 62, 0.2);
}

.login-container.mobile-view .login-content {
  width: 70vw;
  padding: 1.5rem;
}

/* 移动端内容适配 */
@media (max-width: 768px) {
  .login-container.mobile-view.mobile-open .login-content {
    width: 90%;
  }
  
  .login-container.mobile-view .login-form input,
  .login-container.mobile-view .login-form button {
    width: 90%;
    margin-left: 8%;
  }
  
  .login-container.mobile-view .button-group {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  
  .login-container.mobile-view .avatar-container {
    width: 100px;
    height: 100px;
  }
  
  .login-container.mobile-view .nav-icon {
    font-size: 1rem;
    margin-right: 0.8rem;
  }
  
  .login-container.mobile-view .nav-text {
    font-size: 0.9rem;
  }
  
  .login-container.mobile-view .logout-btn {
    margin-top: 2rem;
    padding: 0.8rem;
  }
  
  .login-container.mobile-view .login-form h3 {
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
  }
  
  .login-container.mobile-view .user-profile h3 {
    font-size: 1.1rem;
  }
}

/* 小屏幕优化 */
@media (max-width: 480px) {
  .login-container.mobile-view.mobile-open {
    width: 90vw;
  }
  
  .login-container.mobile-view .login-content {
    padding: 1rem;
  }
  
  .login-container.mobile-view .avatar-container {
    width: 80px;
    height: 80px;
  }
  
  .login-container.mobile-view .login-form input {
    padding: 0.7rem;
  }
  
  .login-container.mobile-view .login-form button {
    padding: 0.7rem;
    font-size: 0.9rem;
  }
  
  .login-container.mobile-view .nav-text {
    font-size: 0.85rem;
  }
}
</style>