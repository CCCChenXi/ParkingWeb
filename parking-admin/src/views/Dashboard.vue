<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getDashboard } from '../api/admin'

const loading = ref(false)
const data = ref<any>(null)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getDashboard()
    data.value = res.data
  } finally {
    loading.value = false
  }
})

const stats = computed(() => data.value ? [
  { label: '停车场总数', value: String(data.value.lotCount), icon: 'OfficeBuilding', color: '#409EFF' },
  { label: '车位总数', value: String(data.value.spotCount), icon: 'Grid', color: '#67C23A' },
  { label: '今日订单', value: String(data.value.todayOrders), icon: 'Document', color: '#E6A23C' },
  { label: '今日收入', value: '¥' + (data.value.todayRevenue || 0).toLocaleString(), icon: 'Money', color: '#F56C6C' }
] : [])

const orderTrend = computed(() => data.value?.orderTrend || [])
const revenueTrend = computed(() => data.value?.revenueTrend || [])
const recentOrders = computed(() => data.value?.recentOrders || [])

const maxOrders = computed(() => orderTrend.value.length ? Math.max(...orderTrend.value.map((d: any) => d.orders)) : 0)
const maxRevenue = computed(() => revenueTrend.value.length ? Math.max(...revenueTrend.value.map((d: any) => d.revenue)) : 0)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header">
      <h2>数据仪表盘</h2>
    </div>

    <template v-if="data">
    <div class="stat-grid">
      <div v-for="s in stats" :key="s.label" class="card stat-card">
        <div class="stat-icon" :style="{ background: s.color + '12', color: s.color }">
          <el-icon :size="28"><component :is="s.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="chart-row">
      <div class="card chart-card">
        <h3 class="chart-title">近7日订单趋势</h3>
        <div class="bar-chart">
          <div class="chart-y-axis">
            <span>{{ maxOrders }}</span>
            <span>{{ Math.round(maxOrders * 0.75) }}</span>
            <span>{{ Math.round(maxOrders * 0.5) }}</span>
            <span>{{ Math.round(maxOrders * 0.25) }}</span>
            <span>0</span>
          </div>
          <div class="chart-bars">
            <div v-for="(d, i) in orderTrend" :key="i" class="bar-group">
              <div class="bar" :style="{ height: (d.orders / maxOrders * 180) + 'px' }">
                <span class="bar-value">{{ d.orders }}</span>
              </div>
              <span class="bar-label">{{ d.date }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card chart-card">
        <h3 class="chart-title">近7日收入趋势</h3>
        <div class="bar-chart">
          <div class="chart-y-axis">
            <span>{{ (maxRevenue / 100).toFixed(0) }}百</span>
            <span>{{ (maxRevenue * 0.75 / 100).toFixed(0) }}百</span>
            <span>{{ (maxRevenue * 0.5 / 100).toFixed(0) }}百</span>
            <span>{{ (maxRevenue * 0.25 / 100).toFixed(0) }}百</span>
            <span>0</span>
          </div>
          <div class="chart-bars">
            <div v-for="(d, i) in revenueTrend" :key="i" class="bar-group">
              <div class="bar revenue" :style="{ height: (d.revenue / maxRevenue * 180) + 'px' }">
                <span class="bar-value">¥{{ d.revenue }}</span>
              </div>
              <span class="bar-label">{{ d.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="chart-title">最新订单</h3>
      <el-table :data="recentOrders" stripe style="width: 100%">
        <el-table-column prop="lotName" label="停车场" />
        <el-table-column prop="plate" label="车牌号" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === '已结算' ? 'success' : row.status === '进行中' ? 'primary' : 'warning'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="时间" />
      </el-table>
    </div>
    </template>
    <el-empty v-else-if="!loading" description="暂无数据" />
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-label {
  font-size: 13px;
  color: #999;
  margin-top: 2px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  padding: 20px;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 20px;
}

.bar-chart {
  display: flex;
  gap: 8px;
  height: 220px;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 11px;
  color: #bbb;
  text-align: right;
  padding-right: 8px;
  min-width: 40px;
}

.chart-bars {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  border-left: 1px solid #f0f0f0;
  padding-left: 8px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.bar {
  width: 28px;
  background: linear-gradient(to top, #409EFF, #7ec1ff);
  border-radius: 6px 6px 0 0;
  position: relative;
  min-height: 4px;
  transition: height 0.5s;
}

.bar.revenue {
  background: linear-gradient(to top, #67C23A, #95d475);
}

.bar-value {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

.bar-label {
  font-size: 11px;
  color: #999;
}
</style>
