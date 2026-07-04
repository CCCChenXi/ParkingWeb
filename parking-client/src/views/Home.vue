<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useParkingStore } from '../stores/parking'
import ParkingLotCard from '../components/ParkingLotCard.vue'
import NearbyMap from '../components/NearbyMap.vue'

const router = useRouter()
const parkingStore = useParkingStore()

const locationName = ref('获取位置中...')
const searchQuery = ref('')

const radiusOptions = [
  { label: '1km', value: 1000 },
  { label: '3km', value: 3000 },
  { label: '5km', value: 5000 },
  { label: '7km', value: 7000 },
  { label: '10km', value: 10000 },
  { label: '15km', value: 15000 },
  { label: '25km', value: 25000 },
  { label: '35km', value: 35000 },
  { label: '50km', value: 50000 }
]
const radius = ref(5000)
const radiusText = computed(() => radiusOptions.find(o => o.value === radius.value)?.label || `${radius.value}m`)

function fetchWithRadius(r: number) {
  radius.value = r
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => { parkingStore.fetchNearbyLots(pos.coords.longitude, pos.coords.latitude, r) },
      () => { parkingStore.fetchNearbyLots(113.95, 22.54, r) }
    )
  } else {
    parkingStore.fetchNearbyLots(113.95, 22.54, r)
  }
}

const filteredLots = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return parkingStore.parkingLots
  return parkingStore.parkingLots.filter(
    lot => lot.name.toLowerCase().includes(q) || lot.address.toLowerCase().includes(q)
  )
})

onMounted(() => {
  locationName.value = '深圳·科技园'
  fetchWithRadius(radius.value)
})

function onSearch() {
  // filteredLots is computed, no-op needed
}

function goDetail(id: number) {
  router.push(`/parking-lot/${id}`)
}
</script>

<template>
  <div v-loading="parkingStore.loading" class="page">
    <div class="location-bar">
      <el-icon color="#409EFF"><LocationFilled /></el-icon>
      <span class="location-text">{{ locationName }}</span>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索停车场"
        :prefix-icon="'Search'"
        clearable
        size="large"
        @input="onSearch"
      />
    </div>

    <NearbyMap
      v-if="filteredLots.length"
      :lots="filteredLots"
      :center-lng="113.95"
      :center-lat="22.54"
      @select="goDetail"
    />

    <div class="section-title">
      <div class="section-left">
        <span>附近停车场</span>
        <el-dropdown trigger="click" @command="fetchWithRadius">
          <el-button size="small" round class="radius-btn">
            {{ radiusText }}
            <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="opt in radiusOptions" :key="opt.value" :command="opt.value" :class="{ 'is-active': radius === opt.value }">
                <span>{{ opt.label }}</span>
                <el-icon v-if="radius === opt.value" style="margin-left: 8px; color: #409EFF;"><Check /></el-icon>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <span class="subtitle">共 {{ filteredLots.length }} 个</span>
    </div>

    <div class="lot-list">
      <ParkingLotCard
        v-for="lot in filteredLots"
        :key="lot.id"
        :lot="lot"
        @click="goDetail(lot.id)"
      />
    </div>

    <div v-if="filteredLots.length === 0" class="empty-state">
      <el-empty description="暂无停车场信息" />
    </div>
  </div>
</template>

<style scoped>
.location-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.location-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

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
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.subtitle {
  font-size: 12px;
  font-weight: 400;
  color: #999;
}

.section-left {
  display: flex;
  align-items: center;
}

.radius-btn {
  background: #fff;
  border: 1px solid #b3d8ff;
  color: #409EFF;
  font-size: 12px;
  padding: 4px 12px;
  margin-left: 8px;
  border-radius: 16px;
}
.radius-btn:hover {
  background: #ecf5ff;
  border-color: #409EFF;
  color: #409EFF;
}
:deep(.is-active) {
  color: #409EFF;
  font-weight: 600;
}

.lot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  margin-top: 60px;
}
</style>
