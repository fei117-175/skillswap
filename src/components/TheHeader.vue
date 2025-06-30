<template>
  <div class="header">
    <div class="header-content">
      <h1 class="logo">SKILLSWAP</h1>
    </div>
</div>
</template>

<script>

</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: white;
  box-shadow: 0 1px 5px rgba(56, 226, 58, 0.422); /* 更浅的阴影 */
  border-bottom: 1px solid #eee; /* 更细的分割线 */
  height: 50px; /* 固定高度（原约60-70px） */
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%; /* 继承父级高度 */
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.logo {
  font-size: 1.25rem; /* 缩小LOGO */
  font-weight: 700;
  color: #42b983;
  cursor: pointer;
  margin-left: 1rem; /* 减少左边距 */
}


/* 移动端适配 */
@media (max-width: 768px) {
  .header {
    height: 45px; /* 移动端更紧凑 */
  }
  .logo {
    font-size: 1.1rem;
    margin-left: 0.5rem;
  }
  .link {
    font-size: 0.85rem;
  }
}
</style>