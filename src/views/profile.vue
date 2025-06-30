<template>
  <div class="profile-container">
    <!-- 左侧导航栏 -->
    <div class="sidebar">
      <div class="user-card">
        <div class="avatar-container">
          <img :src="userData.avatar" alt="头像" class="avatar">
        </div>
        <h3 class="username">{{ userName }}</h3>
        <p class="user-bio">{{ userBio || '这个人很懒，什么都没留下~' }}</p>
        <p class="user-skid">SKID: {{ userSkid }}</p>
      </div>

      <nav class="nav-menu">
        <button class="nav-item" :class="{ active: activeTab === 'home' }" @click="activeTab = 'home'">
          <i class="icon">🏠</i> 主页
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
          <i class="icon">👤</i> 个人资料
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'password' }" @click="activeTab = 'password'">
          <i class="icon">🔒</i> 修改密码
        </button>
      </nav>
    </div>

    <!-- 右侧内容区 -->
    <div class="main-content">
      <!-- 主页内容 - 最新博客 -->
      <div v-if="activeTab === 'home'" class="tab-content">
        <h2 class="section-title">最新博客</h2>
        <div v-if="blogs.length > 0" class="blog-list">
          <div v-for="(blog, index) in blogs" :key="index" class="blog-card">
            <h3 class="blog-title">{{ blog.title }}</h3>
            <p class="blog-date">{{ formatDate(blog.created_at) }}</p>
            <p class="blog-excerpt">{{ blog.excerpt }}</p>
            <router-link :to="`/blog/${blog.id}`" class="read-more">阅读更多</router-link>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>暂无博客，快去发布你的第一篇博客吧~</p>
        </div>
      </div>

      <!-- 个人资料 -->
      <div v-if="activeTab === 'profile'" class="tab-content">
        <div class="profile-header">
          <h2 class="section-title">个人资料</h2>
          <button class="edit-btn" @click="toggleEditMode">
            {{ editMode ? '取消' : '编辑' }}
          </button>
        </div>

        <div class="profile-form">
          <div class="form-group">
            <label>用户名</label>
            <input type="text" v-model="userData.username" :disabled="!editMode" :class="{ disabled: !editMode }">
          </div>

          <div class="form-group">
            <label>手机号</label>
            <div class="phone-input-group">
              <select v-model="userData.phone_prefix" :disabled="!editMode" class="phone-prefix">
                <option value="+86">+86</option>
                <option value="+1">+1</option>
                <option value="+852">+852</option>
                <option value="+853">+853</option>
                <option value="+886">+886</option>
              </select>
              <input type="tel" v-model="userData.phone" :disabled="!editMode" class="phone-number">
            </div>
          </div>

          <div class="form-group">
            <label>性别</label>
            <select v-model="userData.sex" :disabled="!editMode" :class="{ disabled: !editMode }">
              <option value="M">男</option>
              <option value="F">女</option>
              <option value="O">其他</option>
            </select>
          </div>

          <div class="form-group">
            <label>年龄</label>
            <input type="number" v-model="userData.age" :disabled="!editMode" :class="{ disabled: !editMode }" min="0"
              max="150">
          </div>

          <div class="form-group">
            <label>生日</label>
            <input type="date" v-model="userData.birthday" :disabled="!editMode" :class="{ disabled: !editMode }">
          </div>

          <div class="form-group">
            <label>MBTI</label>
            <input type="text" v-model="userData.mbti" :disabled="!editMode" :class="{ disabled: !editMode }"
              maxlength="4">
          </div>

          <div class="form-group">
            <label>技能1</label>
            <input type="text" v-model="userData.skill1" :disabled="!editMode" :class="{ disabled: !editMode }"
              maxlength="50">
          </div>

          <div class="form-group">
            <label>技能2</label>
            <input type="text" v-model="userData.skill2" :disabled="!editMode" :class="{ disabled: !editMode }"
              maxlength="50">
          </div>

          <div class="form-group">
            <label>技能3</label>
            <input type="text" v-model="userData.skill3" :disabled="!editMode" :class="{ disabled: !editMode }"
              maxlength="50">
          </div>

          <div class="form-group">
            <label>个性签名</label>
            <textarea v-model="userData.bio" :disabled="!editMode" :class="{ disabled: !editMode }" rows="3"></textarea>
          </div>

          <div v-if="editMode" class="form-actions">
            <button class="cancel-btn" @click="cancelEdit">取消</button>
            <button class="save-btn" @click="saveProfile">保存</button>
          </div>
        </div>
      </div>

      <!-- 修改密码 -->
      <div v-if="activeTab === 'password'" class="tab-content">
        <h2 class="section-title">修改密码</h2>

        <div class="password-form">
          <div class="form-group">
            <label>旧密码</label>
            <input type="password" v-model="passwordData.oldPassword">
          </div>

          <div class="form-group">
            <label>新密码</label>
            <input type="password" v-model="passwordData.newPassword">
          </div>

          <div class="form-group">
            <label>确认新密码</label>
            <input type="password" v-model="passwordData.confirmPassword">
          </div>

          <div class="form-actions">
            <button class="cancel-btn" @click="resetPasswordForm">取消</button>
            <button class="save-btn" @click="changePassword">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { service, tokenManager } from '@/utils/axios';
