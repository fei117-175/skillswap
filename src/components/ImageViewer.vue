<template>
    <div class="image-viewer-overlay" @click.self="close">
        <div class="image-viewer-container">
            <button class="close-btn" @click="close">&times;</button>
            <div class="image-viewer-content">
                <img :src="getImageUrl(images[currentIndex])" alt="博客图片" :style="imageStyle" @load="handleImageLoad">
            </div>
            <div class="image-viewer-footer">
                <span class="image-counter">{{ currentIndex + 1 }}/{{ images.length }}</span>
                <button class="download-btn" @click.stop="downloadImage">
                    <i class="icon-download">↓</i> 保存图片
                </button>
            </div>
        </div>

        <button class="nav-btn prev-btn" @click.stop="prev" :disabled="currentIndex === 0">
            &lt;
        </button>
        <button class="nav-btn next-btn" @click.stop="next" :disabled="currentIndex === images.length - 1">
            &gt;
        </button>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
    images: {
        type: Array,
        required: true
    },
    currentIndex: {
        type: Number,
        required: true
    }
})

const emit = defineEmits(['close', 'prev', 'next'])

const imageStyle = ref({
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
})

function close() {
    emit('close')
}

function prev() {
    emit('prev')
}

function next() {
    emit('next')
}

function getImageUrl(img) {
    if (img?.startsWith('http') || img?.startsWith('data:')) {
        return img
    }
    return img
}

function handleImageLoad(e) {
    const img = e.target
    const ratio = img.naturalWidth / img.naturalHeight

    if (ratio > 1) {
        // 宽图
        imageStyle.value = {
            width: '100%',
            height: 'auto',
            objectFit: 'contain'
        }
    } else {
        // 高图或方图
        imageStyle.value = {
            width: 'auto',
            height: '100%',
            objectFit: 'contain'
        }
    }
}

function downloadImage() {
    const link = document.createElement('a')
    link.href = getImageUrl(props.images[props.currentIndex])
    link.download = `blog-image-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
</script>

<style scoped>
.image-viewer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
}

.image-viewer-container {
    width: 100%;
    height: 100%;
    max-width: 100vw;
    max-height: 100vh;
    display: flex;
    flex-direction: column;
}

.image-viewer-content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}

.image-viewer-content img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.image-viewer-footer {
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
}

.image-counter {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
}

.download-btn {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.download-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
}

.nav-btn {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2001;
}

.nav-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
}

.nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.prev-btn {
    left: 20px;
}

.next-btn {
    right: 20px;
}

.close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 24px;
    cursor: pointer;
    z-index: 2002;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
    .image-viewer-content img {
        max-width: 90vw;
        max-height: 90vh;
    }

    .nav-btn {
        width: 40px;
        height: 40px;
        font-size: 20px;
    }
}
</style>