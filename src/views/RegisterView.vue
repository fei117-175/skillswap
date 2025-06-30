<template>
    <div class="register-container">
        <!-- 头部 - 修改为全宽 -->
        <header class="register-header">
            <div class="header-content">
                <img src="/skillswapicon.png" class="logo" alt="SkillSwap">
                <h1>加入SkillSwap社区</h1>
            </div>
        </header>

        <!-- 步骤指示器 - 修改为75%宽度 -->
        <div class="step-container">
            <div class="step-indicator">
                <div v-for="(step, index) in steps" :key="step.id"
                    :class="['step', { active: currentStep === index, completed: currentStep > index }]">
                    <div class="step-number">{{ index + 1 }}</div>
                    <div class="step-label">{{ step.label }}</div>
                </div>
                <div class="progress-bar" :style="progressStyle"></div>
            </div>
        </div>

        <!-- 表单区域 -->
        <div class="form-container">
            <!-- 第一步：基础信息 -->
            <form v-if="currentStep === 0" @submit.prevent="nextStep" class="register-form">
                <div class="form-group">
                    <label>用户名</label>
                    <input v-model="formData.username" type="text" required minlength="4" maxlength="16">
                    <span class="hint">4-16个字符，支持字母、数字和下划线</span>
                </div>

                <div class="form-group">
                    <label>密码</label>
                    <input v-model="formData.password" type="password" required minlength="8">
                    <password-strength-meter :password="formData.password" />
                </div>

                <div class="form-group">
                    <label>确认密码</label>
                    <input v-model="formData.confirmPassword" type="password" required>
                </div>

                <button type="submit" class="next-btn">下一步</button>
            </form>

            <!-- 第二步：选择领域 -->
            <div v-else-if="currentStep === 1" class="skill-selection">
                <h3>选择你感兴趣的领域（最多3个）</h3>
                <div class="skill-tags">
                    <button v-for="skill in skillOptions" :key="skill.id"
                        :class="['skill-tag', { selected: formData.skills.includes(skill.name) }]"
                        @click="toggleSkill(skill.name)"
                        :disabled="formData.skills.length >= 3 && !formData.skills.includes(skill.name)">
                        {{ skill.name }}
                    </button>
                </div>
                <button class="skip-btn" @click="skipstep">跳过此步骤</button>
                <div class="form-actions">
                    <button @click="prevStep" class="back-btn">上一步</button>
                    <button @click="nextStep" class="next-btn">下一步</button>
                </div>
            </div>

            <!-- 第三步：绑定联系方式 -->
            <form v-else-if="currentStep === 2" @submit.prevent="nextStep" class="contact-form">
                <div class="form-group">
                    <label>邮箱</label>
                    <input v-model="formData.email" type="email" required>
                </div>

                <div class="form-group">
                    <label>手机号</label>
                    <div class="phone-input">
                        <select v-model="formData.phonePrefix" class="prefix-select">
                            <option value="+86">+86</option>
                            <option value="+1">+1</option>
                            <option value="+81">+81</option>
                        </select>
                        <input v-model="formData.phone" type="tel" required>
                    </div>
                </div>

                <div class="form-actions">
                    <button @click="prevStep" class="back-btn">上一步</button>
                    <button type="submit" class="next-btn">下一步</button>
                </div>
            </form>

            <!-- 第四步：确认信息 -->
            <div v-else class="confirmation">
                <h3>请确认你的注册信息</h3>
                <div class="info-card">
                    <div class="info-row">
                        <span class="label">用户名：</span>
                        <span class="labletext">{{ formData.username }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">领域：</span>
                        <div class="selected-skills">
                            <!-- 直接显示技能名称，不再使用getSkillName -->
                            <span v-for="(skillName, index) in formData.skills" :key="index">
                                {{ skillName }}
                            </span>
                        </div>
                    </div>
                    <div class="info-row">
                        <span class="label">邮箱：</span>
                        <span class="labletext">{{ formData.email }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">手机号：</span>
                        <span class="labletext">{{ formData.phonePrefix }} {{ formData.phone }}</span>
                    </div>
                </div>
                <div class="form-actions">
                    <button @click="prevStep" class="back-btn">上一步</button>
                    <button @click="submitForm" class="submit-btn">提交注册</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// 步骤控制
const currentStep = ref(0)
const steps = [
    { id: 'info', label: '填写信息' },
    { id: 'skills', label: '选择领域' },
    { id: 'contact', label: '绑定联系' },
    { id: 'confirm', label: '确认提交' }
]

const progressStyle = computed(() => ({
    width: `${(currentStep.value / (steps.length - 1)) * 100}%`
}))

const nextStep = () => {
    if (validateStep(currentStep.value)) {
        currentStep.value++
    }
}

const prevStep = () => {
    currentStep.value--
}

const skipstep = () => {
    currentStep.value++
}

// 表单数据
const formData = ref({
    username: '',
    password: '',
    confirmPassword: '',
    skills: [], // 现在这里存储的是技能名称
    email: '',
    phonePrefix: '+86',
    phone: ''
})

// 技能选项
const skillOptions = ref([
    { id: 1, name: '编程开发' },
    { id: 2, name: '设计创作' },
    { id: 3, name: '语言学习' },
    { id: 4, name: '体育运动' },
    { id: 5, name: '音乐艺术' },
    { id: 6, name: '烹饪烘焙' },
    { id: 7, name: '摄影摄像' },
    { id: 8, name: '手工DIY' }
])

const toggleSkill = (skillName) => {
    const index = formData.value.skills.indexOf(skillName)
    if (index >= 0) {
        formData.value.skills.splice(index, 1)
    } else {
        formData.value.skills.push(skillName)
    }
}



// 表单验证
const validateStep = (step) => {
    switch (step) {
        case 0:
            if (formData.value.password !== formData.value.confirmPassword) {
                alert('两次输入的密码不一致')
                return false
            }
            return true
        case 1:
            // 现在这一步是可选的，可以跳过
            return true
        case 2:
            // 邮箱和手机号验证
            return true
        default:
            return true
    }
}

// 提交注册
const submitForm = async () => {
    try {
        console.log('提交的数据:', formData.value)
        const response = await axios.post('http://127.0.0.1:8000/register/',formData.value,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )
        if (response.data.success) {
            alert(response.data.message || '注册成功！')
            router.push('/index?from=register')
        } else {
            alert(response.data.message || '注册失败')
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message ||
            error.message ||
            '注册失败，请重试'
        alert(errorMsg)
    }
}
</script>

<style scoped>
.register-container {
    max-width: 100%;
    margin: 0 auto;
    padding: 0;
    font-family: 'Arial', sans-serif;
}

/* 修改头部样式 */
.register-header {
    width: 100%;
    margin-top: 3%;
    height: 13vh;
    /* 13%的屏幕高度 */
    background-color: white;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 0 10%;
}

.header-content {
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
}

.register-header .logo {
    height: 80px;
    margin-right: 1.5rem;
}

.register-header h1 {
    color: #333;
    font-size: 1.8rem;
    margin: 0;
}

/* 修改步骤指示器容器 */
.step-container {
    width: 100%;
    display: flex;
    justify-content: center;
    margin: 2rem 0;
}

.step-indicator {
    width: 75%;
    /* 75%的页面宽度 */
    max-width: 900px;
    display: flex;
    justify-content: space-between;
    position: relative;
    margin-bottom: 3rem;
}

/* 其余样式保持不变 */
.step-indicator::before {
    content: '';
    position: absolute;
    top: 15px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #e0e0e0;
    z-index: 1;
}

.progress-bar {
    position: absolute;
    top: 15px;
    left: 0;
    height: 2px;
    background-color: #20d33e;
    z-index: 2;
    transition: width 0.3s ease;
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 3;
}

.step-number {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: #e0e0e0;
    color: #999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 0.5rem;
    transition: all 0.3s;
}

.step.active .step-number {
    background-color: #20d33e;
    color: white;
}

.step.completed .step-number {
    background-color: #1aad32;
    color: white;
}

.step-label {
    color: #999;
    font-size: 0.9rem;
}

.step.active .step-label {
    color: #333;
    font-weight: bold;
}

/* 表单容器样式调整 */
/* 表单容器样式调整 */
.form-container {
    width: 40%;
    max-width: 900px;
    margin-left: 27%;
    margin-top: -3%;
    background-color: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 10px rgba(7, 135, 3, 0.418);
}

/* 表单组样式调整 */
.register-form,
.contact-form {
    display: flex;
    flex-direction: column;
    align-items: center;
    /* 使表单内容居中 */
}

.form-group {
    margin-bottom: 1.5rem;
    width: 100%;
    /* 使表单组占满容器宽度 */
    display: flex;
    flex-direction: column;
    align-items: center;
    /* 使表单元素居中 */
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #555;
    font-size: larger;
    margin-right: 5%;
    font-weight: bold;
    width: 60%;
}

.form-group input {
    width: 60%;
    /* 调整输入框宽度 */
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;

}

.hint {
    font-size: smaller;
    color: #55555594;
    margin-left: 25%;
}

/* 下一步按钮调整到右侧 */
.register-form>button[type="submit"] {
    align-self: flex-end;
    /* 将按钮移到右侧 */
    margin-right: 10%;
    /* 与输入框右对齐 */
    margin-top: 1rem;
}

/* 技能选择区域调整 */
.skill-selection {
    width: 100%;
}

.skill-selection h3 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #333;
    font-size: 1.2rem;
}

.skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    justify-content: center;
    margin-bottom: 1.5rem;
}

.skill-tag {
    padding: 0.6rem 1.2rem;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    background-color: #f8f8f8;
    color: #555;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
}

.skill-tag:hover {
    background-color: #f0f0f0;
    transform: translateY(-2px);
}

.skill-tag.selected {
    background-color: #a8e6b3;
    /* 浅绿色 */
    color: #1a5632;
    border-color: #a8e6b3;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(168, 230, 179, 0.3);
}

.skill-tag:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #f8f8f8;
    color: #bbb;
}

