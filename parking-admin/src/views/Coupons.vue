<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../api/admin'

const loading = ref(false)
const coupons = ref<any[]>([])
const showDialog = ref(false)
const isEdit = ref(false)
const form = ref<any>({})
const saving = ref(false)

async function fetchCoupons() {
  loading.value = true
  try {
    const res = await getCoupons()
    coupons.value = res.data || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchCoupons)

function openAdd() {
  isEdit.value = false
  form.value = { id: 0, name: '', description: '', discountAmount: 0, minAmount: 0, type: 0, stock: 100, startTime: '', endTime: '' }
  showDialog.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  form.value = { ...row }
  showDialog.value = true
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除此优惠券？', '提示', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    await deleteCoupon(id)
    ElMessage.success('删除成功')
    await fetchCoupons()
  } catch {}
}

async function handleSave() {
  if (!form.value.name || !form.value.discountAmount) {
    ElMessage.warning('请填写完整信息')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateCoupon(form.value.id, form.value)
      ElMessage.success('修改成功')
    } else {
      await createCoupon(form.value)
      ElMessage.success('添加成功')
    }
    showDialog.value = false
    await fetchCoupons()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header flex-between">
      <h2>优惠券管理</h2>
      <el-button type="primary" @click="openAdd">+ 新增优惠券</el-button>
    </div>

    <div class="card" v-loading="loading">
      <el-table :data="coupons" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="description" label="描述" min-width="180" />
        <el-table-column label="优惠" width="80">
          <template #default="{ row }">
            ¥{{ row.discountAmount }}
          </template>
        </el-table-column>
        <el-table-column label="最低使用" width="80">
          <template #default="{ row }">
            ¥{{ row.minAmount }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'danger' : ''" size="small">
              {{ row.type === 0 ? '普通' : '秒杀' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="100">
          <template #default="{ row }">
            {{ row.remainStock }}/{{ row.stock }}
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="200">
          <template #default="{ row }">
            {{ row.startTime }} ~ {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑优惠券' : '新增优惠券'" width="550px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="优惠券名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" placeholder="优惠券描述" />
        </el-form-item>
        <el-form-item label="优惠金额">
          <el-input-number v-model="form.discountAmount" :min="1" :precision="2" />
        </el-form-item>
        <el-form-item label="最低金额">
          <el-input-number v-model="form.minAmount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio :value="0">普通</el-radio>
            <el-radio :value="1">秒杀</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="1" :max="99999" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间" value-format="YYYY-MM-DD HH:mm" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间" value-format="YYYY-MM-DD HH:mm" />
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
