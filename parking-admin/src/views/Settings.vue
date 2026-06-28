<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { updateAdminProfile } from '../api/admin'
import { useAdminStore } from '../stores/admin'

const adminStore = useAdminStore()

const form = ref({
  username: adminStore.adminInfo?.username || 'admin',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const saving = ref(false)

async function handleSave() {
  if (form.value.newPassword && form.value.newPassword !== form.value.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }
  if (!form.value.oldPassword) {
    ElMessage.warning('请输入原密码')
    return
  }
  saving.value = true
  try {
    await updateAdminProfile({ oldPassword: form.value.oldPassword, newPassword: form.value.newPassword })
    ElMessage.success('修改成功')
    form.value.oldPassword = ''
    form.value.newPassword = ''
    form.value.confirmPassword = ''
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>个人设置</h2>
    </div>

    <div class="card" style="max-width: 500px;">
      <el-form :model="form" label-width="120px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" disabled />
        </el-form-item>
        <el-divider>修改密码</el-divider>
        <el-form-item label="原密码">
          <el-input v-model="form.oldPassword" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="form.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存修改</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
