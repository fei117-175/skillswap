<template>
  <div class="media-viewer">
    <div class="media-container">
      <img v-if="currentMedia.media_type === 'image'" :src="currentMedia.file" class="media-content">
      <video v-else :src="currentMedia.file" controls autoplay class="media-content"></video>
    </div>
    <button class="close-btn" @click="$emit('close')">×</button>
    <button class="nav-btn prev" @click="prevMedia" v-if="mediaList.length > 1">‹</button>
    <button class="nav-btn next" @click="nextMedia" v-if="mediaList.length > 1">›</button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  mediaList: Array,
  initialIndex: Number
})

const emit = defineEmits(['close'])

const currentIndex = ref(props.initialIndex || 0)

const currentMedia = computed(() => props.mediaList[currentIndex.value])

const prevMedia = () => {
  currentIndex.value = (currentIndex.value - 1 + props.mediaList.length) % props.mediaList.length
}

const nextMedia = () => {
  currentIndex.value = (currentIndex.value + 1) % props.mediaList.length
}
</script>

<style scoped>
.media-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.media-container {
  max-width: 90%;
  max-height: 90%;
}

.media-content {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 30px;
  cursor: pointer;
}

.prev {
  left: 20px;
}

.next {
  right: 20px;
}
</style>