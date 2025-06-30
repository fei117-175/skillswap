<template>
  <!-- 固定顶部区域 -->
  <div class="fixed-header">
    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-input-wrapper">
        <input v-model="searchQuery" @input="handleSearchInput" @focus="showSuggestions = true"
          @blur="onSearchInputBlur" placeholder="搜索帖子、用户..." class="search-input">
        <!-- 搜索建议下拉框 -->
        <div v-if="showSuggestions && searchSuggestions.length" class="suggestions-dropdown">
          <div v-for="(item, index) in searchSuggestions" :key="index" class="suggestion-item"
            @mousedown="selectSuggestion(item)">
            <div class="suggestion-type" :class="item.type">
              {{ getTypeIcon(item.type) }}
            </div>
            <div class="suggestion-content">
              <div class="suggestion-display">
                <span v-if="item.type === 'user'">
                  <span class="highlight">{{ item.username }}</span>
                  <span class="sk-id" v-if="item.sk_id">({{ item.sk_id }})</span>
                </span>
                <span v-if="item.type === 'blog'">
                  <span class="highlight">{{ item.title }}</span>
                  <span class="author">by {{ item.author.username }}</span>
                </span>
                <span v-if="item.type === 'exchange'">
                  <span class="highlight">{{ item.course }}</span> ↔
                  <span class="highlight">{{ item.skill }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button @click="performSearch" class="search-button">搜索</button>
      <button v-if="isSearching" @click="clearSearch" class="clear-search-button">清除</button>
    </div>
    
    <!-- 分类导航 -->
    <div class="nav-container">
      <a v-for="tab in tabs" :key="tab.id" href="#" @click.prevent="switchTab(tab)" class="nav-tab"
        :class="{ active: currentTab === tab.id }">
        {{ tab.name }}
      </a>
    </div>
  </div>

  <!-- 可滚动内容区域 -->
  <div class="scrollable-content">
    <div class="content-box">
      <div class="post-list">
        <div class="post-item" v-for="post in visiblePosts" :key="post.id">
          <div class="post-header">
            <img :src="post.author.avatar || '/skillswapicon.png'" class="avatar">
            <div class="user-info">
              <span class="username">{{ post.author.username }}</span>
              <span class="post-time">{{ formatDate(post.created_at) }}</span>
            </div>
          </div>

          <div class="post-content">
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-text">{{ post.summary }}</p>
            <div v-if="post.media && post.media.length" class="post-media-grid">
              <div v-for="(media, idx) in post.media" :key="media.url" class="media-grid-item"
                :class="{ 'single-item': post.media.length === 1 }" @click="openImageViewer(post.media, idx)">
                <img :src="media.url" class="post-image">
                <div v-if="post.media.length > 1 && idx === 8 && post.media.length > 9" class="more-indicator">
                  +{{ post.media.length - 9 }}
                </div>
              </div>
            </div>
          </div>
          <div class="post-actions">
            <button @click="likePost(post)" :class="{ liked: post.is_liked }" :disabled="!user.loginUser"
              :title="!user.loginUser ? '请登录后点赞' : ''">
              👍 {{ post.likes }}
            </button>
            <button @click="toggleComments(post)">
              💬 {{ post.comment_count }}
            </button>
            <button @click="bookmarkPost(post.id)" :class="{ bookmarked: post.isBookmarked }">
              🔖 {{ post.isBookmarked ? '已收藏' : '收藏' }}
            </button>
          </div>

          <!-- 评论区域 -->
          <div v-if="commentStates[post.id]?.showComments" class="comments-section">
            <div v-if="commentStates[post.id]?.comments.length" class="comments-list">
              <div v-for="comment in commentStates[post.id].comments" :key="comment.id" class="comment-item">
                <img :src="comment.avatar" class="comment-avatar">
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-username">{{ comment.username }}</span>
                    <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                </div>
              </div>
            </div>
            <div v-else class="no-comments">
              暂时还没有评论哦
            </div>

            <div class="comment-input">
              <input v-model="commentStates[post.id].newComment" @keyup.enter="addComment(post)"
                placeholder="写下你的评论..." class="comment-input-field">
              <button @click="addComment(post)" class="comment-send-btn">发送</button>
            </div>
          </div>
        </div>

        <!-- 哨兵元素 -->
        <div ref="sentinel" class="sentinel"></div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-indicator">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>
        <div v-if="!hasMore" class="no-more-data">没有更多内容了</div>
      </div>
    </div>
  </div>

  <!-- 图片查看器 -->
  <div v-if="showImageModal" class="image-viewer-modal" @click.self="closeImageViewer">
    <div class="image-viewer-container">
      <button class="close-btn" @click="closeImageViewer">×</button>
      <img :src="currentImage.url" class="viewer-image">
      <div class="image-nav">
        <button @click="prevImage" :disabled="currentImageIndex === 0">❮</button>
        <span class="image-counter">{{ currentImageIndex + 1 }} / {{ images.length }}</span>
        <button @click="nextImage" :disabled="currentImageIndex === images.length - 1">❯</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue'
import { service } from '@/utils/axios'
import { useCounterStore } from "@/stores/counter"; //pinia库
import { useRouter } from 'vue-router'

const router = useRouter()
const user = useCounterStore();
const searchQuery = ref('')
const isSearching = ref(false)
const searchResults = ref([])
const showSuggestions = ref(false)
const searchSuggestions = ref([])

// 分类标签
const tabs = ref([
  { id: 'all', name: '全部' },
  { id: 'programming', name: '编程' },
  { id: 'sports', name: '运动' },
  { id: 'music', name: '音乐' },
  { id: 'cooking', name: '烹饪' },
  { id: 'photography', name: '摄影' },
  { id: 'gaming', name: '电竞' }
])

const currentTab = ref('all')
const tagBlogs = ref([])
const allPosts = computed(() => {
  if (!tagBlogs.value.length) return []

  if (currentTab.value === 'all') {
    return tagBlogs.value.flatMap(tag => tag.blogs.map(blog => ({
      ...blog,
      tag_name: tag.tag_name,
      showComments: false,
      newComment: '',
      comments: blog.comments || []
    })))
  }

  const currentTag = tagBlogs.value.find(tag => tag.tag_name === currentTab.value)
  return currentTag ? currentTag.blogs.map(blog => ({
    ...blog,
    tag_name: currentTag.tag_name,
    showComments: false,
    newComment: '',
    comments: blog.comments || []
  })) : []
})

// 获取类型图标
const getTypeIcon = (type) => {
  const icons = {
    user: '👤',
    blog: '📝',
    exchange: '🔄'
  }
  return icons[type] || '🔍'
}

// 获取搜索建议
const fetchSearchSuggestions = async () => {
  if (!searchQuery.value.trim()) {
    searchSuggestions.value = []
    return
  }

  try {
    const res = await service.get('/search_suggestions/', {
      params: { q: searchQuery.value }
    })
    searchSuggestions.value = res.data
  } catch (error) {
    console.error('获取搜索建议失败:', error)
    searchSuggestions.value = []
  }
}

// 选择建议项并跳转到对应页面
const selectSuggestion = (item) => {
  console.log('Selected item:', item)

  try {
    if (!item || !item.type) {
      console.error('Invalid item data:', item)
      return
    }

    switch (item.type) {
      case 'user':
        if (item.sk_id) {
          router.push({
            name: 'profile',
            params: { sk_id: item.sk_id }
          })
        } else {
          console.error('User item missing sk_id:', item)
        }
        break

      case 'blog':
        if (item.id) {
          router.push({
            name: 'blog-detail',
            params: { id: item.id }
          })
        } else {
          console.error('Blog item missing id:', item)
        }
        break

      default:
        console.warn('Unknown item type:', item.type)
    }

    showSuggestions.value = false

  } catch (error) {
    console.error('Navigation failed:', error)
  }
}

// 输入框失去焦点处理
const onSearchInputBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

// 搜索方法
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    clearSearch()
    return
  }
  try {
    loading.value = true
    const res = await service.get('/blog/search/', {
      params: {
        q: searchQuery.value,
        tag: currentTab.value === 'all' ? null : currentTab.value
      }
    })

    if (res.data.status === 'success') {
      searchResults.value = res.data.results
      isSearching.value = true
      currentPage.value = 1
      hasMore.value = res.data.results.length > 0
    }
  } catch (error) {
    console.error('搜索失败:', error)
    alert('搜索失败，请重试')
  } finally {
    loading.value = false
  }
}

