<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Vehicle } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const showDialog = ref(false)
const editingVehicle = ref<Vehicle | null>(null)
const form = ref({ plateNumber: '', brand: '', color: '' })
const dialogTitle = ref('添加车辆')

onMounted(() => {
  userStore.fetchVehicles()
})

function openAdd() {
  editingVehicle.value = null
  form.value = { plateNumber: '', brand: '', color: '' }
  dialogTitle.value = '添加车辆'
  showDialog.value = true
}

function openEdit(v: Vehicle) {
  editingVehicle.value = v
  form.value = { plateNumber: v.plateNumber, brand: v.brand, color: v.color }
  dialogTitle.value = '编辑车辆'
  showDialog.value = true
}

function handleDelete(id: number) {
  ElMessageBox.confirm('确认删除该车辆？', '提示', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    .then(async () => {
      await userStore.removeVehicle(id)
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}

async function handleSubmit() {
  if (!form.value.plateNumber || !form.value.brand) {
    ElMessage.warning('请填写完整信息')
    return
  }
  showDialog.value = false
  try {
    if (editingVehicle.value) {
      await userStore.updateProfile({ vehicleId: editingVehicle.value.id, ...form.value })
      ElMessage.success('修改成功')
    } else {
      await userStore.addNewVehicle(form.value)
      ElMessage.success('添加成功')
    }
  } catch {
    // 错误已由全局拦截器展示（后端 message || '请求失败'）
  }
}
</script>

<template>
  <div class="page">
    <div class="back-header" @click="router.back()">
      <el-icon :size="20"><ArrowLeft /></el-icon>
      <span class="back-text">车辆管理</span>
    </div>

    <el-button type="primary" class="add-btn" size="large" @click="openAdd">
      <el-icon><Plus /></el-icon> 添加车辆
    </el-button>

    <div class="vehicle-list">
      <div v-for="v in userStore.vehicles" :key="v.id" class="card vehicle-card">
        <div class="vehicle-top">
          <div class="plate-badge">{{ v.plateNumber }}</div>
          <div class="vehicle-actions">
            <el-button text type="primary" size="small" @click="openEdit(v)">编辑</el-button>
            <el-button text type="danger" size="small" @click="handleDelete(v.id)">删除</el-button>
          </div>
        </div>
        <div class="vehicle-info">
          <span class="vehicle-brand">{{ v.brand }}</span>
          <span class="vehicle-color-dot" :style="{ background: v.color === '白色' ? '#eee' : v.color === '黑色' ? '#333' : v.color }" />
          <span class="vehicle-color">{{ v.color }}</span>
        </div>
      </div>
    </div>

    <div v-if="userStore.vehicles.length === 0" class="empty-state">
      <el-empty description="暂无车辆信息" />
    </div>

    <el-dialog v-model="showDialog" :title="dialogTitle" width="90%" class="rounded-dialog">
      <div class="dialog-form">
        <el-input v-model="form.plateNumber" placeholder="车牌号 (如 粤B·88888)" size="large" style="margin-bottom: 12px;" />
        <el-input v-model="form.brand" placeholder="品牌型号 (如 特斯拉 Model 3)" size="large" style="margin-bottom: 12px;" />
        <el-input v-model="form.color" placeholder="颜色" size="large" style="margin-bottom: 12px;" />
      </div>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.back-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.back-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.add-btn {
  width: 100%;
  border-radius: 12px;
  margin-bottom: 16px;
  height: 44px;
}

.vehicle-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vehicle-card {
  padding: 16px;
}

.vehicle-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.plate-badge {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 1px;
}

.vehicle-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.vehicle-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #e8e8e8;
}

.empty-state {
  margin-top: 60px;
}

.dialog-form {
  padding: 8px 0;
}
</style>
