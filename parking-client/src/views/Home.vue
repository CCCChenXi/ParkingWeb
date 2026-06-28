<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useParkingStore } from '../stores/parking'
import ParkingLotCard from '../components/ParkingLotCard.vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const parkingStore = useParkingStore()
const userStore = useUserStore()

const locationName = ref('获取位置中...')
const searchQuery = ref('')

const filteredLots = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return parkingStore.parkingLots
  return parkingStore.parkingLots.filter(
    lot => lot.name.toLowerCase().includes(q) || lot.address.toLowerCase().includes(q)
  )
})

onMounted(() => {
  locationName.value = '深圳·科技园'
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        parkingStore.fetchNearbyLots(pos.coords.longitude, pos.coords.latitude)
      },
      () => {
        parkingStore.fetchNearbyLots(113.95, 22.54)
      }
    )
  } else {
    parkingStore.fetchNearbyLots(113.95, 22.54)
  }
  if (!userStore.isLoggedIn) {
    router.push('/login')
  }
})

function onSearch() {
  // filteredLots is computed, no-op needed
}

function goDetail(id: number) {
  router.push(`/parking-lot/${id}`)
}
</script>

<template>
  <div class="page">
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

    <div class="section-title">
      <span>附近停车场</span>
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

.lot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  margin-top: 60px;
}
</style>
