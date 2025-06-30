<template>
  <IndexHeader />
  <LoginPanel />
  <!-- <router-view v-slot="{ Component }">
    <transition name="slide-fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view> -->
    <router-view></router-view>
</template>

<script setup>
import LoginPanel from '@/components/LoginPanel.vue'
import IndexHeader from '@/components/IndexHeader.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
}

/* 路由切换动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>