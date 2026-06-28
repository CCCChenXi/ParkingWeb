<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getParkingSpots, createParkingSpots, deleteParkingSpot, updateParkingSpot, getParkingLots } from '../api/admin'

const route = useRoute()
const router = useRouter()
const lotId = Number(route.params.lotId)

const loading = ref(false)
const spots = ref<any[]>([])
const lotName = ref(`停车场#${lotId}`)

const showDialog = ref(false)
const batchForm = ref({ prefix: 'A', start: 1, count: 10, type: 0 })
const saving = ref(false)

async function fetchSpots() {
  loading.value = true
  try {
    const [spotsRes, lotsRes] = await Promise.all([
      getParkingSpots(lotId).catch(() => ({ data: [] })),
      getParkingLots().catch(() => ({ data: [] }))
    ])
    spots.value = spotsRes.data || []
    const lot = (lotsRes.data || []).find((l: any) => l.id === lotId)
    if (lot) lotName.value = lot.name
  } finally {
    loading.value = false
  }
}

onMounted(fetchSpots)

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除此车位？', '提示', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    await deleteParkingSpot(id)
    ElMessage.success('删除成功')
    await fetchSpots()
  } catch {}
}

function openBatchAdd() {
  batchForm.value = { prefix: 'A', start: 1, count: 10, type: 0 }
  showDialog.value = true
}

async function handleBatchAdd() {
  const spotNumbers: string[] = []
  for (let i = 0; i < batchForm.value.count; i++) {
    spotNumbers.push(batchForm.value.prefix + String(batchForm.value.start + i).padStart(2, '0'))
  }
  saving.value = true
  try {
    await createParkingSpots(lotId, { spotNumbers, type: batchForm.value.type })
    ElMessage.success(`成功添加 ${batchForm.value.count} 个车位`)
    showDialog.value = false
    await fetchSpots()
  } finally {
    saving.value = false
  }
}

async function updateSpotType(row: any) {
  try {
    await updateParkingSpot(row.id, { type: row.type })
    ElMessage.success('修改成功')
  } catch {
    await fetchSpots()
  }
}
</script>

<template>
  <div>
    <div class="page-header flex-between">
      <div>
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h2 style="display: inline-block; margin-left: 8px;">{{ lotName }} - 车位管理</h2>
      </div>
      <el-button type="primary" @click="openBatchAdd">+ 批量新增车位</el-button>
    </div>

    <div class="card" v-loading="loading">
      <el-table :data="spots" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="spotNumber" label="车位编号" width="120" />
        <el-table-column label="类型" width="140">
          <template #default="{ row }">
            <el-tag
              :type="row.type === 0 ? '' : row.type === 1 ? 'warning' : 'primary'"
              size="small"
            >
              {{ row.type === 0 ? '标准车位' : row.type === 1 ? '大型车位' : '充电桩' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
              {{ row.status === 0 ? '空闲' : '占用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="车位类型" width="180">
          <template #default="{ row }">
            <el-select v-model="row.type" size="small" @change="updateSpotType(row)">
              <el-option :value="0" label="标准车位" />
              <el-option :value="1" label="大型车位" />
              <el-option :value="2" label="充电桩" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showDialog" title="批量新增车位" width="450px" destroy-on-close>
      <el-form :model="batchForm" label-width="100px">
        <el-form-item label="前缀">
          <el-input v-model="batchForm.prefix" placeholder="如 A" maxlength="2" />
        </el-form-item>
        <el-form-item label="起始编号">
          <el-input-number v-model="batchForm.start" :min="1" :max="999" />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="batchForm.count" :min="1" :max="200" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="batchForm.type">
            <el-radio :value="0">标准车位</el-radio>
            <el-radio :value="1">大型车位</el-radio>
            <el-radio :value="2">充电桩</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleBatchAdd">确认添加</el-button>
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
