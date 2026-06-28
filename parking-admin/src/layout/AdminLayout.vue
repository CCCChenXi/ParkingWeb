<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import SideMenu from './SideMenu.vue'

const router = useRouter()

function handleLogout() {
  ElMessageBox.confirm('确认退出登录？', '提示', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    .then(() => {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      router.push('/login')
    })
    .catch(() => {})
}
</script>

<template>
  <div class="admin-layout">
    <SideMenu />
    <div class="main-area">
      <div class="top-bar">
        <div class="top-bar-title">智能停车管理系统</div>
        <div class="top-bar-actions">
          <el-button text @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </div>
      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.top-bar-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.content-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f0f2f5;
}
</style>
