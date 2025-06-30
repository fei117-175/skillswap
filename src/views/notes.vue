<template>
    <div class="blog-admin-container">
        <!-- 固定头部 -->
        <header class="blog-admin-header">
            <h1>博客管理</h1>
            <div class="header-actions">
                <button class="new-post-btn" @click="openEditor">
                    <i class="icon-add">+</i> 新建博客
                </button>
                <button class="personal-toggle" @click="togglePersonalView" :class="{ active: showPersonal }">
                    <i class="icon-personal">👤</i> {{ showPersonal ? '隐藏个人' : '显示个人' }}
                </button>
                <button class="manage-btn" @click="toggleManageMode" :class="{ active: isManageMode }">
                    <i class="icon-edit">✎</i> {{ isManageMode ? '退出管理' : '管理博客' }}
                </button>
            </div>
        </header>

        <!-- 博客列表 -->
        <main class="blog-admin-list">
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-indicator">
                <div class="spinner"></div>
                <span>加载中...</span>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="error" class="error-message">
                <p>加载失败: {{ error }}</p>
                <button @click="loadBlogData">重试</button>
            </div>

            <!-- 空状态卡片 -->
            <div class="blog-card empty-card" v-else-if="posts.length === 0">
                <div class="card-content">
                    <div class="user-name">@{{ username }}</div>
                    <h3>暂无博客内容</h3>
                    <p class="empty-message">点击"新建博客"开始创作</p>
                </div>
            </div>

            <!-- 正常博客列表 -->
            <div class="blog-card" v-else v-for="post in filteredPosts" :key="post.id" @click="handleCardClick(post)"
                :class="{ selected: isManageMode && selectedPostId === post.id }">
                <div class="user-name">@{{ post.bloger }}</div>

                <!-- 删除按钮 -->
                <button class="delete-btn" v-if="isManageMode && selectedPostId === post.id"
                    @click.stop="deletePost(post.id)">
                    <i class="icon-delete">×</i>
                </button>

                <!-- 博客图片 -->
                <div class="card-image" v-if="post.images && post.images.length > 0">
                    <img :src="getImageUrl(post.images[0])" alt="博客图片" @error="handleImageError">
                    <span class="image-count" v-if="post.images.length > 1">+{{ post.images.length - 1 }}</span>
                </div>

                <div class="card-content">
                    <h3>{{ post.title || '无标题' }}</h3>
                    <div class="card-meta">
                        <span class="post-date">{{ formatDate(post.created_at) }}</span>
                        <div class="stats-container">
                            <span class="stat-item">
                                <i class="icon-like">👍</i> {{ post.likes || 0 }}
                            </span>
                            <span class="stat-item">
                                <i class="icon-like">🧾</i> {{ post.comments.length || 0 }}
                            </span>
                            <span class="visibility-tag" :class="post.visibility === 0 ? 'public' : 'private'">
                                {{ post.visibility === 0 ? '公开' : '私密' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 博客编辑器模态框 -->
        <EditorModal v-if="showEditor" :post="currentPost" :isEditing="editingPost !== null" @save="handleSaveSuccess"
            @close="closeEditor" />

        <!-- 博客详情模态框 -->
        <PostDetailModal v-if="selectedPost" :key="refreshKey" :post="selectedPost" @close="selectedPost = null"
            @view-image="openImageViewer" />

        <!-- 图片查看器 -->
        <ImageViewer v-if="showImageViewer" :images="currentImages" :current-index="currentImageIndex"
            @close="closeImageViewer" @prev="prevImage" @next="nextImage" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import EditorModal from '@/components/EditorModal.vue'
import PostDetailModal from '@/components/PostDetailModal.vue'
import ImageViewer from '@/components/ImageViewer.vue'
import { service, tokenManager } from '@/utils/axios.js'

// 博客数据状态
const posts = ref([])
const loading = ref(false)
const error = ref(null)

// UI状态
const isManageMode = ref(false)
const selectedPostId = ref(null)
const showEditor = ref(false)
const selectedPost = ref(null)
const editingPost = ref(null)
const currentPost = ref(createNewPost())
const showPersonal = ref(true)

// 图片查看器相关
const showImageViewer = ref(false)
const currentImages = ref([])
const currentImageIndex = ref(0)

// 刷新键
const refreshKey = ref(0)

// 获取用户信息
const username = ref('')

// 组件挂载时加载博客数据
onMounted(() => {
    loadBlogData()
})

// 加载博客数据
async function loadBlogData() {
    try {
        loading.value = true
        error.value = null
        // const newToken = await tokenManager.refreshToken();
        // console.log('新Token:', newToken);  
        // 获取博客数据
        const blogResponse = await service.get('http://127.0.0.1:8000/blog/blogs/')
        console.log(blogResponse.data.blogs)
        posts.value = blogResponse.data.blogs.blog_list
        
    } catch (err) {
        console.error('加载数据失败:', err)
        error.value = err.response?.data?.detail || err.message || '加载失败'
    } finally {
        loading.value = false
    }
}

// 处理保存成功后的数据更新
function handleSaveSuccess(newlist) {
    console.log('后端响应:',typeof newlist) // 调试用
    // 转换数据格式
    posts.value = newlist.map(blog => ({
        id: blog.id,
        title: blog.title || '无标题',
        content: blog.content || '',
        bloger: blog.bloger,  // 使用后端返回的bloger字段
        visibility: blog.visibility || 0,
        likes: blog.likes || 0,  // 注意后端没有返回likes字段
        comments: blog.comments || [],
        images: blog.images || [],
        created_at: blog.created_at  // 保持原始格式
    }))

    // 强制刷新
    refreshKey.value++
    closeEditor()
}

function createNewPost() {
    return {
        id: null, // 临时ID，保存后会由后端分配真实ID
        title: '',
        content: '',
        bloger: '', // 使用当前用户名
        visibility: 0,
        images: [],
        likes: 0, // 默认0点赞
        created_at: new Date().toISOString(), // 完整ISO格式
        updated_at: new Date().toISOString()  // 添加更新时间
    }
}

// 计算属性 - 过滤博客列表
const filteredPosts = computed(() => {
    if (!Array.isArray(posts.value)) return []
    return posts.value.filter(post => {
        if (!post) return false
        if (isManageMode.value) return true
        if (!showPersonal.value) return post.visibility === 0
        return true
    })
})

// 方法 - 打开编辑器
function openEditor(post = null) {
    if (post) {
        currentPost.value = { ...post }
        editingPost.value = post.id
    } else {
        currentPost.value = createNewPost()
        editingPost.value = null
    }
    showEditor.value = true
}

function closeEditor() {
    showEditor.value = false
}

function toggleManageMode() {
    isManageMode.value = !isManageMode.value
    if (!isManageMode.value) {
        selectedPostId.value = null
    }
}

function togglePersonalView() {
    showPersonal.value = !showPersonal.value
}

function handleCardClick(post) {
    if (isManageMode.value) {
        selectedPostId.value = post.id
    } else {
        selectedPost.value = post
    }
}

// 删除博客
async function deletePost(postId) {
    if (confirm('确定要删除这篇博客吗？')) {
        try {
            await service.delete(`http://127.0.0.1:8000/blog/delete/${postId}/`)
            posts.value = posts.value.filter(post => post.id !== postId)
        } catch (err) {
            console.error('删除失败:', err)
            alert(err.response?.data?.detail || '删除失败')
        }
    }
}

// 图片查看器相关方法
function openImageViewer(index) {
    currentImages.value = selectedPost.value.images
    currentImageIndex.value = index
    showImageViewer.value = true
}

function closeImageViewer() {
    showImageViewer.value = false
}

function prevImage() {
    if (currentImageIndex.value > 0) {
        currentImageIndex.value--
    }
}

function nextImage() {
    if (currentImageIndex.value < currentImages.value.length - 1) {
        currentImageIndex.value++
    }
}

// 辅助方法
function formatDate(dateString) {
    if (!dateString) return '未知日期'
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
}

function getImageUrl(imgPath) {
    if (!imgPath) return ''
    if (imgPath.startsWith('http') || imgPath.startsWith('data:')) {
        return imgPath
    }
}
</script>

<style scoped>
/* 样式部分保持不变，与之前完全相同 */
.blog-admin-container {
    width: 90vw;
    max-width: 1200px;
    margin: 0 auto;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    min-height: 100vh;
    box-sizing: border-box;
    padding-top: 80px;
}

.blog-admin-header {
    position: fixed;
    width: 84vw;
    top: 8%;
    left: 0;
    right: 0;
    background-color: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 100;
    padding: 15px 5vw;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.blog-admin-header h1 {
    color: #2E7D32;
    margin: 0;
    font-size: 1.5rem;
}

.header-actions {
    display: flex;
    gap: 15px;
}

.new-post-btn,
.personal-toggle,
.manage-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    transition: all 0.2s;
}

.new-post-btn {
    background-color: #4CAF50;
    color: white;
}

.new-post-btn:hover {
    background-color: #3d8b40;
}

.personal-toggle {
    background-color: #f5f5f5;
    color: #333;
}

.personal-toggle:hover,
.personal-toggle.active {
    background-color: #e0e0e0;
}

.personal-toggle.active {
    background-color: #9C27B0;
    color: white;
}

.manage-btn {
    background-color: #f5f5f5;
    color: #333;
}

.manage-btn:hover,
.manage-btn.active {
    background-color: #e0e0e0;
}

.manage-btn.active {
    background-color: #2196F3;
    color: white;
}

.blog-admin-list {
    display: grid;
    margin-top: 5%;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 25px;
    padding: 20px 0;
}

.blog-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.3s;
    position: relative;
    cursor: pointer;
}

.blog-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.blog-card.selected {
    border: 2px solid #2196F3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
}

.delete-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.2s;
}

