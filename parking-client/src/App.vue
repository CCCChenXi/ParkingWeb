<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

onMounted(() => {
  window.addEventListener('auth:unauthorized', () => {
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
