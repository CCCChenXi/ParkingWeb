<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api/admin'
import { useAdminStore } from '../stores/admin'
import { ElMessage } from 'element-plus'

const router = useRouter()
const adminStore = useAdminStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  loading.value = true
  try {
    const res: any = await login({ username: username.value, password: password.value })
    localStorage.setItem('adminToken', res.data.token)
    adminStore.setAdmin(res.data.admin)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <el-icon :size="40" color="#409EFF"><Monitor /></el-icon>
        <h2>智能停车管理系统</h2>
        <p>请登录以继续</p>
      </div>
      <el-form @submit.prevent="handleLogin" class="login-form">
        <el-input
          v-model="username"
          placeholder="用户名"
          :prefix-icon="'User'"
          size="large"
          style="margin-bottom: 16px;"
        />
        <el-input
          v-model="password"
          type="password"
          placeholder="密码"
          :prefix-icon="'Lock'"
          size="large"
          style="margin-bottom: 24px;"
          show-password
        />
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          style="width: 100%; height: 44px; border-radius: 8px;"
          native-type="submit"
        >
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.login-card {
  width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 12px 0 4px;
}

.login-header p {
  font-size: 14px;
  color: #999;
}
</style>