import { useRouter, useRoute } from 'vue-router';
const route = useRoute()

// 用户数据
const userData = ref({
  username: '',
  phone: '',
  phone_prefix: '+86',
  sex: 'M',
  age: null,
  birthday: '',
  avatar: '',
  mbti: '',
  skill1: '',
  skill2: '',
  skill3: '',
  bio: ''
});

const userName = ref('');
const userBio = ref('');
const userSkid = ref('');
const blogs = ref([]);



// 编辑状态
const editMode = ref(false);
const originalData = ref({});

// 密码修改
const passwordData = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 当前活动标签页
const activeTab = ref('home');

// 初始化加载用户数据
onMounted(async () => {
  await fetchUserData();
  await fetchLatestBlogs();
});

// 获取用户数据
const fetchUserData = async () => {
  try {
    // 这里应该是API调用
    const response = await service.get(`http://127.0.0.1:8000/user/profile/${route.params.sk_id}`);
    if (response.data.status === 'success') {
      console.log('获取个人信息成功')
      console.log('data:', response.data.data)
      const data = response.data.data;
      // 设置用户数据
      userData.value = {
        username: data.user.username,
        phone: data.user.phone || '',
        phone_prefix: data.user.phone_prefix || '+86',
        sex: data.profile.sex || 'M',
        age: data.profile.age || null,
        birthday: data.profile.birthday || '',
        avatar: data.profile.avatar || 'avatars/default.jpg',
        mbti: data.profile.mbti || '',
        sk_id: data.profile.sk_id || '',
        skill1: data.profile.skill1 || '',
        skill2: data.profile.skill2 || '',
        skill3: data.profile.skill3 || '',
        bio: data.profile.bio || ''
      };

      // 设置显示数据
      userName.value = data.user.username;
      userBio.value = data.profile.bio;
      userSkid.value = data.profile.sk_id;

      // 保存原始数据用于取消编辑
      originalData.value = { ...userData.value };
    }
  } catch (error) {
    console.error('获取用户数据失败:', error);
  }
};


