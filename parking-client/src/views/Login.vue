<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const isRegister = ref(false)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const phone = ref('')
const code = ref('')
const loading = ref(false)
const codeSending = ref(false)
const countdown = ref(0)
let timer: number | undefined

function isValidPhone(val: string) {
  return /^1\d{10}$/.test(val)
}

async function handleSendCode() {
  if (!isValidPhone(phone.value)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  codeSending.value = true
  try {
    await userStore.sendCode(phone.value)
    countdown.value = 60
    timer = window.setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        timer = undefined
      }
    }, 1000)
  } catch (error: any) {
    const status = error.response?.status
    if (status === 400) {
      ElMessage.error('手机号格式错误')
    } else if (status === 500) {
      ElMessage.error('服务器异常，请稍后重试')
    } else {
      ElMessage.error('网络连接失败，请检查网络')
    }
  } finally {
    codeSending.value = false
  }
}

async function handleSubmit() {
  if (!username.value || !password.value) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  if (isRegister.value) {
    if (!isValidPhone(phone.value)) {
      ElMessage.warning('请输入正确的手机号')
      return
    }
    if (password.value.length < 6) {
      ElMessage.warning('密码长度不能少于6位')
      return
    }
    if (password.value !== confirmPassword.value) {
      ElMessage.warning('两次输入的密码不一致')
      return
    }
    if (!code.value) {
      ElMessage.warning('请先获取验证码')
      return
    }
  }
  loading.value = true
  try {
    if (isRegister.value) {
      await userStore.register(username.value, password.value, phone.value, code.value)
      ElMessage.success('注册成功')
      router.push('/home')
    } else {
      await userStore.login(username.value, password.value)
      ElMessage.success('登录成功')
      router.push('/home')
    }
  } catch {
    // 错误信息已由全局拦截器展示
  } finally {
    loading.value = false
  }
}

watch(phone, () => {
  if (code.value && countdown.value > 0) {
    code.value = ''
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
    countdown.value = 0
    ElMessage.info('手机号已变更，请重新发送验证码')
  }
})

watch(isRegister, (val) => {
  if (!val) {
    confirmPassword.value = ''
    code.value = ''
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
    countdown.value = 0
  }
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div class="login-page">
    <div class="login-header">
      <div class="logo-icon">
        <el-icon :size="48" color="#409EFF"><Monitor /></el-icon>
      </div>
      <h1 class="app-name">智能停车</h1>
      <p class="app-desc">快速找到车位，轻松停车</p>
    </div>
    <div class="login-form">
      <el-input
        v-model="username"
        placeholder="用户名"
        :prefix-icon="'User'"
        size="large"
        class="login-input"
      />
      <el-input
        v-if="isRegister"
        v-model="phone"
        placeholder="手机号"
        :prefix-icon="'Iphone'"
        size="large"
        class="login-input"
      />
      <el-input
        v-model="password"
        type="password"
        placeholder="密码"
        :prefix-icon="'Lock'"
        size="large"
        class="login-input"
        show-password
      />
      <el-input
        v-if="isRegister"
        v-model="confirmPassword"
        type="password"
        placeholder="确认密码"
        :prefix-icon="'Lock'"
        size="large"
        class="login-input"
        show-password
      />
      <div v-if="isRegister" class="code-row">
        <el-input
          v-model="code"
          placeholder="验证码"
          size="large"
          class="code-input"
          maxlength="6"
        />
        <el-button
          size="large"
          class="code-btn"
          :disabled="countdown > 0"
          :loading="codeSending"
          @click="handleSendCode"
        >
          {{ countdown > 0 ? `${countdown}s后重新发送` : '发送验证码' }}
        </el-button>
      </div>
      <el-button
        type="primary"
        size="large"
        :loading="loading"
        class="login-btn"
        @click="handleSubmit"
      >
        {{ isRegister ? '注册' : '登录' }}
      </el-button>
      <div class="login-switch">
        <el-button text type="primary" @click="isRegister = !isRegister">
          {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 32px 0;
}

.login-header {
  text-align: center;
  margin-bottom: 48px;
}

.logo-icon {
  margin-bottom: 16px;
}

.app-name {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.app-desc {
  font-size: 14px;
  color: #999;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-input {
  border-radius: 12px;
}

.login-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px #e8e8e8 inset;
}

.login-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409EFF inset;
}

.code-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.code-input {
  flex: 1;
  border-radius: 12px;
}

.code-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px #e8e8e8 inset;
}

.code-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409EFF inset;
}

.code-btn {
  flex-shrink: 0;
  border-radius: 24px;
  white-space: nowrap;
}

.login-btn {
  margin-top: 8px;
  border-radius: 24px;
  height: 48px;
  font-size: 16px;
}

.login-switch {
  text-align: center;
}
</style>
