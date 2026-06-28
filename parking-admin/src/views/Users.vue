<script setup lang="ts">
import { ref, onMounted } from 'vue'

const users = ref([
  { id: 1, username: '张三', phone: '13800138001', vehicles: 2, orderCount: 15, balance: 128.50, createTime: '2026-01-15' },
  { id: 2, username: '李四', phone: '13800138002', vehicles: 1, orderCount: 8, balance: 56.00, createTime: '2026-02-20' },
  { id: 3, username: '王五', phone: '13800138003', vehicles: 2, orderCount: 23, balance: 200.00, createTime: '2026-03-10' },
  { id: 4, username: '赵六', phone: '13800138004', vehicles: 1, orderCount: 5, balance: 33.50, createTime: '2026-04-05' },
  { id: 5, username: '孙七', phone: '13800138005', vehicles: 3, orderCount: 42, balance: 500.00, createTime: '2026-01-01' },
  { id: 6, username: '周八', phone: '13800138006', vehicles: 1, orderCount: 2, balance: 10.00, createTime: '2026-05-20' }
])

const showDetail = ref(false)
const detailUser = ref<any>(null)

onMounted(() => {})

function openDetail(row: any) {
  detailUser.value = row
  showDetail.value = true
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <div class="card">
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

    <el-dialog v-model="showDetail" title="用户详情" width="450px" destroy-on-close>
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
