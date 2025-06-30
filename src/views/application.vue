<template>
  <div class="bigbox">
    <!-- 左侧日历区域 -->
    <div class="leftbox">
      <div class="left-top">
        <div class="calendar-header">
          <h3>学习日历</h3>
          <div class="month-selector">
            <button class="nav-btn" @click="prevMonth">←</button>
            <span>{{ currentYear }}年{{ currentMonth + 1 }}月</span>
            <button class="nav-btn" @click="nextMonth">→</button>
          </div>
        </div>
        <div class="calendar-grid">
          <div class="day-header" v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day">{{ day }}</div>
          <div v-for="n in startDay" :key="'empty-' + n" class="day-cell empty"></div>
          <div v-for="day in daysInMonth" :key="day" class="day-cell" :class="{
            'study-day': isStudyDay(day),
            'teach-day': isTeachDay(day),
            'completed-day': isCompletedDay(day),
            'today': isToday(day)
          }" @click="selectDate(day)">
            {{ day }}
            <div class="day-events" v-if="hasEvents(day)">
              <div class="event-dot" v-for="(event, index) in getDayEvents(day)" :key="index"
                :style="{ backgroundColor: eventColors[event.type] }"></div>
            </div>
          </div>
        </div>
        <div class="calendar-legend">
          <div><span class="legend today"></span>今天</div>
          <div><span class="legend study"></span>学习日</div>
          <div><span class="legend teach"></span>教学日</div>
          <div><span class="legend completed"></span>已完成</div>
        </div>
      </div>
      <!-- 交换安排 left-bottom 部分 -->
      <div class="left-bottom">
        <h3>近期交换计划</h3>
        <div class="exchange-plan-list">
          <div class="exchange-plan-item" v-for="plan in filteredPlans" :key="plan.id"
            :class="{ 'completed': plan.apl_status === 'completed' }">
            <!-- 用户头像区域 -->
            <div class="user-avatars">
              <div class="user-avatar">
                <img :src="plan.applicant_avatar" :alt="plan.applicant_username">
                <span class="username">{{ plan.applicant_username }}</span>
              </div>
              <div class="exchange-icon">
                <i class="fas fa-exchange-alt"></i>
              </div>
              <div class="user-avatar">
                <img :src="plan.accepted_by_avatar" :alt="plan.accepted_by_username">
                <span class="username">{{ plan.accepted_by_username }}</span>
              </div>
            </div>

            <!-- 交换详情 -->
            <div class="exchange-info">
              <div class="exchange-row">
                <span class="label">课程:</span>
                <span class="value">{{ plan.course }}</span>
                <span class="category">{{ plan.course_category }} · {{ plan.course_subcategory }}</span>
              </div>
              <div class="exchange-row">
                <span class="label">技能:</span>
                <span class="value">{{ plan.skill }}</span>
                <span class="category">{{ plan.skill_category }} · {{ plan.skill_subcategory }}</span>
              </div>
              <div class="exchange-time">
                <i class="fas fa-clock"></i>
                <span>{{ formatDateTime(plan.start_time) }} - {{ formatDateTime(plan.end_time) }}</span>
                <span class="duration">{{ plan.day_counts }}天</span>
              </div>
            </div>

            <!-- 状态标识 -->
            <div class="status-badge">
              {{ plan.apl_status === 'matched' ? '已匹配' : '已完成' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧区域 -->
    <div class="rightbox">
      <div class="right-top" v-if="user.loginUser">
        <button class="tab-btn" :class="{ 'active': activeTab === 'exchange' }" @click="changeTab('exchange')">
          交换请求
        </button>
        <button class="tab-btn" :class="{ 'active': activeTab === 'create' }" @click="changeTab('create')">
          发起请求
        </button>
        <button class="tab-btn" :class="{ 'active': activeTab === 'history' }" @click="changeTab('history')">
          历史请求
        </button>
      </div>
      <div class="right-bottom">
        <!-- 未登录状态显示 -->
        <div class="login-prompt" v-if="!user.loginUser">
          <div class="prompt-content">
            <h3>您还未登录</h3>
            <p>请先登录再查看交换请求</p>
            <button class="login-btn" @click="redirectToLogin">鼠标移至右侧</button>
          </div>
        </div>
        <div v-else>
          <!-- 交换请求内容 -->
          <div v-if="activeTab === 'exchange' && user.loginUser" class="tab-content">
            <!-- 无请求时的提示 -->
            <div v-if="successfulExchanges.length === 0" class="empty-requests">
              <div class="empty-icon">
                <i class="fas fa-exchange-alt"></i>
              </div>
              <h4>还没有交换请求哦</h4>
              <p>快去广场看看，寻找合适的交换伙伴吧！</p>
              <button class="browse-btn" @click="goToSquare">前往广场</button>
            </div>

            <!-- 请求列表 -->
            <div v-else class="request-list">
              <div class="request-item" v-for="request in filteredRequests" :key="request.id">
                <!-- 状态标签 -->
                <div class="status-tag" :class="request.apl_status">
                  {{ getStatusText(request) }}
                </div>

                <!-- 用户信息展示 -->
                <div class="user-profiles">
                  <!-- 申请人信息 -->
                  <div class="user-profile" :class="{ 'current-user': request.applicant_username === username }">
                    <div class="avatar-wrapper">
                      <img v-if="request.applicant_avatar" :src="request.applicant_avatar" class="avatar" alt="申请人头像">
                      <div v-else class="default-avatar">
                        <i class="fas fa-user"></i>
                      </div>
                    </div>
                    <div class="user-info">
                      <div class="username">{{ request.applicant_username || '未知用户' }}</div>
                      <div class="user-role">发起方</div>
                    </div>
                  </div>

                  <!-- 交换箭头 -->
                  <div class="exchange-arrow">
                    <i class="fas fa-exchange-alt"></i>
                  </div>

                  <!-- 接受方信息 -->
                  <div class="user-profile" :class="{ 'current-user': request.accepted_by_username === username }">
                    <div class="avatar-wrapper">
                      <img v-if="request.accepted_by_avatar" :src="request.accepted_by_avatar" class="avatar"
                        alt="接受方头像">
                      <div v-else class="default-avatar unmatched">
                        <i class="fas fa-question"></i>
                        <div class="unmatched-text">待匹配</div>
                      </div>
                    </div>
                    <div class="user-info">
                      <div class="username">{{ request.accepted_by_username || '等待匹配' }}</div>
                      <div class="user-role">接受方</div>
                    </div>
                  </div>
                </div>

                <!-- 交换详情 -->
                <div class="exchange-details">
                  <div class="detail-row">
                    <span class="detail-label">课程:</span>
                    <span class="detail-value">{{ request.course }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">技能:</span>
                    <span class="detail-value">{{ request.skill }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">时间:</span>
                    <span class="detail-value">{{ formatDateTime(request.start_time) }} - {{
                      formatDateTime(request.end_time) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">描述:</span>
                    <span class="detail-value">{{ request.description || '暂无描述' }}</span>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="action-buttons" v-if="shouldShowActions(request)">
                  <template v-if="request.apl_status === 'waiting' && request.applicant_username === username">
                    <button class="action-btn accept" @click="handleRequest(request.id, 'accept')"
                      v-if="request.apl_status === 'waiting'">
                      <i class="fas fa-check"></i> 接受
                    </button>
                    <button class="action-btn reject" @click="handleRequest(request.id, 'reject')"
                      v-if="request.apl_status === 'waiting'">
                      <i class="fas fa-times"></i> 拒绝
                    </button>
                  </template>
                  <button class="action-btn cancel" @click="handleRequest(request.id, 'cancel')"
                    v-if="request.apl_status === 'pending' && request.applicant_username === username">
                    <i class="fas fa-ban"></i> 取消
                  </button>
                  <template v-if="request.apl_status === 'waiting' && request.accepted_by_username === username">
                    <button class="action-btn cancel" @click="handleRequest(request.id, 'cancel')">
                      <i class="fas fa-ban"></i> 取消
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- 发起请求内容 -->
          <div v-if="activeTab === 'create' && user.loginUser" class="tab-content">
            <div class="create-form">
              <div class="form-group">
                <label>课程名称</label>
                <input type="text" v-model="newRequest.course" placeholder="请输入你想交换的课程">
                <div class="category-selector">
                  <div class="category-dropdown">
                    <button class="dropdown-toggle" @click="toggleDropdown('course')">
                      选择课程类别
                      <span class="arrow">{{ dropdowns.course ? '▲' : '▼' }}</span>
                    </button>
                    <div v-show="dropdowns.course" class="dropdown-menu">
                      <div v-for="(subcategories, category) in categories" :key="category" class="category-item">
                        <div class="category-header" @click="toggleSubcategory('course', category)">
                          {{ category }}
                          <span class="arrow">{{ expanded.course.includes(category) ? '▲' : '▼' }}</span>
                        </div>
                        <div v-show="expanded.course.includes(category)" class="subcategory-list">
                          <div v-for="subcategory in subcategories" :key="subcategory" class="subcategory-item"
                            @click="selectCategory('course', category, subcategory)">
                            {{ subcategory }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="newRequest.courseCategory" class="selected-category">
                    已选: {{ newRequest.courseCategory }} - {{ newRequest.courseSubcategory }}
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>你的技能</label>
                <input type="text" v-model="newRequest.skill" placeholder="请输入你能提供的技能">
                <div class="category-selector">
                  <div class="category-dropdown">
                    <button class="dropdown-toggle" @click="toggleDropdown('skill')">
                      选择技能类别
                      <span class="arrow">{{ dropdowns.skill ? '▲' : '▼' }}</span>
                    </button>
                    <div v-show="dropdowns.skill" class="dropdown-menu">
                      <div v-for="(subcategories, category) in skillCategories" :key="category" class="category-item">
                        <div class="category-header" @click="toggleSubcategory('skill', category)">
                          {{ category }}
                          <span class="arrow">{{ expanded.skill.includes(category) ? '▲' : '▼' }}</span>
                        </div>
                        <div v-show="expanded.skill.includes(category)" class="subcategory-list">
                          <div v-for="subcategory in subcategories" :key="subcategory" class="subcategory-item"
                            @click="selectCategory('skill', category, subcategory)">
                            {{ subcategory }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="newRequest.skillCategory" class="selected-category">
                    已选: {{ newRequest.skillCategory }} - {{ newRequest.skillSubcategory }}
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>开始时间</label>
                <input type="datetime-local" v-model="newRequest.startTime" :min="minDateTime" @change="validateTimes">
              </div>
              <div class="form-group">
                <label>结束时间</label>
                <input type="datetime-local" v-model="newRequest.endTime" :min="newRequest.startTime || minDateTime"
                  @change="validateTimes">
              </div>
              <div class="form-group">
                <label>附加说明</label>
                <textarea v-model="newRequest.description" placeholder="请描述你的交换需求..."></textarea>
              </div>
              <div v-if="timeError" class="error-message">{{ timeError }}</div>
              <button class="submit-btn" @click="submitRequest" :disabled="loading">
                {{ loading ? '提交中...' : '发布请求' }}
              </button>
              <div v-if="submitError" class="error-message">{{ submitError }}</div>
            </div>
          </div>

          <!-- 历史请求内容 -->
          <div v-if="activeTab === 'history' && user.loginUser" class="tab-content">
            <div class="history-list">
              <div class="history-item" v-for="item in historyRequests" :key="item.id" :class="item.apl_status">
                <!-- 使用 apl_status 作为 class -->
                <div class="history-info">
                  <div class="history-title">
                    <span class="status-badge">
                      {{ getStatusText(item) }} <!-- 显示状态文本 -->
                    </span>
                    与 {{ item.accepted_by_username || '未知用户' }} 交换 {{ item.course }} 课程
                  </div>
                  <div class="history-time">
                    {{ formatDateTime(item.start_time) }} - {{ formatDateTime(item.end_time) }}
                  </div>
                  <div class="history-desc">{{ item.description || '暂无描述' }}</div>
                </div>
                <div class="history-actions">
                  <button class="action-btn" @click="deleteRequest(item.id)">
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { watch } from 'vue'
import { service } from '@/utils/axios';
import { useCounterStore } from "@/stores/counter"; //pinia库
const user = useCounterStore();
const router = useRouter()
const username = localStorage.getItem('username')



console.log('申请页面的username是', username)
// 创建响应式的token状态
const accessToken = ref(localStorage.getItem('access_token'))
// 跳转到首页 
const redirectToLogin = () => {
  // 只有用户点击了登录按钮才跳转
  router.push('/index');
}

// 日历相关数据
const currentDate = ref(new Date())
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())
const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate())
const startDay = computed(() => new Date(currentYear.value, currentMonth.value, 1).getDay())
const loading = ref(false)
const submitError = ref(null)

// 事件和计划数据 - 初始为空
const eventColors = {
  study: '#ffcdd2',
  teach: '#bbdefb',
  completed: '#c8e6c9'
}

watch(() => user.loginUser, (newVal) => {
  if (newVal) {
    fetchAllPlans();
    fetchSuccessfulExchanges();
    fetchHistoryRequests();
  }
});



// 日历功能方法
const allPlans = ref([]);
// 在所有日期比较前，先去除时间部分
const normalizeDate = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};
// 获取所有相关申请
const fetchAllPlans = async () => {
  try {
    const response = await service.get('/application/getuserplans/');
    console.log(response.data.data)
    if (response.data.message === 'success') {
      allPlans.value = response.data.data.filter(allplan =>
        allplan.apl_status === 'matched' ||
        allplan.apl_status === 'completed'
      );
      console.log('获取到的所有计划:', allPlans.value);
    }
  } catch (error) {
    console.error('获取计划失败:', error);
  }
};
const prevMonth = () => {
  
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const nextMonth = () => {
  
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const isStudyDay = (day) => {
  const currentUser = localStorage.getItem('username');
  const selectedDate = new Date(currentYear.value, currentMonth.value, day);

  return allPlans.value.some(allplan => {
    const startDate = new Date(allplan.start_time);
    const endDate = new Date(allplan.end_time);
    return allplan.applicant_username === currentUser &&
      selectedDate >= startDate &&
      selectedDate <= endDate;
  });
};

const isTeachDay = (day) => {
  const currentUser = localStorage.getItem('username');
  if (!currentUser) return false;

  const selectedDate = new Date(currentYear.value, currentMonth.value, day);

  return allPlans.value.some(allplan => {
    const startDate = new Date(allplan.start_time);
    const endDate = new Date(allplan.end_time);

    return allplan.accepted_by_username === currentUser &&
      selectedDate >= startDate &&
      selectedDate <= endDate;
  });
};

const isCompletedDay = (day) => {
  const currentUser = localStorage.getItem('username');
  if (!currentUser) return false;

  const selectedDate = new Date(currentYear.value, currentMonth.value, day);

  return allPlans.value.some(allplan => {
    const endDate = new Date(allplan.end_time);

    return (allplan.applicant_username === currentUser ||
      allplan.accepted_by_username === currentUser) &&
      allplan.apl_status === 'completed' &&
      selectedDate > endDate;
  });
};

const isToday = (day) => {
  const today = new Date()
  return (
    day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  )
}

const hasEvents = (day) => {
  return isStudyDay(day) || isTeachDay(day) || isCompletedDay(day)
}


//申请中的时间转换方法
const formatDateTime = (dateTimeStr) => {
  const date = new Date(dateTimeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}


//点击日历，获取日历时间转换方法  

const getDayEvents = (day) => {
  const events = []
  if (isStudyDay(day)) events.push({ type: 'study' })
  if (isTeachDay(day)) events.push({ type: 'teach' })
  if (isCompletedDay(day)) events.push({ type: 'completed' })
  return events
}

const FormatDate = (date) => {
  const padZero = num => num.toString().padStart(2, '0');

  return [
    date.getFullYear(),
    padZero(date.getMonth() + 1), // 月份从0开始
    padZero(date.getDate())
  ].join('-')
}

const plans = ref([])

const filteredPlans = computed(() => {
  return [...plans.value].sort((a, b) => a.date - b.date).slice(0, 5)
})

const selectDate = async (day) => {
  

  const selectedDate = new Date(currentYear.value, currentMonth.value, day);

  // 转换为 YYYY-MM-DD HH:mm 格式
  const formattedDate = FormatDate(selectedDate);

  console.log('点击的日期是:', formattedDate);
  const response = await service.get('/application/getmatched/', {
    params: {
      date: formattedDate
    }
  })   //点击日期获取当天有关的匹配事务
  console.log(response.data)

  if (response.data.message === 'success') {
    console.log('匹配到的事物', response.data.data)
    plans.value = response.data.data
  }
}

const selectPlan = (plan) => {
 
  console.log('Selected plan:', plan)
}

const formatDate = (date) => {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 请求相关数据和方法
const activeTab = ref('exchange')

// 分类数据
const categories = {
  '编程开发': ['前端开发', '后端开发', '移动开发', '数据分析'],
  '设计创作': ['UI/UX设计', '平面设计', '视频剪辑', '3D建模'],
  '语言学习': ['英语', '日语', '韩语', '法语'],
  '生活技能': ['烹饪', '摄影', '健身', '手工'],
  '学术教育': ['数学', '物理', '化学', '历史']
}

const skillCategories = {
  '编程开发': ['前端开发', '后端开发', '移动开发', '数据分析'],
  '设计创作': ['UI/UX设计', '平面设计', '视频剪辑', '3D建模'],
  '语言学习': ['英语', '日语', '韩语', '法语'],
  '生活技能': ['烹饪', '摄影', '健身', '手工'],
  '学术教育': ['数学', '物理', '化学', '历史']
}

// 分类选择状态管理
const dropdowns = ref({
  course: false,
  skill: false
})

const expanded = ref({
  course: [],
  skill: []
})

// 分类选择方法
const toggleDropdown = (type) => {
  
  if (type === 'course') {
    dropdowns.value.skill = false
  } else {
    dropdowns.value.course = false
  }
  dropdowns.value[type] = !dropdowns.value[type]
}

const toggleSubcategory = (type, category) => {
  
  const index = expanded.value[type].indexOf(category)
  if (index > -1) {
    expanded.value[type].splice(index, 1)
  } else {
    expanded.value[type].push(category)
  }
}

const selectCategory = (type, category, subcategory) => {
  
  if (type === 'course') {
    newRequest.value.courseCategory = category
    newRequest.value.courseSubcategory = subcategory
  } else {
    newRequest.value.skillCategory = category
    newRequest.value.skillSubcategory = subcategory
  }
  dropdowns.value[type] = false
}

// 请求数据 - 初始为空
const currentRequests = ref([])
const historyRequests = ref([])

const minDateTime = computed(() => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
})

const timeError = ref('')

const newRequest = ref({
  course: '',
  courseCategory: '',
  courseSubcategory: '',
  skill: '',
  skillCategory: '',
  skillSubcategory: '',
  startTime: '',
  endTime: '',
  description: ''
})



// 验证时间有效性
const validateTimes = () => {
  if (newRequest.value.startTime && newRequest.value.endTime) {
    const start = new Date(newRequest.value.startTime)
    const end = new Date(newRequest.value.endTime)

    if (start >= end) {
      timeError.value = '结束时间必须晚于开始时间'
    } else {
      timeError.value = ''
    }
  } else {
    timeError.value = ''
  }
}

// 切换标签页
const changeTab = (tab) => {
  
  activeTab.value = tab
  if (tab === 'exchange') {
    fetchSuccessfulExchanges()
  }
  if (tab === 'history') {
    fetchHistoryRequests()
  }

}

// 处理请求
const handleRequest = async (requestId, action) => {
  try {
    loading.value = true;

    // 操作类型映射为状态码
    const actionCodes = {
      'accept': 1,  // 假设1表示接受
      'reject': 2,  // 假设2表示拒绝
      'cancel': 3   // 假设3表示取消
    };

    // 统一请求参数
    const payload = {
      application_id: requestId,
      action: actionCodes[action]
    };
    console.log('请求参数:', payload);

    // 调用统一接口
    const response = await service.post('/application/handle/', payload);

    if (response.status !== 200) {
      throw new Error(response.data.message || '操作失败');
    }

    // 操作成功后重新加载数据
    await fetchSuccessfulExchanges();

    // 显示成功提示
    const actionNames = {
      'accept': '接受',
      'reject': '拒绝',
      'cancel': '取消'
    };
    alert(`${actionNames[action]}请求成功！`);

  } catch (error) {
    console.error('处理请求失败:', error);
    alert(`操作失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// 提交新请求
const submitRequest = async () => {
  

  // 验证必填字段
  if (!newRequest.value.course || !newRequest.value.skill) {
    submitError.value = '请填写课程名称和你的技能'
    return
  }

  if (!newRequest.value.startTime || !newRequest.value.endTime) {
    submitError.value = '请选择开始时间和结束时间'
    return
  }

  if (timeError.value) {
    submitError.value = '请修正时间选择错误'
    return
  }

  loading.value = true
  submitError.value = null

  const formData = new FormData();
  formData.append('course', newRequest.value.course);
  formData.append('course_category', newRequest.value.courseCategory);
  formData.append('course_subcategory', newRequest.value.courseSubcategory);
  formData.append('skill', newRequest.value.skill);
  formData.append('skill_category', newRequest.value.skillCategory);
  formData.append('skill_subcategory', newRequest.value.skillSubcategory);
  formData.append('start_time', newRequest.value.startTime);
  formData.append('end_time', newRequest.value.endTime);
  formData.append('description', newRequest.value.description);
  console.log('表单数据:', formData);
  try {
    const response = await service.post('/application/request/', formData);
    if (response.status === 201) {
      if (response.data.message === 'success') {
        console.log(response.data.applicant)
        alert('请求已成功提交!');

        // // 添加到历史请求列表
        // historyRequests.value.unshift({
        //   id: Date.now(), // 临时 ID
        //   ...newReq,
        //   status: 'pending',
        //   name: '我',
        //   date: newReq.start_time.split(' ')[0],
        //   time: `${newReq.start_time.split(' ')[1]}-${newReq.end_time.split(' ')[1]}`
        // });

        // 重置表单
        newRequest.value = {
          course: '',
          courseCategory: '',
          courseSubcategory: '',
          skill: '',
          skillCategory: '',
          skillSubcategory: '',
          startTime: '',
          endTime: '',
          description: ''
        };
      }
    } else {
      throw new Error(`请求失败，状态码: ${response.status}`);
    }
  } catch (error) {
    console.error('提交请求失败:', error);
    submitError.value = `提交失败: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

// 返回与用户有关的请求列表只有pending和waiting的请求
const filteredRequests = computed(() => {
  return successfulExchanges.value.filter(request =>
    request.apl_status === 'pending' ||
    request.apl_status === 'waiting' ||
    request.apl_status === 'matched'
  );
});

// 返回与用户有关的所有请求
const successfulExchanges = ref([])
const fetchSuccessfulExchanges = async () => {
  try {
    const response = await service.get('/application/checkselfapl/')
    if (response.status === 200) {
      successfulExchanges.value = response.data.data
      console.log(response.data)
    }
  } catch (error) {
    console.error('获取交换信息失败:', error)
  }
}


// 修改后的历史请求获取方法
const fetchHistoryRequests = async () => {
  try {
    const response = await service.get('/application/history/');
    if (response.status === 200) {
      // 只保留 canceled 和 completed 状态的请求
      historyRequests.value = response.data.data.filter(request =>
        request.apl_status === 'canceled' ||
        request.apl_status === 'completed'
      );
      console.log(historyRequests.value)
    }
  } catch (error) {
    console.error('获取历史请求失败:', error);
  }
};

// 撤回请求
const recallRequest = (id) => {
  
  historyRequests.value = historyRequests.value.filter(item => item.id !== id)
}

// 删除请求
const deleteRequest = async (id) => {
  if (confirm('确定要删除这条记录吗?')) {
    const response = await service.post(`/application/delete/${id}/`)
    if (response.data.status === 'success') {
      alert('删除成功')
    }
  }
}

// 获取状态文本
// 获取状态显示文本
const getStatusText = (request) => {
  const isCurrentUserApplicant = request.applicant_username === username;

  switch (request.apl_status) {
    case 'pending':
      return isCurrentUserApplicant ? '等待匹配' : '等待回应';
    case 'waiting':
      return isCurrentUserApplicant ? '请确认交换' : '等待对方确认';
    case 'accepted':
      return '已接受';
    case 'rejected':
      return '已拒绝';
    case 'completed':
      return '已完成';
    case 'matched':
      return '已匹配';
    case 'canceled':
      return '已取消';
    default:
      return request.apl_status;
  }
};
// 判断是否显示操作按钮
const shouldShowActions = (request) => {
  const isCurrentUserApplicant = request.applicant_username === username;
  const isCurrentUserAcceptor = request.accepted_by_username === username;

  // 当前用户是发起方且状态为waiting
  if (isCurrentUserApplicant && request.apl_status === 'waiting') {
    return true;
  }
  //当前用户是接受方且状态为waiting
  if (isCurrentUserAcceptor && request.apl_status === 'waiting') {
    return true;
  }
  // 当前用户是发起方且状态为pending
  if (isCurrentUserApplicant && request.apl_status === 'pending') {
    return true;
  }

  return false;
};

// 前往广场
const goToSquare = () => {
  router.push('/skillsquare');
};

// 生成随机颜色
const getRandomColor = () => {
  const colors = ['#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#e91e63']
  return colors[Math.floor(Math.random() * colors.length)]
}

// 初始化
onMounted(() => {
  if (user.loginUser) {
    // 已登录，加载数据
    fetchSuccessfulExchanges();
    fetchHistoryRequests();
    fetchAllPlans();
  }
  // 未登录时不跳转，只显示提示
});
</script>

<style scoped>
/* 基础布局 */
.bigbox {
  display: flex;
  margin-top: 72px;
  width: 100%;
  min-height: calc(100vh - 72px);
  padding: 1rem;
  box-sizing: border-box;
  gap: 1rem;
  background-color: #f8f8f8;
  flex-direction: column;
}

@media (min-width: 768px) {
  .bigbox {
    flex-direction: row;
    height: calc(100vh - 72px);
  }
}

.leftbox {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

@media (min-width: 768px) {
  .leftbox {
    width: 30%;
    min-width: 300px;
    max-width: 400px;
  }
}

.left-top {
  width: 100%;
  height: auto;
  min-height: 350px;
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.left-bottom {
  width: 100%;
  height: auto;
  min-height: 200px;
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.exchange-plan-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.exchange-plan-item {
  position: relative;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f9f9f9;
  border-left: 4px solid #4caf50;
  transition: all 0.2s ease;
}

.exchange-plan-item.completed {
  border-left-color: #2196F3;
}

.user-avatars {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.user-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.user-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eee;
}

.user-avatar .username {
  margin-top: 0.3rem;
  font-size: 0.7rem;
  color: #666;
  text-align: center;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exchange-icon {
  color: #FF9800;
  font-size: 1rem;
  padding: 0 0.5rem;
}

.exchange-info {
  font-size: 0.85rem;
}

.exchange-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.exchange-row .label {
  font-weight: bold;
  color: #555;
  min-width: 40px;
  margin-right: 0.5rem;
}

.exchange-row .value {
  margin-right: 0.5rem;
  font-weight: 500;
}

.exchange-row .category {
  font-size: 0.7rem;
  color: #888;
  background-color: #f0f0f0;
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
}

.exchange-time {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.5rem;
}

.exchange-time i {
  margin-right: 0.5rem;
  color: #888;
}

.exchange-time .duration {
  margin-left: auto;
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
}

.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  background-color: #4caf50;
  color: white;
}

.exchange-plan-item.completed .status-badge {
  background-color: #2196F3;
}

.rightbox {
  width: 100%;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;
}

.right-top {
  width: 100%;
  min-height: 60px;
  background-color: #f0f9f0;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.right-bottom {
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 0 0 8px 8px;
  padding: 1rem;
  overflow-y: auto;
}

/* 登录提示样式 */
.login-prompt {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
  border-radius: 8px;
}

.prompt-content {
  text-align: center;
  padding: 2rem;
  max-width: 80%;
}

.prompt-content h3 {
  color: #333;
  margin-bottom: 1rem;
}

.prompt-content p {
  color: #666;
  margin-bottom: 1.5rem;
}

.login-btn {
  padding: 0.7rem 1.5rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.login-btn:hover {
  background-color: #3d8b40;
}

/* 日历样式 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-btn {
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-width: 30px;
}

.nav-btn:hover {
  background-color: #e8f5e9;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.3rem;
  flex: 1;
}

.day-header {
  text-align: center;
  font-weight: bold;
  color: #666;
  padding: 0.3rem;
  font-size: clamp(0.7rem, 2vw, 0.9rem);
}

.day-cell {
  text-align: center;
  padding: 0.3rem;
  border-radius: 4px;
  background-color: #f8f8f8;
  cursor: pointer;
  position: relative;
  min-height: 30px;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  font-size: clamp(0.7rem, 2vw, 0.9rem);
}

.day-cell.empty {
  visibility: hidden;
}

.day-cell:hover {
  background-color: #e8f5e9;
}

.day-cell.today {
  border: 2px solid #4caf50;
}

.day-events {
  display: flex;
  justify-content: center;
  gap: 2px;
  width: 100%;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.study-day {
  background-color: #2afb00d1;
}

.teach-day {
  background-color: #5cade7;
}

.completed-day {
  background-color: #e8f5e9;
}

.calendar-legend {
  display: flex;
  justify-content: space-around;
  margin-top: 0.5rem;
  font-size: clamp(0.7rem, 2vw, 0.8rem);
  color: #666;
  flex-wrap: wrap;
}

.legend {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 0.3rem;
}

.legend.today {
  background-color: #4caf50;
}

.legend.study {
  background-color: #ffebee;
}

.legend.teach {
  background-color: #e3f2fd;
}

.legend.completed {
  background-color: #e8f5e9;
}

/* 学习计划列表 */
.plan-list {
  margin-top: 1rem;
  overflow-y: auto;
  flex: 1;
  padding-right: 0.5rem;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.plan-list::-webkit-scrollbar {
  width: 4px;
}

.plan-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.plan-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.plan-item {
  display: flex;
  align-items: center;
  padding: 0.6rem;
  border-bottom: 1px solid #f0f0f0;
  min-height: 40px;
  box-sizing: border-box;
  transition: background-color 0.2s ease;
  cursor: pointer;
  flex-wrap: wrap;
}

.plan-item:hover {
  background-color: #f8f8f8;
}

.plan-date {
  width: 25%;
  color: #4caf50;
  font-weight: 500;
  font-size: clamp(0.7rem, 2vw, 0.8rem);
}

.plan-title {
  width: 50%;
  font-size: clamp(0.7rem, 2vw, 0.9rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-status {
  width: 25%;
  text-align: right;
  font-size: clamp(0.7rem, 2vw, 0.8rem);
  color: #666;
}

.plan-status.completed {
  color: #4caf50;
}

/* 右侧选项卡 */
.tab-btn {
  padding: 0.5rem 0.8rem;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: clamp(0.7rem, 2vw, 0.9rem);
  white-space: nowrap;
}

.tab-btn:hover {
  background-color: #e8f5e9;
}

.tab-btn.active {
  background-color: #4caf50;
  color: white;
}

/* 内容区域 */
.tab-content {
  height: 100%;
  width: 90%;
  overflow-y: auto;
  padding-right: 0.5rem;
}

/* 空状态提示 */
.empty-requests {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-icon {
  font-size: 3rem;
  color: #ccc;
  margin-bottom: 1rem;
}

.empty-requests h4 {
  margin-bottom: 0.5rem;
  color: #333;
}

.browse-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 请求列表 */
.request-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 90%;
}

.request-item {
  position: relative;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #4caf50;

}

/* 状态标签 */
.status-tag {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-tag.pending {
  background-color: #fff3e0;
  color: #ef6c00;
}

.status-tag.waiting {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-tag.accepted {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-tag.rejected {
  background-color: #ffebee;
  color: #c62828;
}

@media (min-width: 576px) {
  .request-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.request-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.request-info {
  flex: 1;
  min-width: 0;
}

.request-title {
  font-weight: 500;
  margin-bottom: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: clamp(0.8rem, 2vw, 1rem);
}

.request-time {
  font-size: clamp(0.7rem, 2vw, 0.8rem);
  color: #666;
  margin-bottom: 0.5rem;
}

.request-desc {
  font-size: clamp(0.7rem, 2vw, 0.85rem);
  color: #555;
}

.request-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

/* 用户信息 */
.user-profiles {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.user-profile {
  display: flex;
  align-items: center;
  flex: 1;
}

.user-profile.current-user {
  font-weight: bold;
}

.avatar-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
  margin-right: 1rem;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.default-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #999;
}

.default-avatar.unmatched {
  position: relative;
  background-color: #e0e0e0;
}

.unmatched-text {
  position: absolute;
  bottom: -20px;
  width: 100%;
  text-align: center;
  font-size: 0.7rem;
  color: #666;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
  margin-bottom: 0.3rem;
}

.user-role {
  font-size: 0.8rem;
  color: #666;
}

.exchange-arrow {
  position: relative;
  padding: 0 1rem;
  color: #4caf50;
  font-size: 4.5rem;
  margin-right: 20%;
}

/* 交换详情 */
.exchange-details {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.detail-row {
  display: flex;
  margin-bottom: 0.5rem;
}

.detail-row.full-width {
  display: block;
}

.detail-label {
  font-weight: 500;
  min-width: 60px;
  color: #666;
}

.detail-value {
  flex: 1;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.action-btn i {
  font-size: 0.9rem;
}

.action-btn.accept {
  background-color: #4caf50;
  color: white;
}

.action-btn.reject {
  background-color: #f44336;
  color: white;
}

.action-btn.cancel {
  background-color: #ff9800;
  color: white;
}

@media (min-width: 576px) {
  .request-actions {
    margin-top: 0;
    justify-content: flex-start;
  }
}

.action-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: clamp(0.7rem, 2vw, 0.9rem);
  transition: background-color 0.2s ease;
  white-space: nowrap;
}

.action-btn.accept {
  background-color: #4caf50;
  color: white;
}

.action-btn.accept:hover {
  background-color: #3d8b40;
}

.action-btn.reject {
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
  color: #666;
}

.action-btn.reject:hover {
  background-color: #f0f0f0;
}

/* 创建表单 */
.create-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.8rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 60%;
}

.form-group label {
  font-weight: 500;
  color: #555;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
}

.form-group input,
.form-group textarea {
  padding: 0.6rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

/* 分类选择器样式 */
.category-selector {
  margin-top: 0.5rem;
}

.category-dropdown {
  position: relative;
  display: inline-block;
  width: 100%;
}

.dropdown-toggle {
  width: 100%;
  padding: 0.6rem;
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
}

.dropdown-toggle:hover {
  background-color: #f0f0f0;
}

.arrow {
  margin-left: 0.5rem;
  font-size: 0.8rem;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  margin-top: 0.3rem;
}

.category-item {
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;
  cursor: pointer;
  font-weight: 500;
}

.category-header:hover {
  background-color: #f8f8f8;
}

.subcategory-list {
  padding-left: 1rem;
}

.subcategory-item {
  padding: 0.5rem 0.3rem;
  cursor: pointer;
  border-radius: 3px;
}

.subcategory-item:hover {
  background-color: #e8f5e9;
}

.selected-category {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #4caf50;
  padding: 0.3rem;
  background-color: #e8f5e9;
  border-radius: 4px;
}

/* 日期时间选择器样式 */
input[type="datetime-local"] {
  padding: 0.6rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  width: 100%;
}

/* 错误消息样式 */
.error-message {
  color: #f44336;
  font-size: 0.8rem;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
  width: 60%;
}

.submit-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 0.7rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: clamp(0.8rem, 2vw, 1rem);
  transition: background-color 0.2s ease;
  margin-top: 0.5rem;
  width: 60%;
}

.submit-btn:hover {
  background-color: #3d8b40;
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* 历史请求 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  padding: 0.8rem;
  background-color: #f8f8f8;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 576px) {
  .history-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.history-item.canceled {
  border-left: 4px solid #ff9800;
  /* 橙色 */
}

.history-item.completed {
  border-left: 4px solid #4caf50;
  /* 绿色 */
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-title {
  font-weight: 500;
  margin-bottom: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: clamp(0.8rem, 2vw, 1rem);
}

.status-badge {
  font-size: clamp(0.6rem, 2vw, 0.7rem);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.history-item.accepted .status-badge {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.canceled {
  background-color: #fff3e0;
  color: #ef6c00;
}

.status-badge.completed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.history-desc {
  font-size: clamp(0.7rem, 2vw, 0.85rem);
  color: #555;
}

.history-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

@media (min-width: 576px) {
  .history-actions {
    margin-top: 0;
    justify-content: flex-start;
  }
}

.history-actions .action-btn {
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
  color: #666;
}

.history-actions .action-btn:hover {
  background-color: #f0f0f0;
}
</style>