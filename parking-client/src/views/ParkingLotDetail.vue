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
const showActionPicker = ref(false)
const showReserve = ref(false)
const actionMode = ref<'reserve' | 'enter'>('reserve')
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
  showActionPicker.value = true
}

function chooseAction(mode: 'reserve' | 'enter') {
  actionMode.value = mode
  showActionPicker.value = false
  showReserve.value = true
}

async function onReserve(data: { plateNumber: string }) {
  try {
    if (actionMode.value === 'reserve') {
      await orderStore.reserve({
        lotId,
        spotId: selectedSpot.value.id,
        seq: selectedSpot.value.seq,
        plateNumber: data.plateNumber
      })
      showReserve.value = false
      ElMessage.success('预约成功，请在15分钟内入场')
    } else {
      await orderStore.directEnter({
        lotId,
        spotId: selectedSpot.value.id,
        seq: selectedSpot.value.seq,
        plateNumber: data.plateNumber
      })
      showReserve.value = false
      parkingStore.fetchSpots(lotId)
      ElMessage.success('已入场，开始计时计费')
    }
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
        <span>标准</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot large" />
        <span>大型</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot charging" />
        <span>充电</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot occupied" />
        <span>占用</span>
      </div>
    </div>

    <SpotGrid :spots="parkingStore.spots" @spot-click="onSpotClick" />

    <div v-if="showActionPicker" class="dialog-overlay" @click.self="showActionPicker = false">
      <div class="action-picker">
        <div class="action-header">选择操作</div>
        <div class="action-info">
          <span>车位 {{ selectedSpot?.spotNumber }}</span>
          <span class="action-type">{{ selectedSpot?.type === 2 ? '新能源充电桩' : selectedSpot?.type === 1 ? '大型车位' : '标准车位' }}</span>
        </div>
        <div class="action-buttons">
          <el-button class="action-btn reserve-btn" round @click="chooseAction('reserve')">
            <div class="btn-top">
              <el-icon :size="16"><Clock /></el-icon>
              <span>预约车位</span>
            </div>
            <small>保留15分钟</small>
          </el-button>
          <el-button class="action-btn enter-btn" type="primary" round @click="chooseAction('enter')">
            <div class="btn-top">
              <el-icon :size="16"><Switch /></el-icon>
              <span>立即停车</span>
            </div>
            <small>直接入场</small>
          </el-button>
        </div>
        <el-button class="action-cancel" text @click="showActionPicker = false">取消</el-button>
      </div>
    </div>

    <ReserveDialog
      v-if="showReserve"
      v-model="showReserve"
      :spot="selectedSpot"
      :lot-name="lotInfo.name"
      :mode="actionMode"
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
.legend-dot.large { background: #ffc107; }
.legend-dot.charging { background: #409EFF; }
.legend-dot.occupied { background: #F56C6C; }

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.action-picker {
  width: 430px;
  max-width: 100%;
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  padding: 20px 16px;
  animation: slideUp 0.25s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.action-header {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.action-info {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.action-type {
  color: #409EFF;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 8px;
  width: 100%;
}

.action-btn :deep(span) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 100%;
  height: 100%;
}

.btn-top {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  flex: 1;
  height: 60px;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 0;
}

.action-btn small {
  font-size: 10px;
  font-weight: 400;
  opacity: 0.65;
  line-height: 1.3;
}

.reserve-btn {
  border: 1px solid #e8e8e8;
  color: #333;
  background: #fafafa;
}

.enter-btn {
  color: #fff;
}

.action-cancel {
  color: #999;
  font-size: 13px;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
