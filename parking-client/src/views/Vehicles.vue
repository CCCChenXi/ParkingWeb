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
const showColorPicker = ref(false)

const colorOptions = [
  { name: '白色', value: '#ffffff' },
  { name: '黑色', value: '#333333' },
  { name: '灰色', value: '#808080' },
  { name: '银色', value: '#c0c0c0' },
  { name: '红色', value: '#cc0000' },
  { name: '蓝色', value: '#0066cc' },
  { name: '绿色', value: '#339933' },
  { name: '黄色', value: '#ffcc00' },
  { name: '棕色', value: '#8B4513' },
  { name: '粉色', value: '#ff69b4' },
  { name: '紫色', value: '#800080' },
  { name: '橙色', value: '#ff6600' },
]

function getColorValue(color: string): string {
  const found = colorOptions.find(c => c.name === color)
  return found ? found.value : color || '#ccc'
}

onMounted(() => {
  userStore.fetchVehicles()
})

function openAdd() {
  editingVehicle.value = null
  form.value = { plateNumber: '', brand: '', color: '' }
  dialogTitle.value = '添加车辆'
  showDialog.value = true
  showColorPicker.value = false
}

function openEdit(v: Vehicle) {
  editingVehicle.value = v
  form.value = { plateNumber: v.plateNumber, brand: v.brand, color: v.color }
  dialogTitle.value = '编辑车辆'
  showDialog.value = true
  showColorPicker.value = false
}

function selectColor(name: string) {
  form.value.color = name
  showColorPicker.value = false
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
      await userStore.editVehicle(editingVehicle.value.id, form.value)
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
          <span class="vehicle-color-dot" :style="{ background: getColorValue(v.color) }" />
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
        <div class="color-picker-wrap" style="margin-bottom: 12px;">
          <div class="color-trigger" @click="showColorPicker = !showColorPicker">
            <div class="color-trigger-dot" :style="{ background: getColorValue(form.color) }" />
            <span :class="{ placeholder: !form.color }">{{ form.color || '选择颜色' }}</span>
            <el-icon :class="{ rotated: showColorPicker }"><ArrowDown /></el-icon>
          </div>
          <div v-if="showColorPicker" class="color-grid">
            <div
              v-for="c in colorOptions"
              :key="c.name"
              class="color-item"
              :class="{ active: form.color === c.name }"
              @click="selectColor(c.name)"
            >
              <div class="color-item-dot" :style="{ background: c.value }" />
              <span>{{ c.name }}</span>
            </div>
          </div>
        </div>
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

.color-picker-wrap {
  position: relative;
}

.color-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s;
  font-size: 14px;
}

.color-trigger:hover {
  border-color: #409EFF;
}

.color-trigger-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.color-trigger .placeholder {
  color: #c0c4cc;
}

.color-trigger .el-icon {
  margin-left: auto;
  transition: transform 0.2s;
  color: #999;
}

.color-trigger .el-icon.rotated {
  transform: rotate(180deg);
}

.color-grid {
  position: absolute;
  top: 44px;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.color-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #333;
  transition: background 0.15s;
}

.color-item:hover {
  background: #f5f5f5;
}

.color-item.active {
  background: #ecf5ff;
  color: #409EFF;
}

.color-item-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #e8e8e8;
  flex-shrink: 0;
}
</style>
