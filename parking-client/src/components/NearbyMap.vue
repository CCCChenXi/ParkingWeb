<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  lots: { id: number; name: string; longitude: number; latitude: number }[]
  centerLng: number
  centerLat: number
}>()

const emit = defineEmits<{ (e: 'select', id: number): void }>()

const mapContainer = ref<HTMLDivElement>()
let map: any
let markers: any[] = []

function initMap() {
  map = new AMap.Map(mapContainer.value!, {
    zoom: 14,
    center: [props.centerLng, props.centerLat],
    mapStyle: 'amap://styles/light',
    features: ['bg', 'road', 'building', 'point'],
  })
  renderMarkers()
}

function renderMarkers() {
  if (!map) return
  markers.forEach(m => map.remove(m))
  markers = []

  props.lots.forEach(lot => {
    if (!lot.longitude || !lot.latitude) return
    const marker = new AMap.Marker({
      position: [lot.longitude, lot.latitude],
      label: {
        content: `<div style="background:#409EFF;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.2)">${lot.name}</div>`,
        direction: 'top',
        offset: new AMap.Pixel(0, -4),
      },
    })
    marker.on('click', () => emit('select', lot.id))
    map.add(marker)
    markers.push(marker)
  })

  if (markers.length) {
    map.setFitView(markers, false, [40, 40, 40, 40])
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

watch(() => props.lots, renderMarkers, { deep: true })
</script>

<template>
  <div ref="mapContainer" class="nearby-map" />
</template>

<style scoped>
.nearby-map {
  width: 100%;
  height: 250px;
  border-radius: 12px;
  border: 1px solid #eee;
  overflow: hidden;
  margin-bottom: 16px;
}
</style>
