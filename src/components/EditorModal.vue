<template>
    <div class="modal-overlay" @click.self="$emit('close')">
        <div class="editor-modal">
            <!-- 固定头部 -->
            <div class="editor-header">
                <h2>{{ isEditing ? '编辑博客' : '写新博客' }}</h2>
                <button class="close-btn" @click="$emit('close')">&times;</button>
            </div>

            <!-- 可滚动内容区域 -->
            <div class="editor-body-scrollable">
                <div class="editor-body">
                    <div class="form-group">
                        <label>标题</label>
                        <input type="text" v-model="localPost.title" placeholder="请输入博客标题">
                    </div>

                    <div class="form-group">
                        <label>领域</label>
                        <div class="category-options">
                            <label v-for="category in categories" :key="category.value">
                                <input type="radio" v-model="localPost.category" :value="category.value"
                                    :checked="localPost.category === category.value">
                                <span class="category-tag">{{ category.label }}</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>内容</label>
                        <div class="textarea-container">
                            <textarea v-model="localPost.content" placeholder="写下你的博客内容..." rows="6" maxlength="200"
                                @input="handleContentInput"></textarea>
                            <div class="char-counter">
                                {{ localPost.content.length }}/200
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>上传图片</label>
                        <div class="upload-area" @click="triggerFileInput">
                            <div v-if="!localPost.images.length" class="upload-placeholder">
                                <span class="plus-icon">+</span>
                                <span>点击添加图片</span>
                            </div>
                            <div v-else class="image-previews">
                                <div class="image-preview-item" v-for="(img, index) in localPost.images" :key="index">
                                    <img :src="getImageUrl(img)" alt="预览图片">
                                    <button class="remove-btn" @click.stop="removeImage(index)">&times;</button>
                                </div>
                            </div>
                            <input type="file" multiple accept="image/*" @change="handleImageUpload" ref="imageInput"
                                class="file-input">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>可见性</label>
                        <div class="visibility-options">
                            <label @click="localPost.visibility = 0">
                                <input type="radio" v-model="localPost.visibility" :value="0">
                                <span class="visibility-tag public">公开</span>
                            </label>
                            <label @click="localPost.visibility = 1">
                                <input type="radio" v-model="localPost.visibility" :value="1">
                                <span class="visibility-tag private">私密</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 固定底部 -->
            <div class="editor-footer">
                <button class="cancel-btn" @click="$emit('close')">取消</button>
                <button class="save-btn" @click="handleSave" :disabled="isSaving">
                    {{ isSaving ? '发布中...' : '发布' }}
                </button>
            </div>
        </div>
        <!-- 发布加载遮罩 -->
        <div v-if="isSaving" class="publish-loading">
            <div class="loading-spinner"></div>
            <div class="loading-text">正在发布，请稍候...</div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { watch } from 'vue';
import { service, tokenManager } from '@/utils/axios';
const props = defineProps({
    post: {
        type: Object,
        required: true
    },
    isEditing: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['close', 'save'])
// 定义本地响应式状态
const localPost = ref({
    title: '',
    content: '',
    category: 'programming',
    images: [],
    visibility: 0
});

const categories = [
    { value: 'programming', label: '编程' },
    { value: 'sports', label: '运动' },
    { value: 'music', label: '音乐' },
    { value: 'cooking', label: '烹饪' },
    { value: 'photography', label: '摄影' },
    { value: 'gaming', label: '电竞' }
]


watch(
    () => props.post,
    (newPost) => {
        if (newPost) {
            localPost.value = {
                title: String(newPost.title || ''),
                content: String(newPost.content || ''),
                category: newPost.category || 'programming',
                images: newPost.images || [],
                visibility: newPost.visibility || 0,
            };
        }
    },
    { immediate: true } // 初始化时立即执行一次
);

const imageInput = ref(null)
const isSaving = ref(false)

// 图片处理函数
function handleImageUpload(event) {
    const files = event.target.files
    if (!files || files.length === 0) return

    // 直接添加File对象到images数组
    for (let i = 0; i < files.length; i++) {
        localPost.value.images.push(files[i])
    }
    imageInput.value.value = '' // 清空文件输入
}

function getImageUrl(img) {
    if (img instanceof File) {
        return URL.createObjectURL(img)
    }
    return img // 如果是字符串URL直接返回
}


function formatDateTime(date) {
    const pad = num => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}


// 发布处理函数
async function handleSave() {
    isSaving.value = true;
    try {
        // 调试：打印原始数据
        console.log('原始数据:', {
            title: localPost.value.title,
            content: localPost.value.content,
            category: localPost.value.category,
            visibility: localPost.value.visibility,
            images: localPost.value.images,
            username: localStorage.getItem('username')
        });

        const formData = new FormData();

        // 添加所有原始字段
        formData.append('title', localPost.value.title);
        formData.append('content', localPost.value.content || '');
        formData.append('category', localPost.value.category);
        formData.append('visibility', localPost.value.visibility || 0);
        formData.append('username', localStorage.getItem('username'));
        
        // 添加发布时间（当前时间）
        const create_time = formatDateTime(new Date());
        formData.append('create_time', create_time);
        console.log(formData)
        // 添加图片文件（保持原字段名'images'）
        localPost.value.images.forEach((img) => {
            if (img instanceof File) {
                formData.append('media_files', img, img.name);
            }
        });

        // 调试：验证FormData内容
        console.log('即将提交的FormData:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value instanceof File ? 
                `[File] ${value.name} (${value.size} bytes)` : 
                value);
        }

        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('Missing auth token');

        // 发送请求
        const response = await service.post('/blog/save/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            transformRequest: [data => data] // 禁止axios修改FormData
        });
        
        console.log('响应数据:', response.data);
        if(response.data.status === 'success') {
            alert('发布成功！');
            console.log('更新后的数据:', response.data.data)
            emit('save', response.data.data); // 传递整个更新后的数组
            emit('close');
        }
    } catch (error) {
        console.error('完整错误信息:', {
            message: error.message,
            response: error.response?.data,
            config: error.config
        });
        throw error;
    }finally {
        isSaving.value = false;
    }
}