.skip-btn {
    display: block;
    margin: 0 auto 1.5rem;
    background: none;
    border: none;
    color: #888;
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.9rem;
    transition: color 0.2s;
}

.skip-btn:hover {
    color: #20d33e;
}


/* 表单操作按钮组调整 */
.form-actions {
    display: flex;
    justify-content: flex-end;
    /* 将按钮组移到右侧 */
    gap: 1rem;
    margin-top: 2rem;
    width: 100%;
    padding-right: 10%;
    /* 与输入框右对齐 */
}

/* 手机号输入调整 */
.phone-input {
    display: flex;
    justify-content: center;
    width: 68%;
}

.prefix-select {
    width: 20%;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px 0 0 4px;
    border-right: none;
}

.phone-input input {
    width: 70%;
    border-radius: 0 4px 4px 0;
}

/* 确认信息卡片调整 */
.info-card {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    width: 80%;
    margin-left: auto;
    margin-right: auto;
}

.info-row {
    display: flex;
    margin-bottom: 1rem;
    /* justify-content: center; */
    /* 信息行居中 */
}

.info-row .label {
    font-weight: bold;
    width: 80px;
    /* 固定宽度确保对齐效果 */
    min-width: 80px;
    /* 最小宽度 */
    text-align: justify;
    /* 标准两端对齐 */
    text-align-last: justify;
    /* 最后一行两端对齐 */
    color: #555;
    margin-right: 1rem;
    display: inline-block;
    /* 需要设置为块级元素才能生效 */
}

