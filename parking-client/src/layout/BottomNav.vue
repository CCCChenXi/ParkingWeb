<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessageStore } from '../stores/message'

const route = useRoute()
const router = useRouter()
const messageStore = useMessageStore()

const tabs = [
  { key: 'home', label: '首页', icon: 'HomeFilled' },
  { key: 'order', label: '订单', icon: 'Document' },
  { key: 'message', label: '消息', icon: 'ChatDotRound', badge: true },
  { key: 'profile', label: '我的', icon: 'UserFilled' }
]

const activeKey = computed(() => {
  const name = route.name as string
  if (name === 'Home' || name === 'ParkingLotDetail') return 'home'
  if (name === 'Order') return 'order'
  if (name === 'Message') return 'message'
  if (name === 'Profile' || name === 'Vehicles' || name === 'Coupons' || name === 'Wallet') return 'profile'
  return 'home'
})

function go(key: string) {
  router.push({ name: key.charAt(0).toUpperCase() + key.slice(1) })
}
</script>

<template>
  <div class="bottom-nav">
    <div
      v-for="tab in tabs"
      :key="tab.key"
      class="nav-item"
      :class="{ active: activeKey === tab.key }"
      @click="go(tab.key)"
    >
      <div class="nav-icon-wrap">
        <el-icon :size="22">
          <component :is="tab.icon" />
        </el-icon>
        <el-badge v-if="tab.badge && messageStore.unreadCount > 0" :value="messageStore.unreadCount" :max="99" class="nav-badge" />
      </div>
      <span class="nav-label">{{ tab.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 430px;
  max-width: 100%;
  height: 64px;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  padding: 6px 16px;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: all 0.2s;
}

.nav-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-badge {
  position: absolute;
  top: -6px;
  right: -10px;
}

.nav-label {
  font-size: 11px;
  color: #999;
  transition: color 0.2s;
}

.nav-item.active .nav-label {
  color: #409EFF;
  font-weight: 500;
}

.nav-item.active .el-icon {
  color: #409EFF;
}

@media (max-width: 430px) {
  .bottom-nav {
    width: 100%;
  }
}
</style>
