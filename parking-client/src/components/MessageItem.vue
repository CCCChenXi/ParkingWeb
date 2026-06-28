<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  message: {
    id: number
    title: string
    content: string
    type: number
    isRead: number
    createTime: string
  }
}>()

const emit = defineEmits<{
  (e: 'markRead', id: number): void
}>()

const typeIcon = computed(() => {
  const icons: Record<number, string> = {
    0: 'CircleCheck',
    1: 'CaretRight',
    2: 'Finished',
    3: 'Bell'
  }
  return icons[props.message.type] || 'Bell'
})

const typeColor = computed(() => {
  const colors: Record<number, string> = {
    0: '#409EFF',
    1: '#67C23A',
    2: '#E6A23C',
    3: '#909399'
  }
  return colors[props.message.type] || '#909399'
})
</script>

<template>
  <div class="card message-item" :class="{ unread: message.isRead === 0 }" @click="emit('markRead', message.id)">
    <div class="msg-dot" v-if="message.isRead === 0" />
    <div class="msg-icon" :style="{ background: typeColor + '15', color: typeColor }">
      <el-icon :size="18"><component :is="typeIcon" /></el-icon>
    </div>
    <div class="msg-content">
      <div class="msg-title">{{ message.title }}</div>
      <div class="msg-body">{{ message.content }}</div>
      <div class="msg-time">{{ message.createTime }}</div>
    </div>
  </div>
</template>

<style scoped>
.message-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  position: relative;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s;
}

.message-item:active {
  background: #fafafa;
}

.message-item.unread {
  background: #f0f7ff;
}

.msg-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409EFF;
  position: absolute;
  top: 16px;
  left: 16px;
}

.msg-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.msg-content {
  flex: 1;
  min-width: 0;
}

.msg-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.msg-body {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px;
}

.msg-time {
  font-size: 11px;
  color: #ccc;
}
</style>