// 获取最新博客
const fetchLatestBlogs = async () => {
  try {
    // 这里应该是API调用
    const response = await service.get(`http://127.0.0.1:8000/user/blogs/${route.params.sk_id}`);
    if (response.data.status === 'success') {
      console.log('获取博客成功')
      blogs.value = response.data.data.blog_list;
      console.log('这是blogs的数据', blogs.value)
    }
  } catch (error) {
    console.error('获取博客失败:', error);
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// 切换编辑模式
const toggleEditMode = () => {
  editMode.value = !editMode.value;
  if (!editMode.value) {
    // 取消编辑时恢复原始数据
    userData.value = { ...originalData.value };
  }
};

// 取消编辑
const cancelEdit = () => {
  editMode.value = false;
  userData.value = { ...originalData.value };
};

// 保存个人资料
const saveProfile = async () => {
  try {
    const requestData = {
      user: {
        username: userData.value.username,
        phone: userData.value.phone,
        phone_prefix: userData.value.phone_prefix
      },
      profile: {
        sex: userData.value.sex,
        age: userData.value.age,
        birthday: userData.value.birthday,
        mbti: userData.value.mbti,
        skill1: userData.value.skill1,
        skill2: userData.value.skill2,
        skill3: userData.value.skill3,
        bio: userData.value.bio
      }
    };
    const response = await service.post('http://127.0.0.1:8000/user/change_profile/', requestData)
    if (response.data.status === 'success') {
      // 更新原始数据
      originalData.value = { ...userData.value };

      // 更新显示数据
      userName.value = userData.value.username;
      userBio.value = userData.value.bio;

      // 如果有返回的profile数据，也更新相关字段
      if (response.data.data?.profile) {
        userSkid.value = response.data.data.profile.sk_id || userSkid.value;
      }

      editMode.value = false;
      alert('个人资料更新成功');
    } else {
      alert(response.data.message || '更新失败');
    }
  } catch (error) {
    console.error('更新个人资料失败:', error);
    alert('更新失败，请稍后再试');
  }
};


//修改密码
const changePassword = async () => {
  if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    alert('两次输入的新密码不一致');
    return;
  }

  try {
    // 使用键值对形式组织数据
    const requestData = {
      old_password: passwordData.value.oldPassword,
      new_password: passwordData.value.newPassword
    };

    // 使用统一的service进行API调用
    const response = await service.put('http://127.0.0.1:8000/user/change_password/', requestData);
    if (response.data.status === 'success') {
      alert('密码修改成功');
      resetPasswordForm();
    } else {
      alert(response.data.message || '密码修改失败');
    }
  } catch (error) {
    console.error('修改密码失败:', error);
    alert(`修改密码失败: ${error.response?.data?.message || error.message}`);
  }
};

// 重置密码表单
const resetPasswordForm = () => {
  passwordData.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
};
</script>

<style scoped>
/* 基础样式 */
.profile-container {
  display: flex;
  min-height: 100vh;
  background-color: #f9f9f9;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 左侧导航栏 */
.sidebar {
  width: 280px;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-top: 5%;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.user-card {
  text-align: center;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.avatar-container {
  position: relative;
  margin: 0 auto 15px;
  width: 120px;
  height: 120px;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e0f7e0;
}

.edit-avatar {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-avatar:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.username {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.user-bio {
  margin: 10px 0 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.user-skid {
  margin: 5px 0 0;
  font-size: 12px;
  color: #999;
}

/* 导航菜单 */
.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 15px;
  color: #555;
  border-radius: 6px;
  transition: all 0.3s;
  text-align: left;
}

.nav-item:hover {
  background-color: #f0f7f0;
  color: #4CAF50;
}

.nav-item.active {
  background-color: #e8f5e9;
  color: #2E7D32;
  font-weight: bold;
}

.nav-item .icon {
  margin-right: 10px;
  font-size: 18px;
}

/* 右侧内容区 */
.main-content {
  flex: 1;
  padding: 30px;
  background-color: #8ae7a571;
}

.tab-content {
  background-color: white;
  border-radius: 8px;
  width: 85%;
  margin-top: 5%;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  margin: 0 0 20px;
  font-size: 20px;
  color: #333;
  display: flex;
  align-items: center;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.edit-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.edit-btn:hover {
  background-color: #3d8b40;
}

/* 博客列表 */
.blog-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.blog-card {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.3s;
}

.blog-card:hover {
  border-color: #c8e6c9;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
}

.blog-title {
  margin: 0 0 10px;
  font-size: 18px;
  color: #2E7D32;
}

.blog-date {
  margin: 0 0 10px;
  font-size: 13px;
  color: #999;
}

.blog-excerpt {
  margin: 0 0 10px;
  color: #555;
  line-height: 1.6;
}

.read-more {
  color: #4CAF50;
  text-decoration: none;
  font-size: 14px;
  display: inline-block;
  transition: all 0.3s;
}

.read-more:hover {
  color: #2E7D32;
  text-decoration: underline;
}

/* 表单样式 */
.profile-form {
  width: 100%;
  max-width: 600px;
  /* 限制表单最大宽度 */
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

/* 统一输入框样式 */
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
  /* 确保padding不影响宽度 */
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #81C784;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.form-group input.disabled,
.form-group select.disabled,
.form-group textarea.disabled {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

/* 手机号输入组 */
.phone-input-group {
  display: flex;
  width: 100%;
  gap: 10px;
}

.phone-prefix {
  width: 100px !important;
  /* 固定宽度 */
  min-width: 50px;
  flex-shrink: 0;
  /* 防止被压缩 */
}

.phone-number {
  flex: 1;
  min-width: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.save-btn:hover {
  background-color: #3d8b40;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #eee;
}

/* 头像选择 */
.avatar-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.avatar-option {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.avatar-option:hover {
  transform: scale(1.05);
}

.avatar-option.selected {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
}

.avatar-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    position: static;
    padding: 15px;
  }

  .main-content {
    padding: 20px;
  }

  .avatar-options {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .avatar-options {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-btn,
  .save-btn {
    width: 100%;
  }

  .phone-input-group {
    flex-direction: column;
  }

  .phone-prefix {
    width: 100%;
  }
}
</style>