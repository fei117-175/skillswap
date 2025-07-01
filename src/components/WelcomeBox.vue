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
  width: clamp(280px, 80vw, 400px);
  /* 增大最小宽度，更适合移动端 */
  aspect-ratio: 1/1;
  /* 调整为1:1.2比例，给内容更多空间 */
  background: rgba(255, 255, 255, 0.492);
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(49, 212, 109, 0.434);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  /* 使用space-around均匀分布空间 */
  align-items: center;
  text-align: center;
  position: relative;
  margin: 0 auto;
  /* 居中显示 */
}

.welcome-text {
  font-size: clamp(1rem, 3vw, 1.5rem);
  /* 增大vw比例，手机端更清晰 */
  line-height: 1.5;
  margin-bottom: 0.5rem;
  /* 减小间距 */
  font-weight: bolder;
}

.brand {
  color: #42b983;
  font-size: clamp(1.2rem, 5vw, 1.8rem);
  /* 响应式品牌文字 */
  font-weight: bold;
  margin: 0 0.2em;
}

.enter-button {
  position: absolute;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 0.6rem 1.5rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: clamp(0.9rem, 3.5vw, 1.1rem);
  /* 响应式按钮文字 */
  transition: all 0.3s;
}

.enter-button:hover {
  background-color: #3aa876;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.imgbox {
  width: 90%;
  /* 稍微缩小图片宽度 */
  height: 30%;
  /* 调整图片高度比例 */
  object-fit: contain;
  /* 使用contain保持完整比例 */
  border-radius: 8px;
  /* 减小圆角 */
  margin-bottom: 0.5rem;
}

/* 超小屏幕适配 (如iPhone 5/SE) */
@media (max-width: 320px) {
  .welcome-box {
    width: 85vw;
    aspect-ratio: 1/1.3;
    padding: 1rem;
  }
  
  .welcome-text {
    font-size: 0.9rem;
    line-height: 1.3;
  }
  
  .enter-button {
    padding: 0.5rem 1.2rem;
    bottom: 1rem;
    right: 1rem;
  }
}

/* 中等屏幕适配 */
@media (min-width: 769px) {
  .welcome-box {
    padding: 2rem;
  }
  
  .enter-button {
    bottom: 2rem;
    right: 2rem;
  }
}
</style>