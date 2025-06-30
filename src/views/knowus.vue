<template>
    <div class="about-container">
        <!-- 顶部品牌展示区 - 图片填满整个盒子 -->
        <div class="brand-hero">
            <div class="brand-logo-container">
                <img src="/skillswapicon.png" alt="SkillSwap Logo" class="full-size-logo">
            </div>
            <h1 class="brand-title">SkillSwap</h1>
            <p class="brand-tagline">交换技能 · 创造价值</p>
        </div>

        <!-- 其余部分保持不变 -->
        <div class="content-wrapper">
            <!-- 关于我们部分 -->
            <section class="about-section">
                <h2>关于我们</h2>
                <div class="about-content">
                    <p>SkillSwap 是一个创新的技能交换平台，致力于连接有不同专长的人们，通过技能交换实现互利共赢。</p>
                    <p>我们相信每个人都有独特的才能值得分享，通过交换技能，我们可以共同成长，创造更大的价值。</p>
                </div>
            </section>

            <!-- 我们的使命部分 -->
            <section class="mission-section">
                <h2>我们的使命</h2>
                <div class="mission-grid">
                    <div class="mission-card">
                        <div class="icon">💡</div>
                        <h3>激发潜能</h3>
                        <p>帮助每个人发现并发挥自己的独特才能</p>
                    </div>
                    <div class="mission-card">
                        <div class="icon">🤝</div>
                        <h3>建立连接</h3>
                        <p>搭建专业人才之间的桥梁</p>
                    </div>
                    <div class="mission-card">
                        <div class="icon">🚀</div>
                        <h3>促进成长</h3>
                        <p>通过技能交换实现共同进步</p>
                    </div>
                </div>
            </section>

            <!-- 联系方式部分 -->
            <section class="contact-section">
                <h2>联系我们</h2>
                <div class="contact-info">
                    <div class="contact-method">
                        <div class="contact-icon">📧</div>
                        <p>邮箱: contact@skillswap.com</p>
                    </div>
                    <div class="contact-method">
                        <div class="contact-icon">👤</div>
                        <p>联系人: GGBoon</p>
                    </div>
                    <div class="contact-method">
                        <div class="contact-icon">🌐</div>
                        <p>官网: www.skillswap.com</p>
                    </div>
                </div>
            </section>
        </div>

        <!-- 页脚 -->
        <footer class="page-footer">
            <p>© 2023 SkillSwap. 保留所有权利。</p>
        </footer>
    </div>
</template>

<script setup>
// 这里可以添加任何需要的逻辑
</script>

<style scoped>
/* 基础样式 */
:root {
    --primary-color: #4361ee;
    --secondary-color: #3f37c9;
    --accent-color: #4895ef;
    --text-color: #2b2d42;
    --light-color: #2fdf10c7;
    --dark-color: #212529;
}

.about-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: var(--text-color);
    max-width: 1200px;
    margin: 0 auto;
    margin-top: 8%;
    padding: 0 20px;
}

/* 品牌展示区样式 - 图片填满整个盒子 */
.brand-hero {
    text-align: center;
    padding: 0; /* 移除内边距，让图片可以真正填满 */
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    border-radius: 0 0 20px 20px;
    margin-bottom: 40px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden; /* 防止图片溢出 */
    height: 300px; /* 设置固定高度 */
}

.brand-logo-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.full-size-logo {
    width: 100%;
    height: 100%;
    object-fit: cover; /* 保持比例，填满容器 */
    opacity: 0.2; /* 降低不透明度作为背景 */
}

.brand-title {
    font-size: 3rem;
    margin: 0;
    font-weight: 700;
    letter-spacing: 1px;
    position: relative; /* 确保标题在图片上层 */
    z-index: 1;
    padding-top: 60px; /* 添加顶部内边距 */
    color:#1c9e08c8;
}

.brand-tagline {
    font-size: 1.2rem;
    opacity: 0.9;
    margin-top: 10px;
    position: relative; /* 确保标语在图片上层 */
    z-index: 1;
    padding-bottom: 40px; /* 添加底部内边距 */
    color:#1c9e08c8;
    font-weight: bolder;
}

/* 内容区样式 */
.content-wrapper {
    padding: 0 20px;
}

section {
    margin-bottom: 60px;
}

h2 {
    font-size: 2rem;
    color: var(--primary-color);
    margin-bottom: 30px;
    position: relative;
    padding-bottom: 10px;
}

h2::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 4px;
    background: var(--accent-color);
    border-radius: 2px;
}

.about-content p {
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 20px;
    max-width: 800px;
}

/* 使命部分样式 */
.mission-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-top: 40px;
}

.mission-card {
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s, box-shadow 0.3s;
}

.mission-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.mission-card .icon {
    font-size: 2.5rem;
    margin-bottom: 20px;
}

.mission-card h3 {
    color: var(--secondary-color);
    margin: 0 0 15px;
}

.mission-card p {
    color: var(--dark-color);
    line-height: 1.6;
}

/* 联系方式样式 */
.contact-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-top: 30px;
}

.contact-method {
    display: flex;
    align-items: center;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.contact-icon {
    font-size: 1.8rem;
    margin-right: 20px;
    color: var(--accent-color);
}

.contact-method p {
    margin: 0;
    font-size: 1.1rem;
}

/* 页脚样式 */
.page-footer {
    text-align: center;
    padding: 30px 0;
    margin-top: 60px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    color: var(--dark-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .brand-hero {
        height: 200px; /* 移动端减小高度 */
    }
    
    .brand-title {
        font-size: 2.2rem;
        padding-top: 40px;
    }
    
    .brand-tagline {
        font-size: 1rem;
        padding-bottom: 30px;
    }
    
    .mission-grid, .contact-info {
        grid-template-columns: 1fr;
    }
    
    h2 {
        font-size: 1.8rem;
    }
}
</style>