// 输入处理 - 防抖
let searchTimeout = null
const handleSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (searchQuery.value.trim()) {
      fetchSearchSuggestions()
    } else {
      searchSuggestions.value = []
    }
  }, 300)
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
  isSearching.value = false
  searchResults.value = []
  searchSuggestions.value = []
  resetPosts()
  loadPosts()
}

// 新增一个响应式对象专门管理评论展开状态
const commentStates = ref({})
const visiblePosts = computed(() => {
  let posts = []

  // 处理搜索结果
  if (isSearching.value) {
    posts = searchResults.value.map(post => ({
      ...post,
      showComments: commentStates.value[post.id]?.showComments || false,
      newComment: commentStates.value[post.id]?.newComment || '',
      comments: commentStates.value[post.id]?.comments || []
    }))
  }
  // 处理分类数据
  else {
    if (!tagBlogs.value.length) return []

    if (currentTab.value === 'all') {
      posts = tagBlogs.value.flatMap(tag => tag.blogs.map(blog => ({
        ...blog,
        tag_name: tag.tag_name,
        showComments: commentStates.value[blog.id]?.showComments || false,
        newComment: commentStates.value[blog.id]?.newComment || '',
        comments: commentStates.value[blog.id]?.comments || []
      })))
    } else {
      const currentTag = tagBlogs.value.find(tag => tag.tag_name === currentTab.value)
      if (currentTag) {
        posts = currentTag.blogs.map(blog => ({
          ...blog,
          tag_name: currentTag.tag_name,
          showComments: commentStates.value[blog.id]?.showComments || false,
          newComment: commentStates.value[blog.id]?.newComment || '',
          comments: commentStates.value[blog.id]?.comments || []
        }))
      }
    }
  }

  // 分页处理
  const start = 0
  const end = start + (currentPage.value * postsPerLoad)
  return posts.slice(0, end)
})

