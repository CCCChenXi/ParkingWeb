<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const menus = [
  { path: '/dashboard', label: '仪表盘', icon: 'DataAnalysis' },
  { path: '/parking-lots', label: '停车场管理', icon: 'OfficeBuilding' },
  { path: '/parking-spots', label: '车位管理', icon: 'Grid' },
  { path: '/coupons', label: '优惠券管理', icon: 'Ticket' },
  { path: '/users', label: '用户管理', icon: 'User' },
  { path: '/admins', label: '管理员管理', icon: 'Setting' },
  { path: '/settings', label: '个人设置', icon: 'Tools' }
]

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/parking-spots')) return '/parking-spots'
  const matched = menus.find(m => m.path === path)
  return matched ? matched.path : '/dashboard'
})

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="side-menu">
    <div class="logo-area">
      <el-icon :size="28" color="#409EFF"><Monitor /></el-icon>
      <span class="logo-text">智能停车管理</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      :router="false"
      class="menu"
      background-color="#001529"
      text-color="#ffffffa6"
      active-text-color="#ffffff"
    >
      <el-menu-item v-for="item in menus" :key="item.path" :index="item.path" @click="navigate(item.path)">
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style scoped>
.side-menu {
  width: 220px;
  height: 100%;
  background: #001529;
  display: flex;
  flex-direction: column;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.menu {
  flex: 1;
  border-right: none !important;
}

.el-menu-item {
  font-size: 14px;
  height: 48px;
  line-height: 48px;
}

.el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.06) !important;
}

.el-menu-item.is-active {
  background-color: rgba(64, 158, 255, 0.15) !important;
}
</style>
