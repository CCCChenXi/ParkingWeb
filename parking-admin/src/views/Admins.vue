<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdmins, createAdmin } from '../api/admin'

const loading = ref(false)
const admins = ref<any[]>([])

const showDialog = ref(false)
const form = ref({ username: '', password: '', role: 'operator' })
const saving = ref(false)

async function fetchAdmins() {
  loading.value = true
  try {
    const res = await getAdmins()
    admins.value = res.data || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchAdmins)

function openAdd() {
  form.value = { username: '', password: '', role: 'operator' }
  showDialog.value = true
}

async function handleSave() {
  if (!form.value.username) {
    ElMessage.warning('请填写用户名')
    return
  }
  if (!form.value.password) {
    ElMessage.warning('请填写密码')
    return
  }
  saving.value = true
  try {
    await createAdmin(form.value)
    ElMessage.success('添加成功')
    showDialog.value = false
    await fetchAdmins()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header flex-between">
      <h2>管理员管理</h2>
      <el-button type="primary" @click="openAdd">+ 新增管理员</el-button>
    </div>

    <div class="card" v-loading="loading">
      <el-table :data="admins" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'super' ? 'danger' : 'primary'" size="small">
              {{ row.role === 'super' ? '超级管理员' : '操作员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="140" />
      </el-table>
    </div>

    <el-dialog v-model="showDialog" title="新增管理员" width="450px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="form.role">
            <el-radio value="super">超级管理员</el-radio>
            <el-radio value="operator">操作员</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
