<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useParkingStore } from '../stores/parking'
import { useOrderStore } from '../stores/order'
import SpotGrid from '../components/SpotGrid.vue'
import ReserveDialog from '../components/ReserveDialog.vue'

const route = useRoute()
const router = useRouter()
const parkingStore = useParkingStore()
const orderStore = useOrderStore()

const lotId = Number(route.params.id)
const showReserve = ref(false)
const selectedSpot = ref<any>(null)

const lotInfo = computed(() => parkingStore.currentLot || {
  id: lotId,
  name: '停车场',
  address: '',
  totalSpots: parkingStore.spots.length,
  availableSpots: parkingStore.spots.filter(s => s.status === 0).length
})

const availableCount = computed(() => parkingStore.spots.filter(s => s.status === 0).length)

onMounted(() => {
  parkingStore.fetchLotDetail(lotId)
  parkingStore.fetchSpots(lotId)
})

function onSpotClick(spot: any) {
  if (spot.status === 1) {
    ElMessage.info('该车位已被占用')
    return
  }
  selectedSpot.value = spot
  showReserve.value = true
}

async function onReserve(data: { plateNumber: string; couponId?: number }) {
  try {
    await orderStore.reserve({
      lotId,
      spotId: selectedSpot.value.id,
      plateNumber: data.plateNumber,
      couponId: data.couponId
    })
    showReserve.value = false
    ElMessage.success('预约成功，请在15分钟内入场')
  } catch {
    // handled by interceptor
  }
}
</script>

<template>
  <div v-loading="parkingStore.loading" class="page">
    <div class="back-header" @click="router.back()">
      <el-icon :size="20"><ArrowLeft /></el-icon>
      <span class="back-text">{{ lotInfo.name }}</span>
    </div>

    <div class="card lot-info">
      <div class="lot-address">
        <el-icon color="#999"><Location /></el-icon>
        <span>{{ lotInfo.address }}</span>
      </div>
      <div class="lot-stats">
        <div class="stat-item">
          <span class="stat-value available">{{ availableCount }}</span>
          <span class="stat-label">空闲</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-value">{{ lotInfo.totalSpots }}</span>
          <span class="stat-label">总车位</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-value">{{ lotInfo.totalSpots - availableCount }}</span>
          <span class="stat-label">已占用</span>
        </div>
      </div>
    </div>

    <div class="legend">
      <div class="legend-item">
        <div class="legend-dot free" />
        <span>空闲</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot occupied" />
        <span>占用</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot charging" />
        <span>充电桩</span>
      </div>
    </div>

    <SpotGrid :spots="parkingStore.spots" @spot-click="onSpotClick" />

    <ReserveDialog
      v-if="showReserve"
      v-model="showReserve"
      :spot="selectedSpot"
      :lot-name="lotInfo.name"
      @confirm="onReserve"
    />
  </div>
</template>

<style scoped>
.back-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.back-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.lot-info {
  margin-bottom: 16px;
}

.lot-address {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.lot-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-value.available {
  color: #67C23A;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #f0f0f0;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

.legend-dot.free { background: #67C23A; }
.legend-dot.occupied { background: #F56C6C; }
.legend-dot.charging { background: #409EFF; }
</style>
