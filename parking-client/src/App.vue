<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from './stores/user'
import { useMessageStore } from './stores/message'

const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

onMounted(() => {
  if (userStore.isLoggedIn) {
    messageStore.loadCache()
    messageStore.connect()
  }

  window.addEventListener('auth:unauthorized', () => {
    messageStore.disconnect()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    ElMessage.error('登录已过期，请重新登录')
  })
})
</script>

<template>
  <router-view />
</template>
