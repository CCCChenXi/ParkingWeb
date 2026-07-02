<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { getUsers, getUserDetail } from '../api/admin'

const loading = ref(false)
const users = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const keyword = ref('')

const showDetail = ref(false)
const detailUser = ref<any>(null)
const detailLoading = ref(false)

async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUsers({
      page: page.value,
      size: pageSize.value,
      keyword: keyword.value || undefined
    })
    users.value = res.data.dataList
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const searchUsers = useDebounceFn(() => {
  page.value = 1
  fetchUsers()
}, 300)

function handlePageChange(p: number) {
  page.value = p
  fetchUsers()
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

    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索用户名/手机号"
        clearable
        style="width:280px"
        @input="searchUsers"
      />
    </div>

    <div class="card" v-loading="loading">
      <el-table :data="users" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="username" label="用户名" align="center" />
        <el-table-column prop="phone" label="手机号" align="center" />
        <el-table-column prop="vehicles" label="车辆数" width="80" align="center" />
        <el-table-column prop="orderCount" label="订单数" width="80" align="center" />
        <el-table-column label="余额" width="100" align="center">
          <template #default="{ row }">
            ¥{{ row.balance.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" align="center" />
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openDetail(row)">详情</el-button>
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

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
</style>