function triggerFileInput() {
    imageInput.value.click()
}

// 处理内容输入，可以用于字数限制等功能
function handleContentInput() {
    // 这里可以添加字数限制逻辑，但目前模板中已经有maxlength="200"
    // 所以这个函数可以为空，或者添加其他内容输入相关的逻辑
}

// 移除图片函数
function removeImage(index) {
    localPost.value.images.splice(index, 1);
}

// 辅助函数：base64转Blob
function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 20px;
    box-sizing: border-box;
}

.editor-modal {
    background-color: #f8fafc;
    border-radius: 16px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    position: relative;
    animation: fadeIn 0.3s ease;
    border: 1px solid #e2e8f0;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.editor-header {
    padding: 20px;
    background-color: #ffffff;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
}

.editor-header h2 {
    margin: 0;
    color: #38b2ac;
    font-size: 1.5rem;
    font-weight: 600;
}

.editor-body-scrollable {
    overflow-y: auto;
    flex-grow: 1;
    padding: 0 20px;
    background-color: #ffffff;
    margin: 0 10px;
}

.editor-body {
    padding: 20px 0;
}

.editor-footer {
    padding: 16px 20px;
    background-color: #ffffff;
    border-radius: 0 0 16px 16px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
}

.close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #94a3b8;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
}

.close-btn:hover {
    background-color: #f1f5f9;
    color: #64748b;
}

.editor-body {
    padding: 20px;
    background-color: #ffffff;
    margin: 10px;
    border-radius: 12px;
}

.form-group {
    margin-bottom: 24px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #475569;
    font-size: 0.95rem;
}

.form-group input[type="text"],
.form-group textarea {
    width: 90%;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-family: inherit;
    background-color: #f8fafc;
    transition: all 0.2s;
}

.form-group input[type="text"]:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #38b2ac;
    box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
    background-color: #ffffff;
}

.form-group textarea {
    min-height: 150px;
    resize: vertical;
}

.textarea-container {
    position: relative;
}

.char-counter {
    position: absolute;
    right: 25px;
    bottom: 10px;
    font-size: 0.8rem;
    color: #64748b;
    background-color: rgba(255, 255, 255, 0.7);
    padding: 2px 6px;
    border-radius: 4px;
}

textarea {
    padding-bottom: 30px;
    /* 为计数器留出空间 */
    width: 100%;
}

/* 当接近字数限制时的样式 */
.char-counter.warning {
    color: #dc2626;
}

.file-input {
    display: none;
}

.upload-area {
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background-color: #f8fafc;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.upload-area:hover {
    border-color: #38b2ac;
    background-color: #f0fdfa;
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #94a3b8;
}

.plus-icon {
    font-size: 24px;
    margin-bottom: 8px;
    color: #38b2ac;
}

.image-previews {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    width: 100%;
}

.image-preview-item {
    position: relative;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.remove-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: rgba(239, 68, 68, 0.8);
    color: white;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.remove-btn:hover {
    background-color: rgba(239, 68, 68, 1);
}

.category-options,
.visibility-options {
    display: flex;
    gap: 16px;
    margin-top: 8px;
}

.category-options label,
.visibility-options label {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.category-options input[type="radio"],
.visibility-options input[type="radio"] {
    margin-right: 8px;
}

.category-tag {
    padding: 6px 12px;
    border-radius: 20px;
    background-color: #e2e8f0;
    color: #475569;
    font-size: 0.85rem;
    transition: all 0.2s;
}

.category-options input[type="radio"]:checked+.category-tag {
    background-color: #38b2ac;
    color: white;
}

.visibility-tag {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 14px;
}

.visibility-tag.public {
    background-color: #e6f7ff;
    color: #1890ff;
}

.visibility-tag.private {
    background-color: #fff2f0;
    color: #ff4d4f;
}

.upload-progress {
    margin-top: 10px;
    background-color: #e2e8f0;
    border-radius: 8px;
    height: 24px;
    overflow: hidden;
    position: relative;
}

.progress-bar {
    height: 100%;
    background-color: #38b2ac;
    transition: width 0.3s;
}

.upload-progress span {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.8rem;
    font-weight: 500;
}

.editor-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    background-color: #ffffff;
    border-radius: 0 0 16px 16px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.cancel-btn,
.save-btn {
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.cancel-btn {
    background-color: #f1f5f9;
    color: #64748b;
}

.cancel-btn:hover {
    background-color: #e2e8f0;
}

.save-btn {
    background-color: #38b2ac;
    color: white;
}

.save-btn:hover {
    background-color: #2c7a7b;
}

.publish-loading {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #38b2ac;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
}

.loading-text {
    color: white;
    font-size: 1.2rem;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* 禁用按钮样式 */
.save-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .editor-modal {
        max-height: 95vh;
    }

    .editor-body-scrollable {
        padding: 0 15px;
    }
}

@media (max-width: 480px) {
    .editor-modal {
        max-height: 98vh;
    }

    .editor-body-scrollable {
        padding: 0 10px;
    }
}
</style>