<template>
  <div class="weibo-style-container">
    <!-- 添加返回按钮 -->
    <button class="back-button" @click="goBack">
      <svg class="back-icon" viewBox="0 0 24 24">
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
      </svg>
      返回
    </button>
    <!-- 头部作者信息 -->
    <div class="blog-header">
      <div class="author-info">
        <img :src="blog.avatar || '/default-avatar.jpg'" class="author-avatar">
        <div class="author-meta">
          <span class="author-name">{{ blog.username || '未知用户' }}</span>
          <span class="post-time">{{ formatTime(blog.created_at) }}</span>
        </div>
      </div>
      <button class="follow-btn">关注</button>
    </div>

    <!-- 博客正文 -->
    <div class="blog-content">
      <p class="blog-text">{{ blog.content }}</p>

      <!-- 图片/视频展示 (微博九宫格样式) -->
      <div class="media-grid" v-if="blog.media?.length">
        <div v-for="(media, index) in blog.media" :key="index" class="media-item"
          :class="{ 'single-item': blog.media.length === 1 }" @click="openMediaViewer(index)">
          <img v-if="media.type === 'image'" :src="media.url" :alt="`图片${index + 1}`">
          <video v-else-if="media.type === 'video'" :poster="media.thumbnail" controls>
            <source :src="media.url" :type="`video/${media.url.split('.').pop()}`"> 
          </video>
        </div>
      </div>
    </div>

    <!-- 底部互动栏 -->
    <div class="blog-footer">
      <div class="action-bar">
        <button class="action-btn" @click="toggleLike()">
          <svg class="icon" :class="{ liked: blog.is_liked }">
            <use xlink:href="#icon-like"></use>
          </svg>
          <span>👍点赞{{ blog.likes_count || 0 }}</span>
        </button>

        <button class="action-btn" @click="toggleCommentBox">
          <svg class="icon">
            <use xlink:href="#icon-comment"></use>
          </svg>
          <span>📑评论{{ blog.comment_count || 0 }}</span>
        </button>

        <button class="action-btn" @click="toggleBookmark()">
          <svg class="icon" :class="{ bookmarked: blog.is_bookmarked }">
            <use xlink:href="#icon-bookmark"></use>
          </svg>
          <span>{{ blog.is_bookmarked ? '已收藏' : '收藏' }}</span>
        </button>

        <button class="action-btn">
          <svg class="icon">
            <use xlink:href="#icon-share"></use>
          </svg>
          <span>分享</span>
        </button>
      </div>

      <!-- 评论输入框 -->
      <div class="comment-box" v-if="showCommentBox">
        <textarea v-model="commentContent" placeholder="写下你的评论..." rows="3"></textarea>
        <div class="comment-toolbar">
          <button class="cancel-btn" @click="showCommentBox = false">取消</button>
          <button class="submit-btn" @click="submitComment">发布</button>
        </div>
      </div>

      <!-- 评论列表 -->
      <div class="comment-list" v-if="blog.comments?.length">
        <div v-for="comment in blog.comments" :key="comment.id" class="comment-item">
          <img :src="comment.avatar" class="comment-avatar">
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">{{ comment.username }}</span>
              <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 媒体查看器模态框 -->
    <MediaViewer v-if="showMediaViewer" :media-list="blog.media_files" :initial-index="currentMediaIndex"
      @close="showMediaViewer = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute ,useRouter } from 'vue-router'
import { service } from '@/utils/axios'
import MediaViewer from '@/components/MediaViewer.vue'
import { useCounterStore } from "@/stores/counter"; //pinia库

const user = useCounterStore();
const route = useRoute()
const router = useRouter()

const goBack = () => {
  router.go(-1) // 返回上一页
}
const blog = ref({
  title: '',
  content: '',
  author:{},
  media_files: [],
  comments: [],
  likes_count: 0,
  comment_count: 0,
  created_at: new Date()
})

const showCommentBox = ref(false)
const commentContent = ref('')
const showMediaViewer = ref(false)
const currentMediaIndex = ref(0)

// 获取博客详情
const fetchBlogDetail = async () => {
  try {
    const response = await service.get(`http://127.0.0.1:8000/blog/posts/${route.params.id}/`)
    console.log('完整响应:', response)
    console.log('comments 数据:', response.data.data.comments)
    
    if (response.data.status === 'success') {
      blog.value = response.data.data
    }
  } catch (error) {
    console.error('获取博客详情失败:', error)
  }
}

// 格式化时间 (示例: "3分钟前")
const formatTime = (dateString) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return '刚刚'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

