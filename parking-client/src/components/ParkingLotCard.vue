<script setup lang="ts">
defineProps<{
  lot: {
    id: number
    name: string
    address: string
    totalSpots: number
    availableSpots: number
    distance?: string
    status: number
  }
}>()
</script>

<template>
  <div class="card lot-card">
    <div class="lot-top">
      <div class="lot-name">{{ lot.name }}</div>
      <div class="lot-distance">
        <el-icon color="#999"><Location /></el-icon>
        {{ lot.distance }}
      </div>
    </div>
    <div class="lot-address">
      <el-icon color="#ccc"><OfficeBuilding /></el-icon>
      {{ lot.address }}
    </div>
    <div class="lot-bottom">
      <div class="lot-spots">
        <span class="available-count">{{ lot.availableSpots }}</span>
        <span class="spot-unit">空闲 / {{ lot.totalSpots }} 总</span>
      </div>
      <div class="lot-status">
        <span v-if="lot.availableSpots > 0" class="status-badge open">营业中</span>
        <span v-else class="status-badge full">已满</span>
      </div>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: (lot.totalSpots ? ((lot.totalSpots - lot.availableSpots) / lot.totalSpots * 100) : 0) + '%' }" />
    </div>
  </div>
</template>

<style scoped>
.lot-card {
  cursor: pointer;
  transition: transform 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.lot-card:active {
  transform: scale(0.98);
}

.lot-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.lot-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.lot-distance {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 2px;
}

.lot-address {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.lot-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.lot-spots {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.available-count {
  font-size: 20px;
  font-weight: 700;
  color: #67C23A;
}

.spot-unit {
  font-size: 12px;
  color: #999;
}

.status-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
}

.status-badge.open {
  background: #e1f3d8;
  color: #67C23A;
}

.status-badge.full {
  background: #fde2e2;
  color: #F56C6C;
}

.progress-bar {
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #67C23A, #E6A23C);
  border-radius: 2px;
  transition: width 0.3s;
}
</style>
