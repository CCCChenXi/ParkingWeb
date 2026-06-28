<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const admins = ref([
  { id: 1, username: 'admin', role: 'super', createTime: '2026-01-01' },
  { id: 2, username: 'operator1', role: 'operator', createTime: '2026-02-15' },
  { id: 3, username: 'operator2', role: 'operator', createTime: '2026-03-20' }
])

const showDialog = ref(false)
const isEdit = ref(false)
const form = ref({ id: 0, username: '', password: '', role: 'operator' })

onMounted(() => {})

function openAdd() {
  isEdit.value = false
  form.value = { id: 0, username: '', password: '', role: 'operator' }
  showDialog.value = true
}

function handleDelete(id: number) {
  ElMessageBox.confirm('确认删除此管理员？', '提示', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    .then(() => {
      admins.value = admins.value.filter(a => a.id !== id)
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}

function handleSave() {
  if (!form.value.username) {
    ElMessage.warning('请填写用户名')
    return
  }
  if (!isEdit.value && !form.value.password) {
    ElMessage.warning('请填写密码')
    return
  }
  if (isEdit.value) {
    const idx = admins.value.findIndex(a => a.id === form.value.id)
    if (idx > -1) admins.value[idx] = { id: form.value.id, username: form.value.username, role: form.value.role, createTime: admins.value[idx].createTime }
  } else {
    admins.value.push({ id: Date.now(), username: form.value.username, role: form.value.role, createTime: new Date().toISOString().slice(0, 10) })
  }
  showDialog.value = false
  ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
}
</script>

<template>
  <div>
    <div class="page-header flex-between">
      <h2>管理员管理</h2>
      <el-button type="primary" @click="openAdd">+ 新增管理员</el-button>
    </div>

    <div class="card">
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
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑管理员' : '新增管理员'" width="450px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" v-if="!isEdit">
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
        <el-button type="primary" @click="handleSave">确认</el-button>
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