.delete-btn:hover {
    background-color: #d32f2f;
    transform: scale(1.1);
}

.card-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1/1;
    overflow: hidden;
}

.card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
}

.blog-card:hover .card-image img {
    transform: scale(1.05);
}

.image-count {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.card-content {
    padding: 15px;
    display: flex;
    flex-direction: column;
    height: calc(100% - 15px - 1/1 * 100%);
    min-height: 150px;
}

.card-content h3 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 1.1rem;
    flex-grow: 1;
}

.card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid #f0f0f0;
    font-size: 12px;
}

.stats-container {
    display: flex;
    gap: 10px;
    align-items: center;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 3px;
    color: #666;
}

.icon-like,
.icon-comment {
    font-size: 14px;
}

.post-date {
    font-size: 12px;
    color: #888;
}

.visibility-tag {
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 4px;
}

.visibility-tag.public {
    background-color: #E8F5E9;
    color: #2E7D32;
}

.visibility-tag.private {
    background-color: #FFF3E0;
    color: #E65100;
}

/* 用户名样式 */
.user-name {
    color: #666;
    font-size: 0.9rem;
    padding: 10px 15px 0;
    font-style: italic;
}

/* 空卡片特殊样式 */
.empty-card {
    background-color: #f9f9f9;
    border: 2px dashed #ddd;
    text-align: center;
}

.empty-card .card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
}

.empty-card h3 {
    color: #888;
    margin: 10px 0;
}

.empty-message {
    color: #aaa;
    margin-top: 5px;
}

@media (max-width: 768px) {
    .blog-admin-list {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 15px;
    }

    .blog-admin-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 5vw;
    }

    .header-actions {
        width: 100%;
        justify-content: flex-end;
    }
}

@media (max-width: 480px) {
    .blog-admin-container {
        width: 95vw;
        padding-top: 100px;
    }

    .blog-admin-list {
        grid-template-columns: 1fr;
    }

    .header-actions {
        flex-wrap: wrap;
        justify-content: center;
    }

    .new-post-btn,
    .personal-toggle,
    .manage-btn {
        width: 100%;
        justify-content: center;
    }

    .stats-container {
        gap: 5px;
    }

    .stat-item {
        font-size: 11px;
    }
}
</style>