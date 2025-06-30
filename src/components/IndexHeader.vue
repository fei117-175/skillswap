<template>
    <div class="header-container">
        <!-- 图片切割容器 -->
        <div class="logo-container">
            <img src="/public/skillswapicon.png" alt="Logo" class="logo-image">
        </div>

        <!-- 导航菜单 -->
        <nav class="nav-menu">
            <router-link to="/index" class="nav-item">社区</router-link>
            <router-link to="/application" class="nav-item">我的申请</router-link>
            <router-link to="/skillsquare" class="nav-item">技能广场</router-link>
            <router-link to="/knowus" class="nav-item">了解我们</router-link>
        </nav>
    </div>
</template>

<script setup>
import router from '@/router';
// function routerPush(params) {
//     console.log('出发');
//     router.push({ name: "首页" });
// }
</script>

<style scoped>
.header-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 9vh;
    background-color: white;
    display: flex;
    align-items: center;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(13, 143, 61, 0.2);
}

/* 图片切割容器 */
.logo-container {
    width: 15vw;
    height: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 2px solid rgba(255, 255, 255, 0.3);
}

.logo-image {
    height: 160px;
    width: auto;
    object-fit: contain;
    transition: transform 0.3s;
}

.logo-image:hover {
    transform: scale(1.05);
}

/* 导航菜单 */
.nav-menu {
    display: flex;
    height: 100%;
    margin-left: 10vw;
}

.nav-item {
    color: black;
    text-decoration: none;
    font-weight: bold;
    font-size: 1.1rem;
    padding: 0 2vw;
    height: 100%;
    display: flex;
    align-items: center;
    position: relative;
}

.nav-item:hover {
    background-color: rgba(18, 156, 41, 0.385);
}

.nav-item::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 3px;
    background-color: white;
    transition: all 0.3s;
}

.nav-item:hover::after {
    width: 70%;
    left: 15%;
}
</style>