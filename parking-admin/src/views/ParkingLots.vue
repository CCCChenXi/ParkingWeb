<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getParkingLots, createParkingLot, updateParkingLot, deleteParkingLot } from '../api/admin'

const router = useRouter()

const loading = ref(false)
const lots = ref<any[]>([])
const showDialog = ref(false)
const isEdit = ref(false)
const form = ref({ id: 0, name: '', address: '', totalSpots: 0, longitude: 0, latitude: 0, status: 1 })
const saving = ref(false)

async function fetchLots() {
  loading.value = true
  try {
    const res = await getParkingLots()
    lots.value = res.data || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchLots)

function openAdd() {
  isEdit.value = false
  form.value = { id: 0, name: '', address: '', totalSpots: 0, longitude: 0, latitude: 0, status: 1 }
  showDialog.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  form.value = { ...row }
  showDialog.value = true
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除此停车场？', '提示', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    await deleteParkingLot(id)
    ElMessage.success('删除成功')
    await fetchLots()
  } catch {}
}

async function handleSave() {
  if (!form.value.name || !form.value.address) {
    ElMessage.warning('请填写完整信息')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateParkingLot(form.value.id, form.value)
      ElMessage.success('修改成功')
    } else {
      await createParkingLot(form.value)
      ElMessage.success('添加成功')
    }
    showDialog.value = false
    await fetchLots()
  } finally {
    saving.value = false
  }
}

function viewSpots(lotId: number) {
  router.push(`/parking-spots/${lotId}`)
}
</script>

<template>
  <div>
    <div class="page-header flex-between">
      <h2>停车场管理</h2>
      <el-button type="primary" @click="openAdd">+ 新增停车场</el-button>
    </div>

    <div class="card" v-loading="loading">
      <el-table :data="lots" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="totalSpots" label="总车位数" width="100" />
        <el-table-column prop="availableSpots" label="可用车位数" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '营业中' : '已关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewSpots(row.id)">车位</el-button>
            <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑停车场' : '新增停车场'" width="500px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="请输入停车场名称" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="总车位数">
          <el-input-number v-model="form.totalSpots" :min="1" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="营业" inactive-text="关闭" />
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
