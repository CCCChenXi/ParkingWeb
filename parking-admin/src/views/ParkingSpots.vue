<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getParkingLotNames, getParkingSpots, createParkingSpots, deleteParkingSpot, updateParkingSpot } from '../api/admin'

const route = useRoute()

const pageLoading = ref(true)
const loading = ref(false)
const lots = ref<any[]>([])
const selectedLotId = ref<number>(0)
const spots = ref<any[]>([])

const showDialog = ref(false)
const batchForm = ref({ prefix: 'A', start: 1, count: 10, type: 0 })
const saving = ref(false)

const editDialogVisible = ref(false)
const editForm = ref({ id: 0, spotNumber: '', type: 0 })
const editSaving = ref(false)

const spotKeyword = ref('')
const spotType = ref<number | undefined>(undefined)
const spotStatus = ref<number | undefined>(undefined)

const filteredSpots = computed(() => {
  return spots.value.filter(spot => {
    if (spotKeyword.value && !spot.spotNumber.includes(spotKeyword.value)) return false
    if (spotType.value !== undefined && spot.type !== spotType.value) return false
    if (spotStatus.value !== undefined && spot.status !== spotStatus.value) return false
    return true
  })
})

async function fetchLots() {
  pageLoading.value = true
  try {
    const res: any = await getParkingLotNames()
    lots.value = res.data || []
    if (!lots.value.length) {
      selectedLotId.value = -1
      return
    }
    const qLotId = route.query.lotId
    if (qLotId && lots.value.some((l: any) => l.id === Number(qLotId))) {
      selectedLotId.value = Number(qLotId)
    } else {
      selectedLotId.value = lots.value[0].id
    }
  } catch {
    selectedLotId.value = -1
  } finally {
    pageLoading.value = false
  }
}

async function fetchSpots() {
  const id = selectedLotId.value
  if (id <= 0) { spots.value = []; return }
  loading.value = true
  try {
    const res: any = await getParkingSpots(id)
    spots.value = res.data || []
  } finally {
    loading.value = false
  }
}

watch(selectedLotId, fetchSpots)

onMounted(async () => {
  await fetchLots()
  if (route.query.showBatch === 'true') {
    openBatchAdd()
  }
})

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除此车位？', '提示', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    await deleteParkingSpot(selectedLotId.value, id)
    ElMessage.success('删除成功')
    await fetchSpots()
  } catch {}
}

function openBatchAdd() {
  batchForm.value = { prefix: 'A', start: 1, count: 10, type: 0 }
  showDialog.value = true
}

async function handleBatchAdd() {
  if (!selectedLotId.value) {
    ElMessage.warning('请先选择停车场')
    return
  }
  const spotNumbers: string[] = []
  for (let i = 0; i < batchForm.value.count; i++) {
    spotNumbers.push(batchForm.value.prefix + String(batchForm.value.start + i).padStart(2, '0'))
  }
  saving.value = true
  try {
    await createParkingSpots(selectedLotId.value, { spotNumbers, type: batchForm.value.type })
    ElMessage.success(`成功添加 ${batchForm.value.count} 个车位`)
    showDialog.value = false
    await fetchSpots()
  } finally {
    saving.value = false
  }
}

function openEdit(row: any) {
  editForm.value = { id: row.id, spotNumber: row.spotNumber, type: row.type }
  editDialogVisible.value = true
}

async function handleEditSave() {
  if (!editForm.value.spotNumber) {
    ElMessage.warning('请输入车位编号')
    return
  }
  editSaving.value = true
  try {
    await updateParkingSpot(selectedLotId.value, editForm.value.id, {
      spotNumber: editForm.value.spotNumber,
      type: editForm.value.type,
    })
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    await fetchSpots()
  } finally {
    editSaving.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="pageLoading" class="page-loading">
      <el-icon class="is-loading" :size="36" color="#409EFF">
        <Loading />
      </el-icon>
      <p>正在加载中</p>
    </div>

    <template v-if="!pageLoading">
    <div class="page-header flex-between">
      <h2>车位管理</h2>
      <el-button type="primary" :disabled="!selectedLotId" @click="openBatchAdd">+ 批量新增车位</el-button>
    </div>

    <div class="lot-selector">
      <el-select v-model="selectedLotId" :placeholder="lots.length ? '请选择停车场' : '暂无停车场数据'" clearable style="width: 300px" size="large">
        <el-option v-if="!lots.length" :value="-1" label="暂无停车场数据" disabled />
        <el-option v-for="lot in lots" :key="lot.id" :value="lot.id" :label="lot.name" />
      </el-select>
    </div>

    <div v-if="selectedLotId === -1" class="empty-tip">
      <el-empty description="暂无停车场数据，请先添加停车场" />
    </div>
    <div v-else-if="!selectedLotId" class="empty-tip">
      <el-empty description="请先选择一个停车场" />
    </div>

    <div v-else v-loading="loading">
      <div class="spot-toolbar">
        <el-input v-model="spotKeyword" placeholder="搜索车位编号" clearable style="width:200px" />
        <el-select v-model="spotType" placeholder="全部类型" clearable style="width:130px;margin-left:12px">
          <el-option label="标准车位" :value="0" />
          <el-option label="大型车位" :value="1" />
          <el-option label="充电桩" :value="2" />
        </el-select>
        <el-select v-model="spotStatus" placeholder="全部状态" clearable style="width:120px;margin-left:12px">
          <el-option label="空闲" :value="0" />
          <el-option label="占用" :value="1" />
        </el-select>
      </div>
      <div class="spot-grid">
        <div v-for="spot in filteredSpots" :key="spot.id" class="spot-card">
          <div class="spot-number">{{ spot.spotNumber }}</div>
          <div class="spot-info">
            <el-tag
              :type="spot.type === 0 ? '' : spot.type === 1 ? 'warning' : 'primary'"
              size="small"
            >
              {{ spot.type === 0 ? '标准车位' : spot.type === 1 ? '大型车位' : '充电桩' }}
            </el-tag>
            <el-tag :type="spot.status === 0 ? 'success' : 'danger'" size="small">
              {{ spot.status === 0 ? '空闲' : '占用' }}
            </el-tag>
          </div>
          <div class="spot-actions">
            <el-button size="small" type="primary" @click="openEdit(spot)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(spot.id)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="editDialogVisible" title="编辑车位" width="400px" destroy-on-close>
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="车位编号">
          <el-input v-model="editForm.spotNumber" placeholder="如 B01" />
        </el-form-item>
        <el-form-item label="车位类型">
          <el-radio-group v-model="editForm.type">
            <el-radio :value="0">标准车位</el-radio>
            <el-radio :value="1">大型车位</el-radio>
            <el-radio :value="2">充电桩</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="handleEditSave">确认</el-button>
      </template>
    </el-dialog>

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
    </template>
  </div>
</template>

<style scoped>
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.lot-selector {
  margin-bottom: 16px;
}
.empty-tip {
  margin-top: 80px;
}
.page-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  color: #909399;
  font-size: 14px;
}
.spot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
}
.spot-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: box-shadow 0.2s;
}
.spot-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.spot-number {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}
.spot-info {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 12px;
}
.spot-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.spot-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
</style>
