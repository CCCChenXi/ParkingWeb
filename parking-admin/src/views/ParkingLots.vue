<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useDebounceFn } from '@vueuse/core'
import { getParkingLots, createParkingLot, updateParkingLot, deleteParkingLot } from '../api/admin'
import MapPicker from '../components/MapPicker.vue'

const router = useRouter()

const loading = ref(false)
const lots = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const keyword = ref('')
const status = ref<number | undefined>(undefined)
const showDialog = ref(false)
const isEdit = ref(false)
const form = ref({ id: 0, name: '', address: '', longitude: 0, latitude: 0, status: 1 })
const saving = ref(false)

async function fetchLots() {
  loading.value = true
  try {
    const res = await getParkingLots({
      page: page.value,
      size: pageSize.value,
      keyword: keyword.value || undefined,
      status: status.value
    })
    lots.value = res.data.dataList
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const searchLots = useDebounceFn(() => {
  page.value = 1
  fetchLots()
}, 300)

function handleStatusChange() {
  page.value = 1
  fetchLots()
}

function handlePageChange(p: number) {
  page.value = p
  fetchLots()
}

onMounted(fetchLots)

function openAdd() {
  isEdit.value = false
  form.value = { id: 0, name: '', address: '', longitude: 0, latitude: 0, status: 1 }
  showDialog.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  form.value = { id: row.id, name: row.name, address: row.address, longitude: row.longitude, latitude: row.latitude, status: row.status }
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
      const res: any = await createParkingLot(form.value)
      ElMessage.success('添加成功')
      showDialog.value = false
      const newId = res?.data?.id
      if (newId) {
        router.push(`/parking-spots?lotId=${newId}&showBatch=true`)
      } else {
        await fetchLots()
      }
      return
    }
    showDialog.value = false
    await fetchLots()
  } finally {
    saving.value = false
  }
}

function viewSpots(lotId: number) {
  router.push(`/parking-spots?lotId=${lotId}`)
}
</script>

<template>
  <div>
    <div class="page-header flex-between">
      <h2>停车场管理</h2>
      <el-button type="primary" @click="openAdd">+ 新增停车场</el-button>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="keyword"
          placeholder="搜索名称/地址"
          clearable
          style="width:280px"
          @input="searchLots"
        />
        <el-select
          v-model="status"
          placeholder="全部状态"
          clearable
          style="width:130px;margin-left:12px"
          @change="handleStatusChange"
        >
          <el-option label="营业中" :value="1" />
          <el-option label="已关闭" :value="0" />
        </el-select>
      </div>
      <el-button :icon="Refresh" size="small" circle @click="fetchLots" />
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

      <el-pagination
        v-if="total"
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        background
        @current-change="handlePageChange"
        style="margin-top:16px;justify-content:center"
      />
    </div>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑停车场' : '新增停车场'" width="640px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="请输入停车场名称" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="营业" inactive-text="关闭" />
        </el-form-item>
        <el-form-item label="经纬度">
          <el-input :model-value="form.longitude ? form.longitude.toFixed(6) : ''" placeholder="点击地图选点" readonly style="width:180px;margin-right:8px">
            <template #prepend>经度</template>
          </el-input>
          <el-input :model-value="form.latitude ? form.latitude.toFixed(6) : ''" placeholder="点击地图选点" readonly style="width:180px">
            <template #prepend>纬度</template>
          </el-input>
        </el-form-item>
        <el-form-item label="地图选点">
          <MapPicker v-model:lng="form.longitude" v-model:lat="form.latitude" />
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
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.toolbar-left {
  display: flex;
  align-items: center;
}
</style>
