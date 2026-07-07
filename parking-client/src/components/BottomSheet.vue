<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = ref(false)

watch(() => props.modelValue, (v) => {
  visible.value = v
})

function close() {
  visible.value = false
  emit('update:modelValue', false)
}

function onOverlayClick() {
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="visible" class="bottom-sheet-overlay" @click.self="onOverlayClick">
        <div class="bottom-sheet-panel" @click.stop>
          <div class="sheet-handle" />
          <div class="sheet-header">
            <span class="sheet-title">优惠券详情</span>
            <span class="sheet-close" @click="close">✕</span>
          </div>
          <div class="sheet-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.bottom-sheet-panel {
  width: 100%;
  max-width: 430px;
  max-height: 75vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease-out;
}
.sheet-handle {
  width: 36px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  margin: 8px auto 0;
  flex-shrink: 0;
}
.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 8px;
  flex-shrink: 0;
}
.sheet-title {
  font-size: 16px;
  font-weight: 600;
}
.sheet-close {
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}
.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px 24px;
}
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
