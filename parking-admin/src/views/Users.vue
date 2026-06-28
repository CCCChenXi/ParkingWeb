<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getUsers, getUserDetail } from '../api/admin'

const loading = ref(false)
const users = ref<any[]>([])

const showDetail = ref(false)
const detailUser = ref<any>(null)
const detailLoading = ref(false)

async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUsers()
    users.value = res.data || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)

async function openDetail(row: any) {
  detailLoading.value = true
  showDetail.value = true
  try {
    const res = await getUserDetail(row.id)
    detailUser.value = res.data
  } catch {
    detailUser.value = row
  } finally {
    detailLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <div class="card" v-loading="loading">
      <el-table :data="users" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column prop="vehicles" label="车辆数" width="80" />
        <el-table-column prop="orderCount" label="订单数" width="80" />
        <el-table-column label="余额" width="100">
          <template #default="{ row }">
            ¥{{ row.balance.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" min-width="120" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showDetail" title="用户详情" width="450px" destroy-on-close v-loading="detailLoading">
      <el-descriptions v-if="detailUser" :column="1" border>
        <el-descriptions-item label="用户ID">{{ detailUser.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ detailUser.username }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailUser.phone }}</el-descriptions-item>
        <el-descriptions-item label="车辆数">{{ detailUser.vehicles }}</el-descriptions-item>
        <el-descriptions-item label="订单总数">{{ detailUser.orderCount }}</el-descriptions-item>
        <el-descriptions-item label="余额">{{ detailUser.balance.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ detailUser.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>
