<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const lotId = Number(route.params.lotId)

const lotNames: Record<number, string> = { 1: '科技园停车场', 2: '万象天地停车场', 3: '华强北停车场', 4: '海岸城停车场', 5: '车公庙停车场', 6: '市民中心停车场' }
const lotName = computed(() => lotNames[lotId] || `停车场#${lotId}`)

const spots = ref<any[]>([])
const showDialog = ref(false)
const isBatchAdd = ref(false)
const batchForm = ref({ prefix: 'A', start: 1, count: 10, type: 0 })

function generateMockSpots() {
  const result: any[] = []
  let id = 1
  for (const prefix of ['A', 'B', 'C', 'D']) {
    for (let i = 1; i <= 10; i++) {
      const num = `${prefix}${String(i).padStart(2, '0')}`
      result.push({
        id: id++,
        lotId,
        spotNumber: num,
        type: i <= 2 ? 2 : (i <= 8 ? 0 : 1),
        status: i <= 5 ? 1 : 0
      })
    }
  }
  return result
}

onMounted(() => {
  spots.value = generateMockSpots()
})

function handleDelete(id: number) {
  ElMessageBox.confirm('确认删除此车位？', '提示', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    .then(() => {
      spots.value = spots.value.filter(s => s.id !== id)
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}

function openBatchAdd() {
  isBatchAdd.value = true
  batchForm.value = { prefix: 'A', start: 1, count: 10, type: 0 }
  showDialog.value = true
}

function handleBatchAdd() {
  const newSpots: any[] = []
  for (let i = 0; i < batchForm.value.count; i++) {
    const num = batchForm.value.prefix + String(batchForm.value.start + i).padStart(2, '0')
    newSpots.push({
      id: Date.now() + i,
      lotId,
      spotNumber: num,
      type: batchForm.value.type,
      status: 0
    })
  }
  spots.value.push(...newSpots)
  showDialog.value = false
  ElMessage.success(`成功添加 ${batchForm.value.count} 个车位`)
}

function updateSpotType() {
  ElMessage.success('修改成功')
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

    <div class="card">
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
            <el-select v-model="row.type" size="small" @change="updateSpotType">
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
        <el-button type="primary" @click="handleBatchAdd">确认添加</el-button>
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
