<template>
  <div class="welcome-box">
    <img class="imgbox" src="/public/skillswapicon.png">
    <p class="welcome-text">
      欢迎!来到<span class="brand">SKILLSWAP</span>社区
    </p>
    <p class="welcome-text">进入社区看看吧！</p>
    <button class="enter-button" @click="navigateToHome">ENTER</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateToHome = () => {
  router.push({ name: '首页'})
}
</script>

<style scoped>
.welcome-box {
  width: clamp(200px, 30vw, 400px);
  /* 响应式宽度 */
  aspect-ratio: 1/1;
  /* 保持1:1正方形 */
  background: rgba(255, 255, 255, 0.492);
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(49, 212, 109, 0.434);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;
}

.welcome-text {
  font-size: clamp(1rem, 3vw, 1.5rem);
  line-height: 1.6;
  margin-bottom: 2rem;
  font-weight: bolder;
}

.brand {
  color: #42b983;
  /* 与头部组件一致的品牌色 */
  font-size: 1.5em;
  /* 比正文大50% */
  font-weight: bold;
  margin: 0 0.2em;
}

.enter-button {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  padding: 0.6rem 1.5rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.enter-button:hover {
  background-color: #3aa876;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .welcome-box {
    padding: 1.5rem;
  }

  .enter-button {
    bottom: 1.5rem;
    right: 1.5rem;
  }
}

.imgbox {
  width: 100%;
  height: 40%;
  /* 图片占组件高度的40% */
  object-fit: cover;
  /* 保持比例填充 */
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
</style>