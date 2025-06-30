<template>
  <!-- 1. 纯黑底层 -->
  <!-- <div class="black-base-layer"></div> -->
  
  <!-- 2. 模糊蒙版层 -->
  <div class="blur-mask-layer"></div>
  
  <!-- 3. 内容层 -->
  <div class="content-layer">
    <main class="main-content">
      <WelcomeBox />
    </main>
  </div>
</template>

<script setup>
import WelcomeBox from '@/components/WelcomeBox.vue'
</script>

<style scoped>
/* 1. 纯黑底层（无模糊） */
.black-base-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000; /* 纯黑色 */
  z-index: -2; /* 最底层 */
}

/* 2. 模糊蒙版层 */
.blur-mask-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(253, 251, 251, 0.179); /* 60%透明度黑 */
  backdrop-filter: blur(3px); /* 轻微模糊 */
  z-index: -1; /* 介于底层和内容层之间 */
}

/* 3. 内容层 */
.content-layer {
  position: relative;
  z-index: 1;
}

/* 全局样式 */
body {
  margin: 0;
  font-family: 'Arial', sans-serif;
  padding-top: 50px;
}

.main-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 50px);
  padding: 2rem;
}
</style>