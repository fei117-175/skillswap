  <template>
    <div class="collection-page">
      <div class="header">
        <h1>我的收藏</h1>
        <div class="stats">
          <span>{{ blogs.length }} 篇收藏</span>
          <span>{{ lastUpdated }}</span>
        </div>
      </div>

      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else-if="blogs.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="#ccc">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <p>暂无收藏内容</p>
        <button @click="fetchBookmarks">刷新</button>
      </div>

      <div class="blog-list">
        <div class="blog-item" v-for="blog in blogs" :key="blog.id" @click="openBlog(blog.id)">
          <div class="blog-image" :style="{ backgroundImage: `url(${blog.image})` }">
            <span class="category-tag" :style="{ backgroundColor: categoryColors[blog.category] }">
              {{ categoryNames[blog.category] }}
            </span>
          </div>
          <div class="blog-content">
            <h3>{{ blog.title }}</h3>
            <p class="description">{{ blog.description }}</p>
            <div class="meta">
              <span class="author">{{ blog.author }}</span>
              <span class="date">{{ formatDate(blog.date) }}</span>
            </div>
          </div>
          <button class="favorite-btn" @click.stop="toggleFavorite(blog.id)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                :fill="blog.isFavorite ? '#ff4757' : 'none'" :stroke="blog.isFavorite ? '#ff4757' : '#ccc'"
                stroke-width="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { service } from '@/utils/axios';
import { useRouter, useRoute } from 'vue-router';
import { useCounterStore } from "@/stores/counter";
const router = useRouter()
const user = useCounterStore();
const blogs = ref([]);
const isLoading = ref(true);

// 分类颜色和名称映射
const categoryColors = {
  'programming': '#4b7bec',
  'sports': '#26de81',
  'cooking': '#fc5c65',
  'photography': '#a55eea',
  'music': '#fd9644',
  'gaming': '#2bcbba',
  '未分类': '#778ca3'
};

const categoryNames = {
  'programming': '编程',
  'sports': '运动',
  'cooking': '烹饪',
  'photography': '摄影',
  'music': '音乐',
  'gaming': '电竞'
};

// 获取用户收藏
const fetchBookmarks = async () => {
  try {
    isLoading.value = true;
    const res = await service.get('/blog/bookmarks/');
    if (res.data.status === 'success') {
      blogs.value = res.data.data.map(blog => ({
        ...blog,
        isFavorite: true // 确保收藏状态正确
      }));
      console.log(blogs.value)
    }
  } catch (error) {
    console.error('获取收藏失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 切换收藏状态
const toggleFavorite = async (id) => {
  try {
    const res = await service.post(`/blog/toggle_bookmark/${id}/`);
    if (res.data.status === 'success') {
      // 更新本地状态
      const index = blogs.value.findIndex(b => b.id === id);
      if (index !== -1) {
        if (!res.data.is_bookmarked) {
          // 取消收藏则从列表中移除
          blogs.value.splice(index, 1);
        } else {
          // 更新收藏状态
          blogs.value[index].isFavorite = res.data.is_bookmarked;
        }
      }
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    if (error.response?.status === 401) {
      alert('请先登录');
    }
  }
};

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 打开博客详情
const openBlog = (blogId) => {
  router.push({ name: 'blog-detail', params: { id: blogId } })
};

// 计算最后更新时间
const lastUpdated = computed(() => {
  if (blogs.value.length === 0) return '暂无收藏';
  const dates = blogs.value.map(blog => new Date(blog.date).getTime());
  const latest = new Date(Math.max(...dates));
  return `最后更新: ${latest.toLocaleDateString()}`;
});

onMounted(() => {
  if (user.loginUser) {
    fetchBookmarks();
  } else {
    alert('请先登录查看收藏');
  }
});
</script>

<style scoped>
.collection-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.header {
  margin-bottom: 2.5rem;
  padding-bottom: 1rem;
  margin-top: 6%;
  border-bottom: 1px solid #f0f0f0;
}

.header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.stats {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #888;
}

.blog-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.blog-item {
  display: flex;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  cursor: pointer;
}

.blog-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.blog-image {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
  position: relative;
}

.category-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.7rem;
  color: white;
  font-weight: 500;
}

.blog-content {
  flex: 1;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
}

.blog-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.description {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  margin-top: auto;
  font-size: 0.8rem;
  color: #999;
  display: flex;
  gap: 1rem;
}

.favorite-btn {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.favorite-btn:hover {
  background: rgba(255, 71, 87, 0.1);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #20d33e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #888;
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state button {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: #20d33e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .blog-item {
    flex-direction: column;
  }

  .blog-image {
    width: 100%;
    height: 160px;
  }

  .header h1 {
    font-size: 1.5rem;
  }
}
</style>