// 互动功能
const toggleLike = async () => {
  if (!user.loginUser) {
    alert('请登录后再点赞')
    return
  }
  try {
    // 先更新UI状态
    blog.is_liked = !blog.is_liked
    blog.likes_count += blog.is_liked_count ? 1 : -1

    const res = await service.post(`http://127.0.0.1:8000/blog/toggle_like/${route.params.id}/`)

    if (res.data.status !== 'success') {
      // 如果请求失败，回滚UI状态
      blog.is_liked = !blog.is_liked
      blog.likes += blog.is_liked ? 1 : -1
      throw new Error('点赞操作失败')
    }

    console.log('点赞状态更新成功', res.data)
  } catch (error) {
    console.error('点赞操作出错:', error)
    alert('点赞操作失败，请重试')
  }
}

const toggleBookmark = async (postId) => {
  if (!user.loginUser) {
    alert('请登录后再收藏')
    return
  }

  try {
    //先更新UI状态
    const wasBookmarked = blog.is_bookmarked
    blog.is_bookmarked = !wasBookmarked

    const res = await service.post(`http://127.0.0.1:8000/blog/toggle_bookmark/${route.params.id}/`)

    if (res.data.status !== 'success') {
      // 如果请求失败，回滚UI状态
      blog.is_bookmarked = wasBookmarked
      throw new Error('收藏操作失败')
    }

    // 更新收藏状态
    blog.is_bookmarked = res.data.is_bookmarked
    console.log('收藏状态更新成功', res.data)
  } catch (error) {
    blog.is_bookmarked = wasBookmarked
    console.error('收藏操作出错:', error)
    alert('收藏操作失败，请重试')
  }
}

const toggleCommentBox = () => {
  showCommentBox.value = !showCommentBox.value
}

const submitComment = async () => {
  if (!commentContent.value.trim()) return

  try {
    const res = await service.post(`http://127.0.0.1:8000/blog/addcomment/${route.params.id}/`, {
      content: commentContent.value,
    })
    
    if (res.data.message === 'success') {
      // 确保 blog.comments 是数组
      if (!Array.isArray(blog.value.comments)) {
        blog.value.comments = []
      }
      
      // 添加新评论到列表
      blog.value.comments = [res.data.data, ...blog.value.comments]
      blog.value.comment_count += 1
      commentContent.value = ''
    }
  } catch (error) {
    console.error('添加评论失败:', error)
  }
}

// 打开媒体查看器
const openMediaViewer = (index) => {
  currentMediaIndex.value = index
  showMediaViewer.value = true
}


onMounted(() => {
  fetchBlogDetail()
})
</script>

<style scoped>
.weibo-style-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 新增返回按钮样式 */
.back-button {
  position: fixed;
  top: 80px;
  left: 20px;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  z-index: 100;
  transition: all 0.3s;
}

.back-button:hover {
  background-color: #f5f5f5;
  transform: translateX(-3px);
}

.back-icon {
  width: 18px;
  height: 18px;
  margin-right: 5px;
  fill: currentColor;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .back-button {
    top: 70px;
    left: 10px;
    padding: 6px 10px;
    font-size: 14px;
  }
}

.blog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  margin-top: 15%;
}

.author-info {
  display: flex;
  align-items: center;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.author-meta {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 3px;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.follow-btn {
  padding: 4px 12px;
  border: 1px solid #ff8200;
  color: #ff8200;
  border-radius: 15px;
  background: transparent;
  font-size: 14px;
  cursor: pointer;
}

.blog-content {
  margin-bottom: 15px;
}

.blog-text {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 15px;
  white-space: pre-wrap;
  word-break: break-word;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  margin-top: 10px;
}

.media-item {
  position: relative;
  padding-top: 100%;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.media-item.single-item {
  padding-top: 50%;
  grid-column: span 3;
}

.media-item img,
.media-item video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blog-footer {
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
}

.action-bar {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;
}

.action-btn {
  display: flex;
  align-items: center;
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
}

.action-btn .icon {
  width: 18px;
  height: 18px;
  margin-right: 5px;
  fill: currentColor;
}

.action-btn:hover {
  color: #ff8200;
}

.icon.liked {
  fill: #ff2442;
}

.icon.bookmarked {
  fill: #ff8200;
}

.comment-box {
  margin-bottom: 15px;
}

.comment-box textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  resize: none;
  margin-bottom: 10px;
}

.comment-toolbar {
  display: flex;
  justify-content: flex-end;
}

.cancel-btn,
.submit-btn {
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  margin-right: 10px;
  background: transparent;
  border: 1px solid #ccc;
}

.submit-btn {
  background: #ff8200;
  color: white;
  border: none;
}

.comment-list {
  margin-top: 15px;
}

.comment-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.comment-header {
  margin-bottom: 5px;
}

.comment-author {
  font-weight: bold;
  font-size: 14px;
  margin-right: 8px;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

@media (max-width: 640px) {
  .weibo-style-container {
    border-radius: 0;
    box-shadow: none;
  }

  .media-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .media-item.single-item {
    grid-column: span 2;
  }
}
</style>