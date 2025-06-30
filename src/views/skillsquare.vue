<template>
    <div class="skills-square">
        <div class="main-container">
            <!-- 一级导航 -->
            <div class="primary-nav">
                <div v-for="category in categories" :key="category.name" class="nav-item"
                    :class="{ 'active': activeCategory === category.name }" @click="selectCategory(category.name)">
                    {{ category.name }}
                </div>
            </div>

            <div class="content-area">
                <!-- 二级导航 -->
                <div class="secondary-nav" v-if="activeSubcategories.length > 0">
                    <div v-for="subcat in activeSubcategories" :key="subcat" class="sub-nav-item"
                        :class="{ 'active': activeSubcategory === subcat }" @click="selectSubcategory(subcat)">
                        {{ subcat }}
                    </div>
                </div>

                <!-- 技能交换卡片 -->
                <div class="skills-grid">
                    <!-- 加载状态 -->
                    <div v-if="isLoading" class="loading-state">
                        加载中，请稍候...
                    </div>
                    <!-- 错误状态 -->
                    <div v-else-if="error" class="error-state">
                        加载失败: {{ error }}
                        <button @click="fetchExchanges">重试</button>
                    </div>
                    <!-- 空状态 -->
                    <div v-else-if="exchanges.length === 0" class="empty-state">
                        暂无技能交换信息
                    </div>
                    <template v-else>
                        <div v-for="exchange in filteredExchanges.filter(ex => ex.status === 'pending')" :key="exchange.id" class="exchange-card">
                            <div class="exchange-header">
                                <div class="exchange-title">{{ exchange.title }}</div>
                                <div class="exchange-status" :class="exchange.status">{{ exchange.statusText }}</div>
                            </div>

                            <div class="skills-section">
                                <div class="skill-item">
                                    <div class="skill-label">我想交换</div>
                                    <div class="skill-name">{{ exchange.mySkill }}</div>
                                    <div class="skill-category">{{ exchange.myCategory }}/{{
                                        exchange.mySubcategory }}</div>
                                </div>
                                <div class="exchange-arrow">⇄</div>
                                <div class="skill-item">
                                    <div class="skill-label">我能提供</div>
                                    <div class="skill-name">{{ exchange.targetSkill }}</div>
                                    <div class="skill-category">{{ exchange.targetCategory }}/{{
                                        exchange.targetSubcategory }}</div>
                                </div>
                            </div>

                            <div class="exchange-owner">
                                <span class="owner-avatar"><img class="oa-img" :src="exchange.applicant_avatar"></span>
                                <span class="owner-name">{{ exchange.owner }}</span>
                            </div>

                            <div class="exchange-description">
                                {{ truncateDescription(exchange.description) }}
                            </div>

                            <div class="exchange-footer">
                                <div class="exchange-time">
                                    <span class="time-icon">⏱️</span>
                                    {{ exchange.time }}
                                </div>
                                <button class="action-btn" @click="handleExchange(exchange.id)">
                                    {{ exchange.status === 'pending' ? '接受交换' : '查看详情' }}
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { service } from '@/utils/axios'
import { ref, computed, onMounted, onUnmounted } from 'vue'



// 模拟数据
const categories = ref([
    { name: '编程开发' },
    { name: '设计创作' },
    { name: '语言学习' },
    { name: '生活技能' },
    { name: '学术教育' }
])

const subcategories = ref({
    '编程开发': ['前端开发', '后端开发', '移动开发', '数据分析'],
    '设计创作': ['UI/UX设计', '平面设计', '3D建模', '视频剪辑'],
    '语言学习': ['英语', '日语', '韩语', '法语'],
    '生活技能': ['烹饪', '健身', '手工', '摄影'],
    '学术教育': ['数学', '物理', '化学', '历史']
})

// 初始化空数组
const exchanges = ref([])

// 添加加载状态
const isLoading = ref(false)
const error = ref(null)

// 当前选中的分类（改为字符串）
const activeCategory = ref('编程开发')
const activeSubcategory = ref('前端开发')

// 修改后的 fetchExchanges 方法
const fetchExchanges = async () => {
    try {
        isLoading.value = true
        const response = await fetch('/application/exchange/')

        if (!response.ok) throw new Error(`请求失败: ${response.status}`)
        // console.log('从后端返回的数据：',response.data)
        const data = await response.json()
        // console.log('原始数据:', data.data) // 确认数据结构

        // 直接映射数组（根据截图，data本身就是数组）
        exchanges.value = data.data.map(item => ({
            id: item.id, // 如果没有id则生成随机id
            title: `${item.course} ↔ ${item.skill}`,
            mySkill: item.course,
            myCategory: item.course_category,
            mySubcategory: item.course_subcategory,
            targetSkill: item.skill || '未指定',
            targetCategory: item.skill_category,
            targetSubcategory: item.skill_subcategory,
            owner: item.applicant_username,
            description: item.description || '暂无描述',
            time: item.start_time ? formatTimeRange(item.start_time, item.end_time) : '时间未设置',
            status: item.apl_status || 'pending',
            statusText: getStatusText(item.apl_status),
            applicant_avatar: item.applicant_avatar,
        }))
    } catch (err) {
        console.error('获取数据失败:', err)
        error.value = err.message
        exchanges.value = [] // 确保回退到空数组
    } finally {
        isLoading.value = false
    }
}

// 辅助函数：格式化时间范围
const formatTimeRange = (start, end) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    return `${new Date(start).toLocaleString('zh-CN', options)} - ${new Date(end).toLocaleString('zh-CN', options)}`
}

