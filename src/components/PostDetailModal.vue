<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="post-modal">
      <!-- 固定在右上角的关闭按钮 -->
      <button class="close-btn" @click="$emit('close')">&times;</button>
      
      <div class="modal-content">
        <h2>{{ post.title }}</h2>
        
        <div class="post-meta">
          <span class="post-date">{{ formatDate(post.date) }}</span>
          <span class="visibility-tag" :class="post.visibility === 0 ? 'public' : 'private'">
            {{ post.visibility === 0 ? '公开' : '私密' }}
          </span>
        </div>
        
        <div class="post-images" v-if="post.images?.length > 0">
          <div class="image-grid" :class="`grid-${Math.min(post.images.length, 9)}`">
            <div 
              class="image-item" 
              v-for="(img, index) in post.images.slice(0, 9)" 
              :key="index"
              @click="$emit('view-image', index)"
            >
              <img :src="getImageUrl(img)" alt="博客图片">
              <div 
                class="image-mask" 
                v-if="post.images.length > 1 && index === 8 && post.images.length > 9"
              >
                +{{ post.images.length - 9 }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="post-content">
          {{ post.content }}
        </div>

        <!-- 评论区域 -->
        <div class="comments-section">
          <h3 class="comments-title">评论 ({{ post.comments.length }})</h3>
          
          <!-- 评论列表 -->
          <div class="comments-list">
            <div 
              v-for="(comment, index) in post.comments" 
              :key="index" 
              class="comment-item"
            >
              <div class="comment-header">
                <span class="comment-author">{{ comment.author }}</span>
                <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
            </div>
            
            <div v-if="comments.length === 0" class="no-comments">
              暂无评论
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  post: {
    type: Object,
    required: true
  },
  comments: {
    type: Array,
    default: () => []
  }
})


defineEmits(['close', 'view-image'])

function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN')
}

function formatTime(time) {
  const now = new Date()
  const commentTime = new Date(time)
  const diffInSeconds = Math.floor((now - commentTime) / 1000)
  
  if (diffInSeconds < 60) {
    return '刚刚'
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分钟前`
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}小时前`
  } else if (diffInSeconds < 2592000) {
    return `${Math.floor(diffInSeconds / 86400)}天前`
  } else {
    return commentTime.toLocaleDateString('zh-CN')
  }
}

function getImageUrl(img) {
  if (img?.startsWith('http') || img?.startsWith('data:')) {
    return img
  }
  return img
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
}

.post-modal {
  background-color: white;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  padding: 20px;
}

.close-btn {
  position: sticky;
  top: 15px;
  right: 15px;
  float: right;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #888;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  z-index: 10;
  margin-left: auto;
  margin-bottom: -30px;
}

.close-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

.post-meta {
  display: flex;
  gap: 15px;
  margin: 10px 20px;
  color: #888;
  font-size: 14px;
}

.post-content {
  white-space: pre-line;
  line-height: 1.6;
  color: #333;
  margin: 20px;
}

/* 图片网格布局 */
.image-grid {
  display: grid;
  gap: 5px;
  margin: 15px 20px;
}

.grid-1 {
  grid-template-columns: 1fr;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3,
.grid-4 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-5,
.grid-6 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-7,
.grid-8,
.grid-9 {
  grid-template-columns: repeat(3, 1fr);
}

.image-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1/1;
  overflow: hidden;
  cursor: pointer;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.image-item:hover img {
  transform: scale(1.05);
}

.image-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
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

/* 评论区域样式 */
/* 评论区域样式 */
.comments-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.comments-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
}

.comments-list {
  margin-top: 15px;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: bold;
  color: #2E7D32;
}

.comment-time {
  color: #888;
  font-size: 12px;
}

.comment-content {
  color: #333;
  line-height: 1.5;
  white-space: pre-line;
}

.no-comments {
  color: #888;
  text-align: center;
  padding: 20px 0;
}
</style>