<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useParkingStore } from '../stores/parking'
import type { ParkingLot } from '../stores/parking'
import ParkingLotCard from '../components/ParkingLotCard.vue'
import NearbyMap from '../components/NearbyMap.vue'

const router = useRouter()
const parkingStore = useParkingStore()

const radiusOptions = [
  { label: '1km', value: 1000 },
  { label: '3km', value: 3000 },
  { label: '5km', value: 5000 },
  { label: '7km', value: 7000 },
  { label: '10km', value: 10000 },
  { label: '15km', value: 15000 },
]
const radius = ref(5000)

const searchQuery = ref('')
const userLng = ref(113.95)
const userLat = ref(22.54)
const locationGranted = ref(false)
const requesting = ref(false)

function haversineKm(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function requestLocation() {
  if (!navigator.geolocation) return
  requesting.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLng.value = pos.coords.longitude
      userLat.value = pos.coords.latitude
      locationGranted.value = true
      requesting.value = false
    },
    () => { requesting.value = false },
    { enableHighAccuracy: true }
  )
}

onMounted(() => {
  parkingStore.fetchAllLots()
  requestLocation()
})

const filteredLots = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return parkingStore.parkingLots
  return parkingStore.parkingLots.filter(
    lot => lot.name.toLowerCase().includes(q) || lot.address.toLowerCase().includes(q)
  )
})

const nearbyLots = computed<(ParkingLot & { distance: string })[]>(() => {
  if (!locationGranted.value) return []
  const lots = parkingStore.parkingLots.map(lot => {
    const km = haversineKm(userLng.value, userLat.value, lot.longitude, lot.latitude)
    return { ...lot, _km: km, distance: km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km` }
  })
  return lots.filter(l => l._km * 1000 <= radius.value).sort((a, b) => a._km - b._km)
})

function goDetail(id: number) {
  router.push(`/parking-lot/${id}`)
}
</script>

<template>
  <div v-loading="parkingStore.loading" class="page">
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索停车场"
        :prefix-icon="'Search'"
        clearable
        size="large"
      />
    </div>

    <NearbyMap
      v-if="filteredLots.length"
      :lots="filteredLots"
      :center-lng="userLng"
      :center-lat="userLat"
      @select="goDetail"
    />

    <div class="nearby-section">
      <div class="section-title">
        <span>附近停车场</span>
        <el-dropdown v-if="locationGranted" trigger="click" @command="(v: number) => radius = v">
          <el-button size="small" round class="radius-btn">
            {{ radiusOptions.find(o => o.value === radius)?.label }}
            <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="opt in radiusOptions" :key="opt.value" :command="opt.value">
                <span>{{ opt.label }}</span>
                <el-icon v-if="radius === opt.value" style="margin-left: 8px; color: #409EFF;"><Check /></el-icon>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div v-if="requesting" class="location-prompt">
        <el-icon class="spin"><Loading /></el-icon>
        <span>获取位置中...</span>
      </div>

      <div v-else-if="!locationGranted" class="location-prompt">
        <el-icon color="#999"><Location /></el-icon>
        <span>开启位置权限可查看附近停车场</span>
        <el-button type="primary" round size="small" @click="requestLocation">获取位置</el-button>
      </div>

      <div v-else-if="nearbyLots.length === 0" class="location-prompt">
        <span>附近 {{ radiusOptions.find(o => o.value === radius)?.label }} 内暂无停车场</span>
      </div>

      <div v-else class="lot-list">
        <ParkingLotCard
          v-for="lot in nearbyLots"
          :key="lot.id"
          :lot="lot"
          @click="goDetail(lot.id)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  margin-bottom: 20px;
}

.search-bar :deep(.el-input__wrapper) {
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
}

.search-bar :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.radius-btn {
  background: #fff;
  border: 1px solid #b3d8ff;
  color: #409EFF;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 16px;
}

.radius-btn:hover {
  background: #ecf5ff;
  border-color: #409EFF;
  color: #409EFF;
}

.nearby-section {
  margin-top: 16px;
}

.location-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 16px;
  background: #fafafa;
  border-radius: 12px;
  font-size: 13px;
  color: #999;
}

.lot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spin {
  animation: rotating 1s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