const currentPage = ref(1)
const loading = ref(false)
const hasMore = ref(true)
const postsPerLoad = 10
const sentinel = ref(null)

// 图片查看器相关
const showImageModal = ref(false)
const images = ref([])
const currentImageIndex = ref(0)
const currentImage = computed(() => images.value[currentImageIndex.value] || {})

// 获取所有公开的帖子
const getallblogs = async () => {
  try {
    loading.value = true
    const res = await service.get('/blog/getallblogs/')
    if (res.data.status === 'success') {
      tagBlogs.value = res.data.data
      // 初始化评论状态
      commentStates.value = {} // 重置状态

      tagBlogs.value.forEach(tagGroup => {
        tagGroup.blogs.forEach(blog => {
          commentStates.value[blog.id] = {
            showComments: false,
            comments: blog.comments || [],
            newComment: ''
          }
        })
      })
      
      // 初始化后检查是否有更多数据
      hasMore.value = tagBlogs.value.some(tag => tag.blogs.length > 0)
    }
  } catch (error) {
    console.error('获取博客数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载更多帖子
const loadMorePosts = () => {
  if (loading.value || !hasMore.value || isSearching.value) return
  
  // 检查是否还有更多数据可以加载
  const totalPosts = currentTab.value === 'all' 
    ? tagBlogs.value.flatMap(tag => tag.blogs).length
    : tagBlogs.value.find(tag => tag.tag_name === currentTab.value)?.blogs.length || 0
  
  const loadedPosts = currentPage.value * postsPerLoad
  
  if (loadedPosts >= totalPosts) {
    hasMore.value = false
    return
  }
  
  loading.value = true
  currentPage.value += 1
  loading.value = false
}

// 切换分类
const switchTab = async (tab) => {
  currentTab.value = tab.id
  if (isSearching.value) {
    clearSearch()
  }
  resetPosts()
  await getallblogs()
}

// 重置文章列表
const resetPosts = () => {
  currentPage.value = 1
  hasMore.value = true
}

// 初始化IntersectionObserver
let observer
onMounted(() => {
  try {
    console.log('开始加载数据');
    getallblogs();
  } catch (err) {
    console.error('初始化失败:', err);
  }
  
  // 设置IntersectionObserver来检测哨兵元素
  observer = new IntersectionObserver(
    (entries) => {
      const firstEntry = entries[0]
      if (firstEntry.isIntersecting && !loading.value && hasMore.value) {
        loadMorePosts()
      }
    },
    { 
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }
  )
  
  // 确保sentinel元素存在后再观察
  nextTick(() => {
    if (sentinel.value) {
      observer.observe(sentinel.value)
    }
  })
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
})

const updatePostState = (postId, updates) => {
  // 1. 更新源数据 (tagBlogs)
  updateTagBlogs(postId, thePost => ({
    ...thePost,
    ...updates
  }))

  // 2. 更新搜索结果（如果是搜索状态）
  if (isSearching.value) {
    const postIndex = searchResults.value.findIndex(p => p.id === postId)
    if (postIndex !== -1) {
      Object.assign(searchResults.value[postIndex], updates)
    }
  }
}

// 点赞功能
const likePost = async (post) => {
  if (!user.loginUser) {
    alert('请登录后再点赞')
    return
  }

  try {
    const wasLiked = post.is_liked
    const originalLikes = post.likes

    const updateData = {
      is_liked: !wasLiked,
      likes: wasLiked ? originalLikes - 1 : originalLikes + 1
    }

    Object.assign(post, updateData)
    updatePostState(post.id, updateData)

    const res = await service.post(`/blog/toggle_like/${post.id}/`)

    if (res.data.status !== 'success' || res.data.is_liked !== !wasLiked) {
      updatePostState(post.id, {
        is_liked: wasLiked,
        likes: originalLikes
      })
      throw new Error('点赞操作状态不一致')
    }
  } catch (error) {
    console.error('点赞操作出错:', error)
    alert('点赞操作失败，请重试')
  }
}

// 收藏功能
const bookmarkPost = async (postId) => {
  if (!user.loginUser) {
    alert('请登录后再收藏')
    return
  }
  try {
    const post = visiblePosts.value.find(p => p.id === postId)
    if (!post) return

    const wasBookmarked = post.isBookmarked
    const updateData = { isBookmarked: !wasBookmarked }

    Object.assign(post, updateData)
    updatePostState(postId, updateData)

    const res = await service.post(`/blog/toggle_bookmark/${postId}/`)
    console.log(res.data)
    if (res.data.status !== 'success' || res.data.is_bookmarked !== !wasBookmarked) {
      updatePostState(postId, { isBookmarked: wasBookmarked })
      throw new Error('收藏操作状态不一致')
    }

    if (res.data.is_bookmarked !== undefined) {
      updatePostState(postId, { isBookmarked: res.data.is_bookmarked })
    }
  } catch (error) {
    console.error('收藏操作出错:', error)
    alert('收藏操作失败，请重试')
  }
}

// 切换评论显示
const toggleComments = (post) => {
  if (!commentStates.value[post.id]) {
    commentStates.value[post.id] = {
      showComments: false,
      comments: post.comments || [],
      newComment: ''
    };
  }
  commentStates.value[post.id].showComments = !commentStates.value[post.id].showComments;
  commentStates.value = { ...commentStates.value };
}

// 添加评论
const addComment = async (post) => {
  if (!user.loginUser) {
    alert('请先登录后再发表评论')
    return
  }
  if (!post.newComment.trim()) return

  try {
    const res = await service.post(`/blog/addcomment/${post.id}/`, {
      content: post.newComment,
    })
    if (res.data.message === 'success') {
      if (!commentStates.value[post.id]) {
        commentStates.value[post.id] = {
          showComments: true,
          comments: [],
          newComment: ''
        }
      }

      commentStates.value[post.id] = {
        ...commentStates.value[post.id],
        comments: [
          {
            ...res.data.data,
            avatar: res.data.data.avatar || '/skillswapicon.png',
            username: res.data.data.username || user.loginUser.username
          },
          ...commentStates.value[post.id].comments
        ],
        newComment: ''
      }

      updateTagBlogs(post.id, thePost => ({
        ...thePost,
        comment_count: thePost.comment_count + 1
      }))

      if (isSearching.value) {
        const postIndex = searchResults.value.findIndex(p => p.id === post.id)
        if (postIndex !== -1) {
          const updatedPost = { ...searchResults.value[postIndex] }
          updatedPost.comment_count += 1
          searchResults.value.splice(postIndex, 1, updatedPost)
        }
      }
    }
  } catch (error) {
    console.error('添加评论失败:', error)
  }
}

// 更新源数据中的博客（tagBlogs）
const updateTagBlogs = (postId, updateFn) => {
  tagBlogs.value = tagBlogs.value.map(tagGroup => {
    const updatedBlogs = tagGroup.blogs.map(blog => {
      if (blog.id === postId) {
        return { ...updateFn(blog) };
      }
      return blog;
    });
    return { ...tagGroup, blogs: updatedBlogs };
  });
};

// 图片查看器功能
const openImageViewer = (mediaList, index = 0) => {
  images.value = mediaList
  currentImageIndex.value = index
  showImageModal.value = true
  document.body.style.overflow = 'hidden'
}

const closeImageViewer = () => {
  showImageModal.value = false
  document.body.style.overflow = ''
}

const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const nextImage = () => {
  if (currentImageIndex.value < images.value.length - 1) {
    currentImageIndex.value++
  }
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return '刚刚'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
/* 固定顶部区域 */
.fixed-header {
  position: fixed;
  margin-top: 5%;
  width: 93%;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 搜索框容器 */
.search-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
}

.search-input {
  width: 40%;
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  margin-left: 58%;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.search-input:focus {
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.suggestion-item {
  display: flex;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #f5f5f5;
}

.suggestion-type {
  width: 32px;
  font-size: 1.2em;
  margin-right: 8px;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
  overflow: hidden;
}

.suggestion-display {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.highlight {
  color: #42b983;
  font-weight: bold;
}

.sk-id {
  color: #666;
  font-size: 0.8em;
  margin-left: 4px;
}

.author {
  color: #666;
  font-size: 0.9em;
  margin-left: 8px;
}

/* 不同类型颜色 */
.suggestion-type.user {
  color: #4a89dc;
}

.suggestion-type.blog {
  color: #37bc9b;
}

.suggestion-type.exchange {
  color: #f6bb42;
}

.search-button {
  padding: 0.6rem 1.2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.search-button:hover {
  background-color: #3aa876;
}

.clear-search-button {
  padding: 0.6rem 1rem;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.clear-search-button:hover {
  background-color: #cc0000;
}

/* 导航栏容器 */
.nav-container {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  background: linear-gradient(to right, #25b814, #3fe844);
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-tab {
  flex: 0 0 auto;
  padding: 0 1.2rem;
  height: 40px;
  margin: 0 0.5%;
  color: white;
  font-weight: bold;
  text-decoration: none;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nav-tab:hover {
  background-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.nav-tab.active {
  background-color: white;
  color: #25b814;
}

/* 可滚动内容区域 */
.scrollable-content {
  margin-top: 15%; /* 顶部固定区域的高度 */
  height: calc(100vh - 140px);
  overflow-y: auto;
  padding-bottom: 20px;
}

.content-box {
  width: 90%;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-list {
  padding: 1.5rem;
}

.post-item {
  margin-bottom: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
  padding: 1.5rem;
}

.post-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 加载状态 */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: #888;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f5;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.5rem;
}

.no-more-data {
  text-align: center;
  padding: 2rem;
  color: #888;
}

.sentinel {
  height: 1px;
  margin: 10px 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 帖子内容样式 */
.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: bold;
  margin-bottom: 0.2rem;
}

.post-time {
  color: #888;
  font-size: 0.8rem;
}

.post-title {
  margin: 0 0 0.8rem 0;
  color: #333;
  font-size: 1.1rem;
}

.post-text {
  color: #555;
  line-height: 1.6;
  margin-bottom: 1rem;
}

/* 九宫格图片布局 - 缩小尺寸 */
.post-media-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-top: 0.5rem;
}

.media-grid-item {
  width: 100%;
  position: relative;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.media-grid-item:hover {
  transform: scale(0.98);
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.5);
}

.media-grid-item.single-item {
  grid-column: span 3;
  aspect-ratio: 16/9;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.post-actions {
  display: flex;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.post-actions button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
}

.post-actions button:hover {
  background: #f0f0f0;
}

.post-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.post-actions .liked {
  color: #ff4081;
}

.post-actions .bookmarked {
  color: #1a73e8;
}

/* 评论区域 */
.comments-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.comments-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding-right: 0.5rem;
}

.comment-item {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.comment-item:hover {
  background-color: #f9f9f9;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}

.comment-username {
  font-weight: bold;
  font-size: 0.9rem;
}

.comment-time {
  color: #888;
  font-size: 0.8rem;
}

.comment-text {
  font-size: 0.9rem;
  line-height: 1.4;
  color: #333;
}

.no-comments {
  text-align: center;
  color: #888;
  padding: 1rem 0;
  font-size: 0.9rem;
}

.comment-input {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.comment-input-field {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  transition: all 0.3s;
}

.comment-input-field:focus {
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

.comment-send-btn {
  padding: 0.6rem 1.2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.comment-send-btn:hover {
  background-color: #3aa876;
}

/* 图片查看器 */
.image-viewer-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.image-viewer-container {
  position: relative;
  width: 50vw;
  height: 50vh;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.viewer-image {
  width: 100%;
  height: calc(100% - 40px);
  object-fit: contain;
  background-color: #f5f5f5;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 10;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.image-nav {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  background-color: #333;
  color: white;
}

.image-nav button {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 1rem;
}

.image-nav button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-counter {
  font-size: 0.9rem;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }
  
  .search-container {
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .search-input {
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .search-button,
  .clear-search-button {
    flex: 1;
    margin-left: 0;
    margin-right: 0.25rem;
  }

  .scrollable-content {
    margin-top: 160px; /* 调整顶部间距以适应移动设备 */
    height: calc(100vh - 160px);
  }

  .content-box {
    width: 95%;
  }

  .post-list {
    padding: 1rem;
  }
  
  .post-item {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .image-viewer-container {
    width: 90vw;
    height: 50vh;
  }
}
</style>