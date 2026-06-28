<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ lng?: number; lat?: number }>()
const emit = defineEmits<{ (e: 'update:lng', v: number): void; (e: 'update:lat', v: number): void }>()

const mapContainer = ref<HTMLDivElement>()
const searchText = ref('')
const searching = ref(false)

let map: any
let marker: any

function initMap() {
  map = new AMap.Map(mapContainer.value!, {
    zoom: 15,
    center: [113.95, 22.54],
    mapStyle: 'amap://styles/light',
  })

  if (props.lng && props.lat) {
    placeMarker([props.lng, props.lat])
    map.setCenter([props.lng, props.lat])
  }

  map.on('click', (e: any) => {
    placeMarker([e.lnglat.lng, e.lnglat.lat])
  })
}

function placeMarker(pos: [number, number]) {
  if (!marker) {
    marker = new AMap.Marker({ position: pos, draggable: true })
    map.add(marker)
    marker.on('dragend', () => {
      const p = marker.getPosition()
      emit('update:lng', p.lng)
      emit('update:lat', p.lat)
    })
  } else {
    marker.setPosition(pos)
  }
  emit('update:lng', pos[0])
  emit('update:lat', pos[1])
}

async function handleSearch() {
  const keyword = searchText.value.trim()
  if (!keyword) return
  searching.value = true
  try {
    const ps = new AMap.PlaceSearch({ city: '深圳' })
    ps.search(keyword, (status: string, result: any) => {
      searching.value = false
      const list = result.poiList || result.poi_list
      if (status !== 'complete' || !list?.pois?.length) {
        searchText.value = ''
        return
      }
      const poi = list.pois[0]
      const pos = poi.location
      placeMarker([pos.lng, pos.lat])
      map.setCenter([pos.lng, pos.lat])
      map.setZoom(16)
    })
  } catch {
    searching.value = false
  }
}

onMounted(() => {
  if (window.AMap) {
    initMap()
  } else {
    const timer = setInterval(() => {
      if (window.AMap) {
        clearInterval(timer)
        initMap()
      }
    }, 200)
  }
})
</script>

<template>
  <div class="map-picker">
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索地址"
        size="small"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button :loading="searching" @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>
    <div ref="mapContainer" class="map-container" />
    <div class="hint">点击地图或拖动标记选择位置</div>
  </div>
</template>

<style scoped>
.map-picker {
  margin-top: 8px;
}
.search-bar {
  margin-bottom: 8px;
}
.map-container {
  width: 100%;
  height: 280px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
}
.hint {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}
</style>