.labletext {
    margin-top: 1%;
}

.selected-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.selected-skills span {
    background-color: #e8f5e9;
    color: #1aad32;
    padding: 0.3rem 0.8rem;
    border-radius: 12px;
    font-size: 0.9rem;
}

/* 按钮样式 */
.form-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
}

button {
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s;
}

.next-btn {
    background-color: #20d33e;
    color: white;
}

.next-btn:hover {
    background-color: #1aad32;
}

.back-btn {
    background-color: #f0f0f0;
    color: #555;
}

.back-btn:hover {
    background-color: #e0e0e0;
}

.submit-btn {
    background-color: #20d33e;
    color: white;
    padding: 0.8rem 2.5rem;
}

.submit-btn:hover {
    background-color: #1aad32;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 密码强度指示器组件 */
.password-strength-meter {
    height: 4px;
    background-color: #eee;
    margin-top: 0.5rem;
    border-radius: 2px;
    overflow: hidden;
}

.password-strength-meter::after {
    content: '';
    display: block;
    height: 100%;
    width: 0%;
    background-color: #ff5722;
    transition: width 0.3s;
}

.password-strength-meter[data-strength="1"]::after {
    width: 25%;
    background-color: #ff5722;
}

.password-strength-meter[data-strength="2"]::after {
    width: 50%;
    background-color: #ff9800;
}

.password-strength-meter[data-strength="3"]::after {
    width: 75%;
    background-color: #4caf50;
}

.password-strength-meter[data-strength="4"]::after {
    width: 100%;
    background-color: #20d33e;
}
</style>