// 辅助函数：将状态码转换为文本
const getStatusText = (status) => {
    const statusMap = {
        pending: '等待交换',
        approved: '交换中',
        completed: '已完成',
        rejected: '已拒绝'
    }
    return statusMap[status] || '等待交换'
}

// 组件挂载时调用
onMounted(() => {
    fetchExchanges()

    // 添加点击事件监听器
    document.addEventListener('click', fetchExchanges)
})

// 组件卸载时移除监听器（防止内存泄漏）
onUnmounted(() => {
    document.removeEventListener('click', fetchExchanges)
})



// 获取当前分类的子分类
const activeSubcategories = computed(() => {
    return subcategories.value[activeCategory.value] || []
})

// 筛选交换请求
const filteredExchanges = computed(() => {
    return exchanges.value.filter(exchange =>
        exchange.myCategory === activeCategory.value &&
        exchange.mySubcategory === activeSubcategory.value
    )
})

// 导航方法
const selectCategory = (categoryName) => {
    activeCategory.value = categoryName
    const subs = subcategories.value[categoryName]
    activeSubcategory.value = subs?.length ? subs[0] : ''
}

const selectSubcategory = (subcategoryName) => {
    activeSubcategory.value = subcategoryName
}


// 截断描述文字
const truncateDescription = (desc) => {
    return desc.length > 60 ? desc.substring(0, 60) + '...' : desc
}

// 处理交换请求
const handleExchange = async (exchangeId) => {  
    console.log('处理交换请求:', exchangeId)
    const switchok = confirm('确定交换吗？')
    if (switchok) {
        try {
            // 直接调用并等待响应
            const response = await service.post(`/application/switch/${exchangeId}/`)
            
            if (response.message === 'success') { 
                console.log('交换成功！')
                alert('交换成功！')
            }
        } catch (err) {
            console.error('交换失败:', err)
            alert('交换失败！')
        }
    }
}
</script>

<style scoped>
.skills-square {
    display: flex;
    margin-top: 72px;
    width: 100vw;
    height: calc(100vh - 72px);
    background-color: #f8f8f8;
}

.main-container {
    display: flex;
    width: 98%;
    height: 95%;
    margin: 1rem auto;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 一级导航样式 */
.primary-nav {
    width: 160px;
    padding: 1rem 0;
    background-color: #f0f9f0;
    border-radius: 8px 0 0 8px;
}

.nav-item {
    padding: 0.8rem 1.2rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
    font-size: 0.9rem;
    color: #555;
}

.nav-item:hover {
    background-color: #e8f5e9;
    color: #333;
}

.nav-item.active {
    background-color: #4caf50;
    color: white;
}

/* 内容区域 */
.content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
}

/* 二级导航样式 */
.secondary-nav {
    display: flex;
    gap: 0.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.sub-nav-item {
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    background-color: #f8f8f8;
    transition: all 0.2s ease;
}

.sub-nav-item:hover {
    background-color: #e8f5e9;
}

.sub-nav-item.active {
    background-color: #4caf50;
    color: white;
}

/* 交换卡片网格 */
.skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    overflow-y: auto;
    padding-right: 0.5rem;
    flex: 1;
}

/* 自定义滚动条 */
.skills-grid::-webkit-scrollbar {
    width: 6px;
}

.skills-grid::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.skills-grid::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

/* 交换卡片样式 */
.exchange-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    height: 240px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.exchange-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.exchange-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.exchange-title {
    font-weight: 600;
    font-size: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70%;
}

.exchange-status {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
}

.exchange-status.pending {
    background-color: #fff3e0;
    color: #ef6c00;
}

.exchange-status.approved {
    background-color: #e8f5e9;
    color: #2e7d32;
}

.exchange-status.completed {
    background-color: #e3f2fd;
    color: #1565c0;
}

.skills-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0.5rem 0;
    padding: 0.5rem 0;
    border-top: 1px dashed #e0e0e0;
    border-bottom: 1px dashed #e0e0e0;
}

.skill-item {
    flex: 1;
    padding: 0.3rem;
}

.skill-label {
    font-size: 0.7rem;
    color: #666;
    margin-bottom: 0.2rem;
}

.skill-name {
    font-weight: 500;
    font-size: 0.9rem;
    margin-bottom: 0.2rem;
}

.skill-category {
    font-size: 0.65rem;
    color: #888;
}

.exchange-arrow {
    font-size: 1.2rem;
    color: #4caf50;
    padding: 0 0.5rem;
}

.exchange-owner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.3rem 0;
    font-size: 0.75rem;
}

.owner-avatar {
    width: 35px;
    height: 33px;
    border-radius: 50%;
    background-color: #4caf50;
}

.oa-img {
    width: 100%;
    height: 100%;
}

.exchange-description {
    color: #555;
    font-size: 0.8rem;
    line-height: 1.4;
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin: 0.3rem 0;
}

.exchange-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
}

.exchange-time {
    font-size: 0.7rem;
    color: #666;
    display: flex;
    align-items: center;
    gap: 0.2rem;
}

.time-icon {
    font-size: 0.8rem;
}

.action-btn {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.75rem;
    transition: background-color 0.2s ease;
}

.action-btn:hover {
    background-color: #3d8b40;
}

.loading-state,
.error-state,
.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #666;
}

.error-state {
    color: #d32f2f;
}

.error-state button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
</style>