<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const lots = ref([
  { id: 1, name: '科技园停车场', address: '南山区科技南路100号', totalSpots: 100, availableSpots: 45, status: 1 },
  { id: 2, name: '万象天地停车场', address: '南山区深南大道200号', totalSpots: 50, availableSpots: 12, status: 1 },
  { id: 3, name: '华强北停车场', address: '福田区华强北路50号', totalSpots: 80, availableSpots: 33, status: 1 },
  { id: 4, name: '海岸城停车场', address: '南山区文心五路33号', totalSpots: 120, availableSpots: 8, status: 0 },
  { id: 5, name: '车公庙停车场', address: '福田区泰然九路', totalSpots: 60, availableSpots: 27, status: 1 },
  { id: 6, name: '市民中心停车场', address: '福田区福中三路', totalSpots: 200, availableSpots: 0, status: 1 }
])

const showDialog = ref(false)
const isEdit = ref(false)
const form = ref({ id: 0, name: '', address: '', totalSpots: 0, status: 1 })

function openAdd() {
  isEdit.value = false
  form.value = { id: 0, name: '', address: '', totalSpots: 0, status: 1 }
  showDialog.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  form.value = { ...row }
  showDialog.value = true
}

function handleDelete(id: number) {
  ElMessageBox.confirm('确认删除此停车场？', '提示', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    .then(() => {
      lots.value = lots.value.filter(l => l.id !== id)
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}

function handleSave() {
  if (!form.value.name || !form.value.address) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (isEdit.value) {
    const idx = lots.value.findIndex(l => l.id === form.value.id)
    if (idx > -1) lots.value[idx] = { ...form.value, availableSpots: form.value.totalSpots }
  } else {
    lots.value.push({ id: Date.now(), name: form.value.name, address: form.value.address, totalSpots: form.value.totalSpots, status: form.value.status, availableSpots: form.value.totalSpots })
  }
  showDialog.value = false
  ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
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

    <div class="card">
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
