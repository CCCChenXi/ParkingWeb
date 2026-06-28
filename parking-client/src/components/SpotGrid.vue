<script setup lang="ts">
defineProps<{
  spots: Array<{
    id: number
    spotNumber: string
    type: number
    status: number
  }>
}>()

const emit = defineEmits<{
  (e: 'spotClick', spot: any): void
}>()

function getSpotClass(spot: any) {
  if (spot.status === 1) {
    return spot.type === 2 ? 'spot-charging-occupied' : 'spot-occupied'
  }
  if (spot.type === 2) return 'spot-charging'
  if (spot.type === 1) return 'spot-large'
  return 'spot-free'
}

function getSpotLabel(spot: any) {
  if (spot.type === 2) return '⚡'
  return ''
}
</script>

<template>
  <div class="spot-grid">
    <div
      v-for="spot in spots"
      :key="spot.id"
      class="spot-cell"
      :class="[getSpotClass(spot), { clickable: spot.status === 0 }]"
      @click="emit('spotClick', spot)"
    >
      <span class="spot-number">{{ spot.spotNumber }}</span>
      <span v-if="getSpotLabel(spot)" class="spot-label">{{ getSpotLabel(spot) }}</span>
    </div>
  </div>
</template>

<style scoped>
.spot-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}

.spot-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 52px;
  border-radius: 10px;
  font-size: 11px;
  gap: 1px;
  transition: all 0.15s;
  user-select: none;
}

.spot-cell.clickable {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.spot-cell.clickable:active {
  transform: scale(0.92);
}

.spot-free {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.spot-occupied {
  background: #fbe9e7;
  color: #c62828;
  border: 1px solid #ffccbc;
  cursor: default !important;
}

.spot-charging {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #bbdefb;
}

.spot-charging-occupied {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
  cursor: default !important;
}

.spot-large {
  background: #fff8e1;
  color: #e65100;
  border: 1px solid #ffe0b2;
}

.spot-number {
  font-weight: 600;
  font-size: 10px;
}

.spot-label {
  font-size: 12px;
}
</style>
